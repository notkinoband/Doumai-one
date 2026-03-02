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

export async function getSalesData(tenantId: string, days: number = 7): Promise<SalesData[]> {
  const since = dayjs().subtract(days, "day").startOf("day").toISOString();

  // 实际订单扣减都记录在 inventory_logs 中，这里按 tenant 聚合为「全部渠道」的真实统计
  const { data: logs, error: logsError } = await supabase
    .from("inventory_logs")
    .select("sku_id, change_quantity, created_at, change_type")
    .eq("tenant_id", tenantId)
    .eq("change_type", "order_deduct")
    .gte("created_at", since);
  if (logsError) throw logsError;

  if (!logs || logs.length === 0) {
    return [{
      channel: "全部渠道",
      platform: "pinduoduo",
      orders: 0,
      revenue: 0,
    }];
  }

  const skuIds = Array.from(new Set(logs.map((l: any) => l.sku_id)));
  const { data: skus, error: skuError } = await supabase
    .from("skus")
    .select("id, price")
    .in("id", skuIds);
  if (skuError) throw skuError;

  const priceMap = new Map<string, number>();
  (skus ?? []).forEach((s: any) => {
    priceMap.set(s.id, Number(s.price) || 0);
  });

  let orders = 0;
  let revenue = 0;
  (logs ?? []).forEach((l: any) => {
    const qty = Math.abs(Number(l.change_quantity) || 0);
    const price = priceMap.get(l.sku_id) ?? 0;
    if (qty > 0) {
      orders += 1;
      revenue += price * qty;
    }
  });

  return [{
    channel: "全部渠道",
    platform: "pinduoduo",
    orders,
    revenue: Number(revenue.toFixed(2)),
  }];
}

export async function getReturnTrends(tenantId: string, days: number = 30): Promise<ReturnTrend[]> {
  const startDate = dayjs().subtract(days - 1, "day").startOf("day");

  // 退货记录：真实退货数量
  const { data: records, error: returnsError } = await supabase
    .from("return_records")
    .select("created_at, quantity")
    .eq("tenant_id", tenantId)
    .gte("created_at", startDate.toISOString());
  if (returnsError) throw returnsError;

  // 订单记录：用 inventory_logs 中 order_deduct 估算下单件数
  const { data: orderLogs, error: orderError } = await supabase
    .from("inventory_logs")
    .select("created_at, change_quantity, change_type")
    .eq("tenant_id", tenantId)
    .eq("change_type", "order_deduct")
    .gte("created_at", startDate.toISOString());
  if (orderError) throw orderError;

  const byDate = new Map<string, { return_qty: number; order_qty: number }>();

  (records ?? []).forEach((r: any) => {
    const d = dayjs(r.created_at).format("YYYY-MM-DD");
    const cur = byDate.get(d) ?? { return_qty: 0, order_qty: 0 };
    cur.return_qty += Number(r.quantity) || 0;
    byDate.set(d, cur);
  });

  (orderLogs ?? []).forEach((l: any) => {
    const d = dayjs(l.created_at).format("YYYY-MM-DD");
    const cur = byDate.get(d) ?? { return_qty: 0, order_qty: 0 };
    cur.order_qty += Math.abs(Number(l.change_quantity) || 0);
    byDate.set(d, cur);
  });

  return Array.from({ length: days }, (_, i) => {
    const d = startDate.add(i, "day").format("YYYY-MM-DD");
    const cur = byDate.get(d) ?? { return_qty: 0, order_qty: 0 };
    const totalOrders = cur.order_qty;
    const rate = totalOrders > 0 ? (cur.return_qty / totalOrders) * 100 : 0;
    return {
      date: d,
      return_rate: Number(rate.toFixed(1)),
      return_count: cur.return_qty,
      total_orders: totalOrders,
    };
  });
}

export async function getTodoItems(tenantId: string) {
  const { data: lowStockItems } = await supabase.from("inventory").select("sku_id, total_quantity, alert_threshold, skus(name, sku_code)").eq("tenant_id", tenantId).lte("total_quantity", 10).gt("total_quantity", 0).limit(5);
  const { data: failedSyncs } = await supabase.from("sync_tasks").select("id, channel_id, error_message, channels(shop_name)").eq("tenant_id", tenantId).eq("status", "failed").order("created_at", { ascending: false }).limit(5);
  const { data: pendingReturns } = await supabase.from("return_records").select("id, buyer_name, refund_amount").eq("tenant_id", tenantId).eq("status", "pending").limit(5);
  return { lowStockItems: lowStockItems ?? [], failedSyncs: failedSyncs ?? [], pendingReturns: pendingReturns ?? [] };
}
