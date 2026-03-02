import { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelPlatform } from "@/types/database";

export interface OnboardingStep1 {
  storeName: string;
  category: string | null;
  skuScale: string | null;
}

export interface OnboardingStep2 {
  platforms: string[];
  globalAlertThreshold: number;
}

export interface OnboardingProduct {
  name: string;
  skuCode?: string;
  initialStock: number;
}

export interface OnboardingCompletePayload {
  step1: OnboardingStep1;
  step2: OnboardingStep2;
  products: OnboardingProduct[];
}

const PLATFORM_TO_DB: Record<string, ChannelPlatform> = {
  "拼多多": "pinduoduo",
  "自有小程序": "wechat_miniprogram",
};

/**
 * 完成初始化设置：更新租户、创建渠道、创建商品/SKU/库存，并标记用户已完成引导。
 */
export async function completeOnboarding(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  payload: OnboardingCompletePayload
) {
  const { step1, step2, products } = payload;
  // #region agent log
  fetch("http://127.0.0.1:7940/ingest/3d9809dd-8a01-479e-ad0a-89622f9b620f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0f8292" },
    body: JSON.stringify({
      sessionId: "0f8292",
      location: "onboarding.ts:completeOnboarding",
      message: "completeOnboarding step1 check",
      data: { storeName: step1?.storeName, trimmed: step1?.storeName?.trim() },
      timestamp: Date.now(),
      hypothesisId: "B2-H3",
    }),
  }).catch(() => {});
  // #endregion
  if (!step1.storeName?.trim()) throw new Error("店铺名称不能为空");
  const validProducts = products.filter((p) => p.name?.trim());
  if (validProducts.length === 0) throw new Error("请至少添加一个商品");

  await supabase
    .from("tenants")
    .update({
      name: step1.storeName.trim(),
      category: step1.category || null,
      sku_scale: step1.skuScale || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  const channelIds: string[] = [];
  for (const label of step2.platforms || []) {
    const platform = PLATFORM_TO_DB[label];
    if (!platform) continue;
    const shopNames: Record<string, string> = {
      pinduoduo: "拼多多店铺",
      wechat_miniprogram: "微信小程序店铺",
    };
    const { data: ch } = await supabase
      .from("channels")
      .insert({
        tenant_id: tenantId,
        platform,
        shop_name: shopNames[platform] || label,
        shop_id: `onboarding_${Date.now()}_${channelIds.length}`,
        sync_mode: "realtime",
        sync_interval_minutes: 5,
        deduct_on: "payment",
        return_auto_restore: true,
        status: "connected",
      })
      .select("id")
      .single();
    if (ch) channelIds.push(ch.id);
  }

  const alertThreshold = Math.max(0, Number(step2.globalAlertThreshold) || 5);

  for (let i = 0; i < validProducts.length; i++) {
    const p = validProducts[i];
    const stock = Math.max(0, Number(p.initialStock) || 0);
    const skuCode = (p.skuCode?.trim() || `SKU-${Date.now()}-${i + 1}`).slice(0, 50);

    const { data: product } = await supabase
      .from("products")
      .insert({
        tenant_id: tenantId,
        name: p.name.trim(),
        category: step1.category || null,
        status: "active",
      })
      .select("id")
      .single();
    if (!product) continue;

    const { data: sku } = await supabase
      .from("skus")
      .insert({
        product_id: product.id,
        tenant_id: tenantId,
        sku_code: skuCode,
        name: p.name.trim(),
        status: "active",
      })
      .select("id")
      .single();
    if (!sku) continue;

    await supabase.from("inventory").insert({
      sku_id: sku.id,
      tenant_id: tenantId,
      total_quantity: stock,
      allocated_quantity: 0,
      available_quantity: stock,
      alert_threshold: alertThreshold,
      allocation_strategy: "shared",
      allocation_config: null,
    });

    await supabase.from("inventory_logs").insert({
      sku_id: sku.id,
      tenant_id: tenantId,
      change_type: "import",
      change_quantity: stock,
      before_quantity: 0,
      after_quantity: stock,
      reason: "初始化设置录入",
    });

    for (const chId of channelIds) {
      await supabase.from("channel_sku_mappings").insert({
        channel_id: chId,
        sku_id: sku.id,
        tenant_id: tenantId,
        platform_product_id: `init_${product.id}`,
        platform_sku_id: `init_${sku.id}`,
        channel_quantity: stock,
      });
    }
  }

  await supabase
    .from("users")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

interface SampleItem {
  name: string;
  category: string;
  skuPrefix: string;
  price: number;
  cost: number;
}

const SAMPLE_PRODUCTS: SampleItem[] = [
  { name: "陶瓷马克杯", category: "杯壶", skuPrefix: "MKB", price: 29.9, cost: 12.0 },
  { name: "竹纤维毛巾", category: "家纺", skuPrefix: "ZXW", price: 19.9, cost: 6.5 },
  { name: "收纳盒三件套", category: "收纳", skuPrefix: "SNH", price: 39.9, cost: 15.0 },
  { name: "不锈钢保温杯", category: "杯壶", skuPrefix: "BWB", price: 59.9, cost: 22.0 },
  { name: "硅胶厨房铲套装", category: "厨具", skuPrefix: "CFT", price: 35.0, cost: 13.0 },
];

const SAMPLE_CHANNELS = [
  {
    platform: "pinduoduo" as const,
    shop_name: "我的拼多多店铺",
    shop_id: "pdd_demo",
    sync_mode: "realtime" as const,
    deduct_on: "payment" as const,
    status: "connected" as const,
  },
  {
    platform: "wechat_miniprogram" as const,
    shop_name: "我的微信小店",
    shop_id: "wx_demo",
    sync_mode: "scheduled" as const,
    deduct_on: "order" as const,
    status: "connected" as const,
  },
];

/**
 * 为新注册租户初始化示例数据：5 个商品 + 2 个渠道 + 库存 + 渠道映射。
 * 所有插入独立执行，单条失败不影响其它数据。
 */
export async function initSampleData(
  supabase: SupabaseClient,
  tenantId: string
) {
  try {
    const { data: channels } = await supabase
      .from("channels")
      .insert(SAMPLE_CHANNELS.map((ch) => ({ ...ch, tenant_id: tenantId })))
      .select("id");

    const channelIds = channels?.map((c) => c.id) ?? [];

    for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      const item = SAMPLE_PRODUCTS[i];
      const stock = 50 + Math.floor(Math.random() * 150);

      const { data: product } = await supabase
        .from("products")
        .insert({
          tenant_id: tenantId,
          name: item.name,
          category: item.category,
          status: "active",
        })
        .select("id")
        .single();

      if (!product) continue;

      const { data: sku } = await supabase
        .from("skus")
        .insert({
          product_id: product.id,
          tenant_id: tenantId,
          sku_code: `${item.skuPrefix}-${String(i + 1).padStart(3, "0")}`,
          name: item.name,
          price: item.price,
          cost: item.cost,
          status: "active",
        })
        .select("id")
        .single();

      if (!sku) continue;

      await supabase.from("inventory").insert({
        sku_id: sku.id,
        tenant_id: tenantId,
        total_quantity: stock,
        available_quantity: stock,
        alert_threshold: 10,
      });

      await supabase.from("inventory_logs").insert({
        sku_id: sku.id,
        tenant_id: tenantId,
        change_type: "import",
        change_quantity: stock,
        before_quantity: 0,
        after_quantity: stock,
        reason: "示例数据初始导入",
      });

      for (const chId of channelIds) {
        const ratio = chId === channelIds[0] ? 0.6 : 0.4;
        await supabase.from("channel_sku_mappings").insert({
          channel_id: chId,
          sku_id: sku.id,
          tenant_id: tenantId,
          platform_product_id: `demo_p_${i + 1}`,
          platform_sku_id: `demo_s_${i + 1}`,
          channel_quantity: Math.floor(stock * ratio),
        });
      }
    }
  } catch (err) {
    console.error("[onboarding] initSampleData error:", err);
  }
}
