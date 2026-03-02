import { createClient } from "@/lib/supabase/client";
import type { Subscription, Payment, PlanType, BillingCycle } from "@/types/database";

const supabase = createClient();

export async function getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
  const { data, error } = await supabase.from("subscriptions").select("*").eq("tenant_id", tenantId).single();
  if (error) return null;
  return data as Subscription;
}

export async function getUsage(tenantId: string) {
  const { count: skuCount } = await supabase.from("skus").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { count: channelCount } = await supabase.from("channels").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).neq("status", "disconnected");
  const { count: memberCount } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  return { skuCount: skuCount ?? 0, channelCount: channelCount ?? 0, memberCount: memberCount ?? 0 };
}

export async function upgradePlan(
  tenantId: string,
  plan: PlanType,
  billingCycle: BillingCycle,
  price: number
): Promise<void> {
  const now = new Date();
  const expiresAt = billingCycle === "yearly"
    ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const { data: existing } = await supabase.from("subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .single();

  let subscriptionId: string;
  if (existing) {
    await supabase.from("subscriptions").update({
      plan,
      billing_cycle: billingCycle,
      price,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
      updated_at: now.toISOString(),
    }).eq("id", existing.id);
    subscriptionId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await supabase.from("subscriptions").insert({
      tenant_id: tenantId,
      plan,
      billing_cycle: billingCycle,
      price,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: false,
      status: "active",
    }).select("id").single();
    if (insertErr || !inserted) throw insertErr;
    subscriptionId = inserted.id;
  }

  await supabase.from("payments").insert({
    tenant_id: tenantId,
    subscription_id: subscriptionId,
    amount: price,
    payment_method: "wechat_pay",
    transaction_id: `txn_${Date.now()}`,
    type: existing ? "upgrade" : "purchase",
    status: "paid",
    paid_at: now.toISOString(),
  });
}

export async function getPayments(tenantId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Payment[];
}
