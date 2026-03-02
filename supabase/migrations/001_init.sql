-- ============================================
-- 兜卖 MVP - 数据库初始化
-- ============================================

-- 租户表
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  sku_scale VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  auth_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(11),
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SKU 表
CREATE TABLE skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku_code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  spec JSONB,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sku_code)
);

-- 库存表
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES skus(id) UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  total_quantity INTEGER NOT NULL DEFAULT 0,
  allocated_quantity INTEGER NOT NULL DEFAULT 0,
  order_hold_quantity INTEGER NOT NULL DEFAULT 0,
  return_in_transit_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER DEFAULT 10,
  allocation_strategy VARCHAR(20) DEFAULT 'shared',
  allocation_config JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 库存变动日志表
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES skus(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  change_type VARCHAR(30) NOT NULL,
  change_quantity INTEGER NOT NULL,
  before_quantity INTEGER NOT NULL,
  after_quantity INTEGER NOT NULL,
  source_channel VARCHAR(50),
  source_order_id VARCHAR(100),
  operator_id UUID REFERENCES users(id),
  reason VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_logs ON inventory_logs(tenant_id, sku_id, created_at DESC);

-- 渠道表
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform VARCHAR(30) NOT NULL,
  shop_name VARCHAR(200) NOT NULL,
  shop_id VARCHAR(100),
  sync_mode VARCHAR(20) DEFAULT 'realtime',
  sync_interval_minutes INTEGER DEFAULT 5,
  deduct_on VARCHAR(20) DEFAULT 'payment',
  return_auto_restore BOOLEAN DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 渠道 SKU 映射表
CREATE TABLE channel_sku_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  sku_id UUID NOT NULL REFERENCES skus(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform_product_id VARCHAR(100) NOT NULL,
  platform_sku_id VARCHAR(100) NOT NULL,
  channel_quantity INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, platform_sku_id)
);

-- 同步任务表
CREATE TABLE sync_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_skus INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 同步日志表
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_task_id UUID NOT NULL REFERENCES sync_tasks(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku_id UUID NOT NULL REFERENCES skus(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  action VARCHAR(20) NOT NULL,
  before_quantity INTEGER,
  after_quantity INTEGER,
  platform_response JSONB,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 退货记录表
CREATE TABLE return_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  order_id VARCHAR(100) NOT NULL,
  buyer_id VARCHAR(100) NOT NULL,
  buyer_name VARCHAR(100),
  sku_id UUID NOT NULL REFERENCES skus(id),
  quantity INTEGER NOT NULL,
  refund_amount DECIMAL(10,2),
  return_type VARCHAR(30) NOT NULL,
  risk_level VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_return_records ON return_records(tenant_id, buyer_id, created_at DESC);

-- 买家黑名单表
CREATE TABLE buyer_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  buyer_id VARCHAR(100) NOT NULL,
  buyer_name VARCHAR(100),
  platform VARCHAR(50) NOT NULL,
  reason VARCHAR(500),
  return_count INTEGER DEFAULT 0,
  return_amount DECIMAL(10,2) DEFAULT 0,
  added_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, buyer_id, platform)
);

-- 订阅表
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  auto_renew BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 支付记录表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'wechat_pay',
  transaction_id VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  invoice_status VARCHAR(20) DEFAULT 'none',
  invoice_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_sku_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 辅助函数：获取当前用户的 tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 租户表: 用户只能看自己的租户
CREATE POLICY "tenant_select" ON tenants FOR SELECT USING (
  id = get_user_tenant_id()
);
CREATE POLICY "tenant_insert" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "tenant_update" ON tenants FOR UPDATE USING (id = get_user_tenant_id());

-- 用户表
CREATE POLICY "users_select" ON users FOR SELECT USING (
  tenant_id = get_user_tenant_id() OR auth_id = auth.uid()
);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth_id = auth.uid());

-- 通用租户隔离策略（其余表）
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products','skus','inventory','inventory_logs','channels',
    'channel_sku_mappings','sync_tasks','sync_logs','return_records','buyer_blacklist',
    'subscriptions','payments']
  LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (tenant_id = get_user_tenant_id())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (tenant_id = get_user_tenant_id())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (tenant_id = get_user_tenant_id())', tbl, tbl);
  END LOOP;
END $$;
