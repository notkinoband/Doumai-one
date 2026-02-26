import { createClient } from "@/lib/supabase/client";
import type { Sku, Inventory, InventoryLog, InventoryChangeType } from "@/types/database";
import { isMockMode, getMockSkus } from "@/lib/mock-mode";

const supabase = isMockMode ? null : createClient();
let mockSkuData = getMockSkus();

interface SkuListParams {
  tenantId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  stockStatus?: "normal" | "low" | "out";
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

interface SkuListResult {
  data: Sku[];
  total: number;
}

export async function getSkuList(params: SkuListParams): Promise<SkuListResult> {
  const { tenantId, page = 1, pageSize = 20, search, status, stockStatus, sortField = "created_at", sortOrder = "desc" } = params;

  if (isMockMode) {
    let filtered = [...mockSkuData] as any[];
    if (search) filtered = filtered.filter(s => s.name.includes(search) || s.sku_code.includes(search));
    if (stockStatus === "out") filtered = filtered.filter(s => s.inventory.total_quantity === 0);
    else if (stockStatus === "low") filtered = filtered.filter(s => s.inventory.total_quantity > 0 && s.inventory.total_quantity <= 10);
    else if (stockStatus === "normal") filtered = filtered.filter(s => s.inventory.total_quantity > 10);
    const start = (page-1)*pageSize;
    return { data: filtered.slice(start, start+pageSize) as Sku[], total: filtered.length };
  }

  let query = supabase!
    .from("skus")
    .select("*, product:products(*), inventory(*), channel_mappings:channel_sku_mappings(*, channel:channels(*))", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku_code.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  query = query.order(sortField, { ascending: sortOrder === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  let filtered = data ?? [];
  if (stockStatus && filtered.length > 0) {
    filtered = filtered.filter((sku) => {
      const inv = Array.isArray(sku.inventory) ? sku.inventory[0] : sku.inventory;
      if (!inv) return stockStatus === "out";
      if (stockStatus === "out") return inv.total_quantity === 0;
      if (stockStatus === "low") return inv.total_quantity > 0 && inv.total_quantity <= inv.alert_threshold;
      return inv.total_quantity > inv.alert_threshold;
    });
  }

  return { data: filtered as Sku[], total: count ?? 0 };
}

export async function updateInventory(
  skuId: string,
  tenantId: string,
  changeType: InventoryChangeType,
  quantity: number,
  reason?: string
): Promise<Inventory> {
  if (isMockMode) {
    const sku = mockSkuData.find(s => s.id === skuId);
    if (!sku) throw new Error("SKU not found");
    const inv = sku.inventory;
    const before = inv.total_quantity;
    let newTotal = changeType === "manual_adjust" ? quantity : changeType === "order_deduct" ? Math.max(0, before - Math.abs(quantity)) : before + Math.abs(quantity);
    inv.total_quantity = newTotal; inv.available_quantity = newTotal;
    return inv as Inventory;
  }
  const { data: current, error: fetchError } = await supabase!
    .from("inventory")
    .select("*")
    .eq("sku_id", skuId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !current) throw new Error("库存记录不存在");

  let newTotal: number;
  if (changeType === "manual_adjust") {
    newTotal = quantity;
  } else if (changeType === "order_deduct") {
    newTotal = Math.max(0, current.total_quantity - Math.abs(quantity));
  } else {
    newTotal = current.total_quantity + Math.abs(quantity);
  }

  const changeQty = newTotal - current.total_quantity;

  const { data: updated, error: updateError } = await supabase!
    .from("inventory")
    .update({
      total_quantity: newTotal,
      available_quantity: newTotal - current.allocated_quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError) throw updateError;

  await supabase!.from("inventory_logs").insert({
    sku_id: skuId,
    tenant_id: tenantId,
    change_type: changeType,
    change_quantity: changeQty,
    before_quantity: current.total_quantity,
    after_quantity: newTotal,
    reason: reason || null,
  });

  return updated as Inventory;
}

export async function batchUpdateInventory(
  tenantId: string,
  skuIds: string[],
  operation: "set" | "increase" | "decrease",
  quantity: number,
  reason?: string
) {
  const results = [];
  for (const skuId of skuIds) {
    let changeType: InventoryChangeType = "manual_adjust";
    let qty = quantity;
    if (operation === "decrease") {
      changeType = "order_deduct";
      qty = quantity;
    } else if (operation === "increase") {
      changeType = "return_restore";
      qty = quantity;
    }
    const result = await updateInventory(skuId, tenantId, changeType, qty, reason);
    results.push(result);
  }
  return results;
}

export async function getInventoryLogs(skuId: string, tenantId: string, limit = 50): Promise<InventoryLog[]> {
  if (isMockMode) return [{id:"log-1",sku_id:skuId,tenant_id:tenantId,change_type:"import",change_quantity:100,before_quantity:0,after_quantity:100,source_channel:null,source_order_id:null,operator_id:null,reason:"初始导入",created_at:new Date().toISOString()}] as InventoryLog[];
  const { data, error } = await supabase!
    .from("inventory_logs")
    .select("*")
    .eq("sku_id", skuId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as InventoryLog[];
}

export async function updateAlertThreshold(skuId: string, tenantId: string, threshold: number) {
  if (isMockMode) { const s = mockSkuData.find(s=>s.id===skuId); if(s) s.inventory.alert_threshold=threshold; return; }
  const { error } = await supabase!
    .from("inventory")
    .update({ alert_threshold: threshold })
    .eq("sku_id", skuId)
    .eq("tenant_id", tenantId);

  if (error) throw error;
}
