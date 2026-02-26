import { createClient } from "@/lib/supabase/client";
import type { Channel, SyncTask, SyncLog, ChannelPlatform, SyncMode, DeductOn } from "@/types/database";
import { isMockMode, getMockChannels, getMockSyncLogs } from "@/lib/mock-mode";

const supabase = isMockMode ? null : createClient();
let mockChs = getMockChannels();

export async function getChannels(tenantId: string): Promise<Channel[]> {
  if (isMockMode) return mockChs as Channel[];
  const { data, error } = await supabase!.from("channels").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Channel[];
}

export async function addChannel(tenantId: string, platform: ChannelPlatform, shopName: string): Promise<Channel> {
  if (isMockMode) {
    const ch = { id:`ch-${Date.now()}`, tenant_id:tenantId, platform, shop_name:shopName, shop_id:`mock_${Date.now()}`, sync_mode:"realtime" as const, sync_interval_minutes:5, deduct_on:"payment" as const, return_auto_restore:true, status:"connected" as const, last_sync_at:new Date().toISOString(), created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
    mockChs.push(ch as any); return ch as Channel;
  }
  const { data, error } = await supabase!
    .from("channels")
    .insert({
      tenant_id: tenantId,
      platform,
      shop_name: shopName,
      shop_id: `mock_${Date.now()}`,
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
  if (isMockMode) { const ch = mockChs.find(c=>c.id===channelId); if(ch) Object.assign(ch, config); return; }
  const { error } = await supabase!.from("channels")
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq("id", channelId);

  if (error) throw error;
}

export async function deleteChannel(channelId: string) {
  if (isMockMode) { mockChs = mockChs.filter(c=>c.id!==channelId); return; }
  const { error } = await supabase!.from("channels")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("id", channelId);

  if (error) throw error;
}

export async function triggerSync(tenantId: string, channelId: string): Promise<SyncTask> {
  if (isMockMode) {
    return { id:`st-${Date.now()}`, tenant_id:tenantId, channel_id:channelId, type:"manual", status:"processing", total_skus:20, success_count:0, fail_count:0, retry_count:0, max_retries:3, error_message:null, started_at:new Date().toISOString(), completed_at:null, created_at:new Date().toISOString() } as SyncTask;
  }
  const { data: task, error } = await supabase!.from("sync_tasks")
    .insert({
      tenant_id: tenantId,
      channel_id: channelId,
      type: "manual",
      status: "processing",
      total_skus: Math.floor(Math.random() * 50) + 5,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  setTimeout(async () => {
    const successCount = task.total_skus - Math.floor(Math.random() * 3);
    const failCount = task.total_skus - successCount;
    await supabase!.from("sync_tasks").update({
      status: failCount > 0 ? "failed" : "completed",
      success_count: successCount,
      fail_count: failCount,
      completed_at: new Date().toISOString(),
      error_message: failCount > 0 ? "部分 SKU 同步超时" : null,
    }).eq("id", task.id);

    await supabase!.from("channels").update({
      last_sync_at: new Date().toISOString(),
    }).eq("id", channelId);
  }, 3000);

  return task as SyncTask;
}

export async function getSyncLogs(tenantId: string, channelId?: string, limit = 50): Promise<SyncTask[]> {
  if (isMockMode) return getMockSyncLogs() as any[];
  let query = supabase!.from("sync_tasks")
    .select("*, channel:channels(shop_name, platform)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channelId) query = query.eq("channel_id", channelId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SyncTask[];
}
