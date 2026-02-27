import { SupabaseClient } from "@supabase/supabase-js";

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
