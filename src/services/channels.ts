import { createClient } from "@/lib/supabase/client";
import type { Channel, SyncTask, SyncMode, DeductOn } from "@/types/database";

const supabase = createClient();

export async function getChannels(tenantId: string): Promise<Channel[]> {
  const { data, error } = await supabase.from("channels").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Channel[];
}

export async function addChannel(tenantId: string, platform: Channel["platform"], shopName: string): Promise<Channel> {
  const { data, error } = await supabase
    .from("channels")
    .insert({
      tenant_id: tenantId,
      platform,
      shop_name: shopName,
      shop_id: `ch_${Date.now()}`,
      status: "connected",
      sync_mode: "realtime",
      sync_interval_minutes: 5,
      deduct_on: "payment",
      return_auto_restore: true,
      last_sync_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Channel;
}

export async function updateChannelConfig(channelId: string, config: { sync_mode?: SyncMode; sync_interval_minutes?: number; deduct_on?: DeductOn; return_auto_restore?: boolean }) {
  const { error } = await supabase.from("channels")
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq("id", channelId);

  if (error) throw error;
}

export async function deleteChannel(channelId: string) {
  const { error } = await supabase.from("channels")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("id", channelId);

  if (error) throw error;
}

export async function triggerSync(tenantId: string, channelId: string): Promise<SyncTask> {
  const { data: task, error } = await supabase.from("sync_tasks")
    .insert({
      tenant_id: tenantId,
      channel_id: channelId,
      type: "manual",
      status: "processing",
      total_skus: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  setTimeout(async () => {
    await supabase.from("sync_tasks").update({
      status: "completed",
      success_count: 0,
      fail_count: 0,
      completed_at: new Date().toISOString(),
    }).eq("id", task.id);
    await supabase.from("channels").update({
      last_sync_at: new Date().toISOString(),
    }).eq("id", channelId);
  }, 2000);

  return task as SyncTask;
}

export async function getSyncLogs(tenantId: string, channelId?: string, limit = 50): Promise<SyncTask[]> {
  let query = supabase.from("sync_tasks")
    .select("*, channel:channels(shop_name, platform)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channelId) query = query.eq("channel_id", channelId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SyncTask[];
}
