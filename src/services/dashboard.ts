import { createClient } from "@/lib/supabase/client";
import type { DashboardOverview, SalesData, ReturnTrend } from "@/types/database";
import dayjs from "dayjs";

const supabase = createClient();

export async function getTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("tenant_id").eq("auth_id", user.id).single();
  return data?.tenant_id ?? null;
}

export async function getDashboardOverview(tenantId: string): Promise<DashboardOverview> {
  const { count: totalSkus } = await supabase.from("skus").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { data: inventoryData } = await supabase.from("inventory").select("total_quantity, alert_threshold").eq("tenant_id", tenantId);
  const totalInventory = inventoryData?.reduce((sum, i) => sum + i.total_quantity, 0) ?? 0;
  return {
    total_skus: totalSkus ?? 0,
    total_inventory: totalInventory,
    low_stock_count: inventoryData?.filter(i => i.total_quantity > 0 && i.total_quantity <= i.alert_threshold).length ?? 0,
    out_of_stock_count: inventoryData?.filter(i => i.total_quantity === 0).length ?? 0,
  };
}

export async function getSalesData(tenantId: string, _days: number = 7): Promise<SalesData[]> {
  const { data: chs } = await supabase.from("channels").select("id, platform, shop_name").eq("tenant_id", tenantId);
  return (chs ?? []).map((ch: { id: string; platform: string; shop_name: string }) => ({
    channel: ch.shop_name,
    platform: ch.platform as "wechat_miniprogram" | "pinduoduo",
    orders: 0,
    revenue: 0,
  }));
}

export async function getReturnTrends(tenantId: string, days: number = 30): Promise<ReturnTrend[]> {
  const start = dayjs().subtract(days, "day").format("YYYY-MM-DD");
  const { data: records } = await supabase
    .from("return_records")
    .select("created_at, refund_amount, quantity")
    .eq("tenant_id", tenantId)
    .gte("created_at", start);
  const byDate = new Map<string, { return_count: number; total_refund: number; total_orders: number }>();
  (records ?? []).forEach((r: { created_at: string; refund_amount: number | null; quantity: number }) => {
    const d = r.created_at.slice(0, 10);
    const cur = byDate.get(d) ?? { return_count: 0, total_refund: 0, total_orders: 0 };
    cur.return_count += 1;
    cur.total_refund += Number(r.refund_amount) || 0;
    cur.total_orders += 1;
    byDate.set(d, cur);
  });
  return Array.from({ length: days }, (_, i) => {
    const d = dayjs().subtract(days - 1 - i, "day").format("YYYY-MM-DD");
    const cur = byDate.get(d) ?? { return_count: 0, total_refund: 0, total_orders: 0 };
    const total_orders = Math.max(cur.total_orders, 1);
    return {
      date: d,
      return_rate: Number(((cur.return_count / total_orders) * 100).toFixed(1)),
      return_count: cur.return_count,
      total_orders: cur.total_orders,
    };
  });
}

export async function getTodoItems(tenantId: string) {
  const { data: lowStockItems } = await supabase.from("inventory").select("sku_id, total_quantity, alert_threshold, skus(name, sku_code)").eq("tenant_id", tenantId).lte("total_quantity", 10).gt("total_quantity", 0).limit(5);
  const { data: failedSyncs } = await supabase.from("sync_tasks").select("id, channel_id, error_message, channels(shop_name)").eq("tenant_id", tenantId).eq("status", "failed").order("created_at", { ascending: false }).limit(5);
  const { data: pendingReturns } = await supabase.from("return_records").select("id, buyer_name, refund_amount").eq("tenant_id", tenantId).eq("status", "pending").limit(5);
  return { lowStockItems: lowStockItems ?? [], failedSyncs: failedSyncs ?? [], pendingReturns: pendingReturns ?? [] };
}
