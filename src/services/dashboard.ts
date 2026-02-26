import { createClient } from "@/lib/supabase/client";
import type { DashboardOverview, SalesData, ReturnTrend } from "@/types/database";
import dayjs from "dayjs";
import { isMockMode, getMockSkus, getMockChannels, getMockReturnTrends } from "@/lib/mock-mode";

const supabase = isMockMode ? null : createClient();

export async function getTenantId(): Promise<string | null> {
  if (isMockMode) return "mock-tenant-001";
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return null;
  const { data } = await supabase!.from("users").select("tenant_id").eq("auth_id", user.id).single();
  return data?.tenant_id ?? null;
}

export async function getDashboardOverview(tenantId: string): Promise<DashboardOverview> {
  if (isMockMode) {
    const skus = getMockSkus();
    const totalInv = skus.reduce((s,k) => s + k.inventory.total_quantity, 0);
    return { total_skus: skus.length, total_inventory: totalInv,
      low_stock_count: skus.filter(k => k.inventory.total_quantity > 0 && k.inventory.total_quantity <= 10).length,
      out_of_stock_count: skus.filter(k => k.inventory.total_quantity === 0).length };
  }
  const { count: totalSkus } = await supabase!.from("skus").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { data: inventoryData } = await supabase!.from("inventory").select("total_quantity, alert_threshold").eq("tenant_id", tenantId);
  const totalInventory = inventoryData?.reduce((sum, i) => sum + i.total_quantity, 0) ?? 0;
  return { total_skus: totalSkus ?? 0, total_inventory: totalInventory,
    low_stock_count: inventoryData?.filter(i => i.total_quantity > 0 && i.total_quantity <= i.alert_threshold).length ?? 0,
    out_of_stock_count: inventoryData?.filter(i => i.total_quantity === 0).length ?? 0 };
}

export async function getSalesData(tenantId: string, _days: number = 7): Promise<SalesData[]> {
  const chs = isMockMode ? getMockChannels() : (await supabase!.from("channels").select("id, platform, shop_name").eq("tenant_id", tenantId)).data ?? [];
  return chs.map((ch: any) => ({ channel: ch.shop_name, platform: ch.platform, orders: Math.floor(Math.random()*200)+20, revenue: Math.floor(Math.random()*30000)+3000 }));
}

export async function getReturnTrends(_tenantId: string, days: number = 30): Promise<ReturnTrend[]> {
  return getMockReturnTrends(days);
}

export async function getTodoItems(tenantId: string) {
  if (isMockMode) {
    const skus = getMockSkus();
    return {
      lowStockItems: skus.filter(s=>s.inventory.total_quantity>0&&s.inventory.total_quantity<=10).slice(0,5).map(s=>({sku_id:s.id,total_quantity:s.inventory.total_quantity,alert_threshold:10,skus:{name:s.name,sku_code:s.sku_code}})),
      failedSyncs: [{id:"f1",channel_id:"ch-1",error_message:"部分SKU同步超时",channels:{shop_name:"张姐日用品专营店"}}],
      pendingReturns: [{id:"r1",buyer_name:"张三",refund_amount:156.00},{id:"r2",buyer_name:"李四",refund_amount:89.00}],
    };
  }
  const { data: lowStockItems } = await supabase!.from("inventory").select("sku_id, total_quantity, alert_threshold, skus(name, sku_code)").eq("tenant_id", tenantId).lte("total_quantity", 10).gt("total_quantity", 0).limit(5);
  const { data: failedSyncs } = await supabase!.from("sync_tasks").select("id, channel_id, error_message, channels(shop_name)").eq("tenant_id", tenantId).eq("status", "failed").order("created_at", { ascending: false }).limit(5);
  const { data: pendingReturns } = await supabase!.from("return_records").select("id, buyer_name, refund_amount").eq("tenant_id", tenantId).eq("status", "pending").limit(5);
  return { lowStockItems: lowStockItems ?? [], failedSyncs: failedSyncs ?? [], pendingReturns: pendingReturns ?? [] };
}
