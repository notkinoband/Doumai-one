export const isMockMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export const MOCK_TENANT = {
  id: "mock-tenant-001",
  name: "张姐日用品旗舰店",
  category: "日用百货",
  sku_scale: "100-500",
  status: "active" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_USER = {
  id: "mock-user-001",
  tenant_id: "mock-tenant-001",
  email: "demo@doumai.com",
  phone: null,
  nickname: "张姐",
  avatar_url: null,
  role: "admin" as const,
  onboarding_completed: true,
  last_login_at: new Date().toISOString(),
  status: "active" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProducts = [
  ["陶瓷马克杯","MKB-001",29.9,120],["竹纤维毛巾","ZXW-002",19.9,85],
  ["收纳盒三件套","SNH-003",39.9,5],["不锈钢保温杯","BWB-004",59.9,200],
  ["硅胶厨房铲","CFT-005",35,45],["棉麻抱枕套","BZT-006",25,0],
  ["木质手机支架","SJZ-007",15.9,156],["香薰蜡烛礼盒","XZL-008",49.9,78],
  ["折叠晾衣架","LYJ-009",29,33],["分格饭盒","FGF-010",22,8],
  ["桌面垃圾桶","ZLT-011",12.9,220],["化妆品收纳架","HZS-012",45,15],
  ["陶瓷花瓶","THP-013",38,62],["记事本礼盒","JSB-014",28,0],
  ["LED小夜灯","XYD-015",19,95],["纯棉袜子5双装","MWZ-016",25.9,180],
  ["实木衣架10支","YJZ-017",32,44],["便携餐具套装","BCJ-018",18,7],
  ["浴室置物架","ZWJ-019",55,130],["多功能削皮刀","XPD-020",9.9,3],
] as const;

export function getMockSkus() {
  return mockProducts.map(([name, code, price, stock], i) => ({
    id: `sku-${i}`, product_id: `prod-${i}`, tenant_id: MOCK_TENANT.id,
    sku_code: code, name: name as string, spec: null,
    price: price as number, cost: (price as number) * 0.4, status: "active" as const,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    product: { id:`prod-${i}`, tenant_id: MOCK_TENANT.id, name: name as string, image_url:null, category:"日用", status:"active" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    inventory: { id:`inv-${i}`, sku_id:`sku-${i}`, tenant_id: MOCK_TENANT.id,
      total_quantity: stock as number, allocated_quantity:0, available_quantity: stock as number,
      alert_threshold:10, allocation_strategy:"shared" as const, allocation_config:null, updated_at: new Date().toISOString() },
    channel_mappings: [],
  }));
}

export function getMockChannels() {
  return [
    { id:"ch-1", tenant_id: MOCK_TENANT.id, platform:"pinduoduo" as const, shop_name:"张姐日用品专营店", shop_id:"pdd_123", sync_mode:"realtime" as const, sync_interval_minutes:5, deduct_on:"payment" as const, return_auto_restore:true, status:"connected" as const, last_sync_at: new Date(Date.now()-1800000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id:"ch-2", tenant_id: MOCK_TENANT.id, platform:"wechat_miniprogram" as const, shop_name:"张姐私域好物", shop_id:"wx_456", sync_mode:"scheduled" as const, sync_interval_minutes:5, deduct_on:"order" as const, return_auto_restore:true, status:"connected" as const, last_sync_at: new Date(Date.now()-3600000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
}

export function getMockSyncLogs() {
  return Array.from({length:15}, (_,i) => ({
    id:`st-${i}`, tenant_id: MOCK_TENANT.id, channel_id: i%2===0?"ch-1":"ch-2",
    type: (["order_triggered","scheduled","manual"] as const)[i%3],
    status: i===3||i===9 ? "failed" as const : "completed" as const,
    total_skus: 10+i*2, success_count: i===3||i===9 ? 8+i : 10+i*2,
    fail_count: i===3||i===9 ? 2 : 0, retry_count:0, max_retries:3,
    error_message: i===3||i===9 ? "部分SKU同步超时" : null,
    started_at: new Date(Date.now()-i*3600000).toISOString(),
    completed_at: new Date(Date.now()-i*3600000+3000).toISOString(),
    created_at: new Date(Date.now()-i*3600000).toISOString(),
    channel: i%2===0 ? {shop_name:"张姐日用品专营店",platform:"pinduoduo"} : {shop_name:"张姐私域好物",platform:"wechat_miniprogram"},
  }));
}

export function getMockRiskyBuyers() {
  return [
    {buyer_id:"buyer_zhang",buyer_name:"张三",return_count:8,total_refund:2340,last_return_at:new Date().toISOString(),is_blacklisted:false},
    {buyer_id:"buyer_li",buyer_name:"李四",return_count:5,total_refund:980,last_return_at:new Date().toISOString(),is_blacklisted:false},
    {buyer_id:"buyer_wang",buyer_name:"王五",return_count:4,total_refund:650,last_return_at:new Date().toISOString(),is_blacklisted:true},
  ];
}

export function getMockReturnTrends(days: number) {
  return Array.from({length:days}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-days+i+1);
    const total = 30+Math.floor(Math.random()*40);
    const ret = Math.floor(Math.random()*5);
    return { date: d.toISOString().slice(0,10), return_rate: Number(((ret/total)*100).toFixed(1)), return_count:ret, total_orders:total };
  });
}
