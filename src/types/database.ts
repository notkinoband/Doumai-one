export type TenantStatus = "active" | "suspended" | "deleted";
export type UserRole = "admin" | "operator" | "warehouse";
export type ChannelPlatform = "wechat_miniprogram" | "pinduoduo";
export type SyncMode = "realtime" | "scheduled";
export type DeductOn = "order" | "payment";
export type ChannelStatus = "connected" | "expired" | "disconnected";
export type AllocationStrategy = "shared" | "ratio" | "fixed";
export type InventoryChangeType = "order_deduct" | "return_restore" | "manual_adjust" | "sync" | "import";
export type SyncTaskType = "order_triggered" | "scheduled" | "manual";
export type SyncTaskStatus = "pending" | "processing" | "completed" | "failed";
export type ReturnType = "refund_only" | "return_and_refund";
export type RiskLevel = "normal" | "medium" | "high";
export type PlanType = "free" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "wechat_pay" | "alipay";
export type PaymentType = "purchase" | "upgrade" | "renewal" | "refund";

export interface Tenant {
  id: string;
  name: string;
  category: string | null;
  sku_scale: string | null;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  phone: string | null;
  nickname: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  last_login_at: string | null;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Sku {
  id: string;
  product_id: string;
  tenant_id: string;
  sku_code: string;
  name: string;
  spec: Record<string, string> | null;
  price: number | null;
  cost: number | null;
  status: "active" | "frozen" | "archived";
  created_at: string;
  updated_at: string;
  product?: Product;
  inventory?: Inventory;
  channel_mappings?: ChannelSkuMapping[];
}

export interface Inventory {
  id: string;
  sku_id: string;
  tenant_id: string;
  total_quantity: number;
  allocated_quantity: number;
  order_hold_quantity: number;
  return_in_transit_quantity: number;
  available_quantity: number;
  alert_threshold: number;
  allocation_strategy: AllocationStrategy;
  allocation_config: Record<string, number> | null;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  sku_id: string;
  tenant_id: string;
  change_type: InventoryChangeType;
  change_quantity: number;
  before_quantity: number;
  after_quantity: number;
  source_channel: string | null;
  source_order_id: string | null;
  operator_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  tenant_id: string;
  platform: ChannelPlatform;
  shop_name: string;
  shop_id: string | null;
  sync_mode: SyncMode;
  sync_interval_minutes: number;
  deduct_on: DeductOn;
  return_auto_restore: boolean;
  status: ChannelStatus;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelSkuMapping {
  id: string;
  channel_id: string;
  sku_id: string;
  tenant_id: string;
  platform_product_id: string;
  platform_sku_id: string;
  channel_quantity: number;
  status: "active" | "paused";
  created_at: string;
  channel?: Channel;
}

export interface SyncTask {
  id: string;
  tenant_id: string;
  channel_id: string;
  type: SyncTaskType;
  status: SyncTaskStatus;
  total_skus: number;
  success_count: number;
  fail_count: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  channel?: Channel;
}

export interface SyncLog {
  id: string;
  sync_task_id: string;
  tenant_id: string;
  sku_id: string;
  channel_id: string;
  action: "update_stock" | "deduct" | "restore";
  before_quantity: number | null;
  after_quantity: number | null;
  status: "success" | "failed";
  error_message: string | null;
  created_at: string;
}

export interface ReturnRecord {
  id: string;
  tenant_id: string;
  channel_id: string;
  order_id: string;
  buyer_id: string;
  buyer_name: string | null;
  sku_id: string;
  quantity: number;
  refund_amount: number | null;
  return_type: ReturnType;
  risk_level: RiskLevel;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
}

export interface BuyerBlacklist {
  id: string;
  tenant_id: string;
  buyer_id: string;
  buyer_name: string | null;
  platform: string;
  reason: string | null;
  return_count: number;
  return_amount: number;
  added_by: string | null;
  status: "active" | "removed";
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: PlanType;
  billing_cycle: BillingCycle;
  price: number;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  status: "active" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  type: PaymentType;
  status: "pending" | "paid" | "failed" | "refunded";
  paid_at: string | null;
  invoice_status: "none" | "requested" | "issued";
  invoice_info: Record<string, string> | null;
  created_at: string;
}

export interface RiskyBuyer {
  buyer_id: string;
  buyer_name: string | null;
  return_count: number;
  total_refund: number;
  last_return_at: string;
  is_blacklisted: boolean;
}

export interface DashboardOverview {
  total_skus: number;
  total_inventory: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface SalesData {
  channel: string;
  platform: ChannelPlatform;
  orders: number;
  revenue: number;
}

export interface ReturnTrend {
  date: string;
  return_rate: number;
  return_count: number;
  total_orders: number;
}
