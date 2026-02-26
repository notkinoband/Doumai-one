import { createClient } from "@/lib/supabase/client";
import type { Subscription, Payment, PlanType, BillingCycle } from "@/types/database";
import { isMockMode } from "@/lib/mock-mode";

const supabase = isMockMode ? null : createClient();
let mockSub: Subscription = { id:"sub-1", tenant_id:"mock-tenant-001", plan:"free", billing_cycle:"monthly", price:0, started_at:new Date().toISOString(), expires_at:new Date(Date.now()+86400000*365).toISOString(), auto_renew:false, status:"active", created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
let mockPayments: Payment[] = [];

export async function getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
  if (isMockMode) return mockSub;
  const { data, error } = await supabase!.from("subscriptions").select("*").eq("tenant_id", tenantId).single();
  if (error) return null;
  return data as Subscription;
}

export async function getUsage(tenantId: string) {
  if (isMockMode) return { skuCount: 20, channelCount: 2, memberCount: 1 };
  const { count: skuCount } = await supabase!.from("skus").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { count: channelCount } = await supabase!.from("channels").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).neq("status", "disconnected");
  const { count: memberCount } = await supabase!.from("users").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  return { skuCount: skuCount??0, channelCount: channelCount??0, memberCount: memberCount??0 };
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

  if (isMockMode) {
    mockSub = {...mockSub, plan, billing_cycle: billingCycle, price, started_at: now.toISOString(), expires_at: expiresAt.toISOString(), status:"active"};
    mockPayments.unshift({id:`pay-${Date.now()}`,tenant_id:tenantId,subscription_id:mockSub.id,amount:price,payment_method:"wechat_pay",transaction_id:`mock_${Date.now()}`,type:"upgrade",status:"paid",paid_at:now.toISOString(),invoice_status:"none",invoice_info:null,created_at:now.toISOString()});
    return;
  }
  const { data: existing } = await supabase!.from("subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .single();

  if (existing) {
    await supabase!.from("subscriptions").update({
      plan,
      billing_cycle: billingCycle,
      price,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
      updated_at: now.toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase!.from("subscriptions").insert({
      tenant_id: tenantId,
      plan,
      billing_cycle: billingCycle,
      price,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: false,
      status: "active",
    });
  }

  await supabase!.from("payments").insert({
    tenant_id: tenantId,
    subscription_id: existing?.id,
    amount: price,
    payment_method: "wechat_pay",
    transaction_id: `mock_${Date.now()}`,
    type: existing ? "upgrade" : "purchase",
    status: "paid",
    paid_at: now.toISOString(),
  });
}

export async function getPayments(tenantId: string): Promise<Payment[]> {
  if (isMockMode) return mockPayments;
  const { data, error } = await supabase!
    .from("payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Payment[];
}
