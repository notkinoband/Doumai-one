import { createClient } from "@/lib/supabase/client";
import type { Sku, Inventory, InventoryLog, InventoryChangeType } from "@/types/database";

const supabase = createClient();

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

  let query = supabase
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
  const { data: current, error: fetchError } = await supabase
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

  const { data: updated, error: updateError } = await supabase
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

  await supabase.from("inventory_logs").insert({
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
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from("inventory")
    .update({ alert_threshold: threshold })
    .eq("sku_id", skuId)
    .eq("tenant_id", tenantId);

  if (error) throw error;
}

export interface CreateProductPayload {
  name: string;
  image_url?: string | null;
  category?: string | null;
  sku_code?: string | null;
  price?: number | null;
  cost?: number | null;
  initial_stock?: number;
  alert_threshold?: number;
  order_hold?: number;
  return_in_transit?: number;
}

export async function createProductWithSku(
  tenantId: string,
  payload: CreateProductPayload
): Promise<{ productId: string; skuId: string }> {
  const name = payload.name?.trim();
  if (!name) throw new Error("商品名称不能为空");
  const skuCode = (payload.sku_code?.trim() || `SKU-${Date.now()}`).slice(0, 50);
  const initialStock = Math.max(0, Number(payload.initial_stock) ?? 0);
  const alertThreshold = Math.max(0, Number(payload.alert_threshold) ?? 10);
  const price = payload.price != null ? Number(payload.price) : null;
  const cost = payload.cost != null ? Number(payload.cost) : null;
  const orderHold = Math.max(0, Number(payload.order_hold) ?? 0);
  const returnInTransit = Math.max(0, Number(payload.return_in_transit) ?? 0);
  const available = Math.max(0, initialStock - orderHold - returnInTransit);

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      name,
      image_url: payload.image_url || null,
      category: payload.category || null,
      status: "active",
    })
    .select("id")
    .single();
  if (productError || !product) throw new Error("创建商品失败");

  const { data: sku, error: skuError } = await supabase
    .from("skus")
    .insert({
      product_id: product.id,
      tenant_id: tenantId,
      sku_code: skuCode,
      name,
      price,
      cost,
      status: "active",
    })
    .select("id")
    .single();
  if (skuError || !sku) throw new Error("创建 SKU 失败");

  await supabase.from("inventory").insert({
    sku_id: sku.id,
    tenant_id: tenantId,
    total_quantity: initialStock,
    allocated_quantity: 0,
    order_hold_quantity: orderHold,
    return_in_transit_quantity: returnInTransit,
    available_quantity: available,
    alert_threshold: alertThreshold,
    allocation_strategy: "shared",
    allocation_config: null,
  });

  await supabase.from("inventory_logs").insert({
    sku_id: sku.id,
    tenant_id: tenantId,
    change_type: "import",
    change_quantity: initialStock,
    before_quantity: 0,
    after_quantity: initialStock,
    reason: "新增商品",
  });

  return { productId: product.id, skuId: sku.id };
}
