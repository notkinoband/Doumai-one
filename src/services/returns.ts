import { createClient } from "@/lib/supabase/client";
import type { RiskyBuyer, BuyerBlacklist } from "@/types/database";

const supabase = createClient();

export async function getRiskyBuyers(tenantId: string): Promise<RiskyBuyer[]> {
  const { data: returns } = await supabase
    .from("return_records")
    .select("buyer_id, buyer_name, refund_amount, created_at")
    .eq("tenant_id", tenantId);

  if (!returns || returns.length === 0) return [];

  const { data: blacklist } = await supabase
    .from("buyer_blacklist")
    .select("buyer_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  const blacklistedIds = new Set(blacklist?.map((b) => b.buyer_id) ?? []);

  const buyerMap = new Map<string, RiskyBuyer>();
  returns.forEach((r: { buyer_id: string; buyer_name: string | null; refund_amount: number | null; created_at: string }) => {
    const existing = buyerMap.get(r.buyer_id);
    if (existing) {
      existing.return_count += 1;
      existing.total_refund += Number(r.refund_amount) || 0;
      if (r.created_at > existing.last_return_at) existing.last_return_at = r.created_at;
    } else {
      buyerMap.set(r.buyer_id, {
        buyer_id: r.buyer_id,
        buyer_name: r.buyer_name,
        return_count: 1,
        total_refund: Number(r.refund_amount) || 0,
        last_return_at: r.created_at,
        is_blacklisted: blacklistedIds.has(r.buyer_id),
      });
    }
  });

  return Array.from(buyerMap.values())
    .filter((b) => b.return_count >= 3)
    .sort((a, b) => b.return_count - a.return_count);
}

export async function getBlacklist(tenantId: string): Promise<BuyerBlacklist[]> {
  const { data, error } = await supabase
    .from("buyer_blacklist")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BuyerBlacklist[];
}

export async function addToBlacklist(
  tenantId: string,
  buyerId: string,
  buyerName: string | null,
  platform: string,
  reason: string,
  returnCount: number,
  returnAmount: number
) {
  const { error } = await supabase.from("buyer_blacklist").upsert(
    {
      tenant_id: tenantId,
      buyer_id: buyerId,
      buyer_name: buyerName,
      platform,
      reason,
      return_count: returnCount,
      return_amount: returnAmount,
      status: "active",
    },
    { onConflict: "tenant_id,buyer_id,platform" }
  );

  if (error) throw error;
}

export async function removeFromBlacklist(id: string) {
  const { error } = await supabase
    .from("buyer_blacklist")
    .update({ status: "removed" })
    .eq("id", id);

  if (error) throw error;
}
