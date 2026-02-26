-- ============================================
-- 兜卖 MVP - 演示账号种子数据
-- 先在 Supabase Auth 中创建演示用户 demo@doumai.com / demo123456
-- 然后将 auth.users 中该用户的 id 替换下方 DEMO_AUTH_ID
-- ============================================

-- 创建演示租户
INSERT INTO tenants (id, name, category, sku_scale, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', '张姐日用品旗舰店', '日用百货', '100-500', 'active');

-- 创建演示用户（需要替换 auth_id 为真实 Supabase Auth 用户 ID）
-- INSERT INTO users (tenant_id, auth_id, email, nickname, role, onboarding_completed, status) VALUES
--   ('a0000000-0000-0000-0000-000000000001', 'DEMO_AUTH_ID', 'demo@doumai.com', '张姐', 'admin', true, 'active');

-- 渠道
INSERT INTO channels (id, tenant_id, platform, shop_name, shop_id, sync_mode, deduct_on, status, last_sync_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'pinduoduo', '张姐日用品专营店', 'pdd_12345', 'realtime', 'payment', 'connected', now() - interval '30 minutes'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'wechat_miniprogram', '张姐私域好物', 'wx_67890', 'scheduled', 'order', 'connected', now() - interval '1 hour');

-- 商品和 SKU（30 条）
DO $$
DECLARE
  t_id UUID := 'a0000000-0000-0000-0000-000000000001';
  p_id UUID;
  s_id UUID;
  items TEXT[][] := ARRAY[
    ARRAY['陶瓷马克杯', '杯壶', 'MKB', '29.90', '12.00'],
    ARRAY['竹纤维毛巾', '家纺', 'ZXW', '19.90', '6.50'],
    ARRAY['收纳盒三件套', '收纳', 'SNH', '39.90', '15.00'],
    ARRAY['不锈钢保温杯', '杯壶', 'BWB', '59.90', '22.00'],
    ARRAY['硅胶厨房铲套装', '厨具', 'CFT', '35.00', '13.00'],
    ARRAY['棉麻抱枕套', '家纺', 'BZT', '25.00', '8.00'],
    ARRAY['木质手机支架', '数码配件', 'SJZ', '15.90', '4.50'],
    ARRAY['香薰蜡烛礼盒', '家居香氛', 'XZL', '49.90', '18.00'],
    ARRAY['折叠晾衣架', '居家', 'LYJ', '29.00', '10.00'],
    ARRAY['分格饭盒', '餐具', 'FGF', '22.00', '7.50'],
    ARRAY['桌面垃圾桶', '清洁', 'ZLT', '12.90', '4.00'],
    ARRAY['化妆品收纳架', '收纳', 'HZS', '45.00', '16.00'],
    ARRAY['陶瓷花瓶', '装饰', 'THP', '38.00', '14.00'],
    ARRAY['记事本礼盒', '文具', 'JSB', '28.00', '9.00'],
    ARRAY['LED 小夜灯', '灯具', 'XYD', '19.00', '5.50'],
    ARRAY['纯棉袜子5双装', '服饰', 'MWZ', '25.90', '8.00'],
    ARRAY['实木衣架10支装', '居家', 'YJZ', '32.00', '11.00'],
    ARRAY['便携餐具套装', '餐具', 'BCJ', '18.00', '5.00'],
    ARRAY['浴室置物架', '浴室', 'ZWJ', '55.00', '20.00'],
    ARRAY['多功能削皮刀', '厨具', 'XPD', '9.90', '2.80'],
    ARRAY['密封储物罐', '收纳', 'CWG', '16.00', '5.00'],
    ARRAY['遮光窗帘', '家纺', 'ZGC', '79.00', '28.00'],
    ARRAY['创意书立', '文具', 'CSL', '22.00', '7.00'],
    ARRAY['玻璃水杯', '杯壶', 'BSB', '15.00', '4.00'],
    ARRAY['懒人沙发垫', '家纺', 'SFD', '68.00', '25.00'],
    ARRAY['迷你加湿器', '小家电', 'JSQ', '39.00', '14.00'],
    ARRAY['厨房计时器', '厨具', 'JSQ2', '12.00', '3.50'],
    ARRAY['磁吸冰箱贴', '装饰', 'BXT', '8.90', '2.00'],
    ARRAY['旅行洗漱包', '收纳', 'XSB', '25.00', '8.50'],
    ARRAY['手工皂礼盒', '洗护', 'SGZ', '42.00', '15.00']
  ];
  item TEXT[];
  i INT := 1;
  stock INT;
  alert_val INT;
BEGIN
  FOREACH item SLICE 1 IN ARRAY items LOOP
    p_id := gen_random_uuid();
    s_id := gen_random_uuid();
    stock := (random() * 200)::INT;
    alert_val := 10;

    INSERT INTO products (id, tenant_id, name, category, status) VALUES
      (p_id, t_id, item[1], item[2], 'active');

    INSERT INTO skus (id, product_id, tenant_id, sku_code, name, price, cost, status) VALUES
      (s_id, p_id, t_id, item[3] || '-' || lpad(i::TEXT, 3, '0'), item[1], item[4]::DECIMAL, item[5]::DECIMAL, 'active');

    INSERT INTO inventory (sku_id, tenant_id, total_quantity, available_quantity, alert_threshold) VALUES
      (s_id, t_id, stock, stock, alert_val);

    -- 库存变动日志
    INSERT INTO inventory_logs (sku_id, tenant_id, change_type, change_quantity, before_quantity, after_quantity, reason) VALUES
      (s_id, t_id, 'import', stock, 0, stock, '初始导入');

    -- 渠道映射
    INSERT INTO channel_sku_mappings (channel_id, sku_id, tenant_id, platform_product_id, platform_sku_id, channel_quantity) VALUES
      ('c0000000-0000-0000-0000-000000000001', s_id, t_id, 'pdd_p_' || i, 'pdd_s_' || i, (stock * 0.6)::INT),
      ('c0000000-0000-0000-0000-000000000002', s_id, t_id, 'wx_p_' || i, 'wx_s_' || i, (stock * 0.4)::INT);

    i := i + 1;
  END LOOP;
END $$;

-- 让部分 SKU 库存为 0 或低库存（制造预警/缺货场景）
UPDATE inventory SET total_quantity = 0, available_quantity = 0
WHERE sku_id IN (SELECT id FROM skus WHERE sku_code LIKE 'XPD%' OR sku_code LIKE 'BXT%');

UPDATE inventory SET total_quantity = 5, available_quantity = 5
WHERE sku_id IN (SELECT id FROM skus WHERE sku_code LIKE 'SNH%' OR sku_code LIKE 'MKB%' OR sku_code LIKE 'BSB%');

-- 退货记录（制造高风险买家）
DO $$
DECLARE
  t_id UUID := 'a0000000-0000-0000-0000-000000000001';
  ch_id UUID := 'c0000000-0000-0000-0000-000000000001';
  s_id UUID;
  buyer_ids TEXT[] := ARRAY['buyer_zhangsan', 'buyer_lisi', 'buyer_wangwu', 'buyer_zhaoliu', 'buyer_qianqi'];
  buyer_names TEXT[] := ARRAY['张三', '李四', '王五', '赵六', '钱七'];
  j INT;
  k INT;
BEGIN
  SELECT id INTO s_id FROM skus WHERE tenant_id = t_id LIMIT 1;

  FOR j IN 1..5 LOOP
    FOR k IN 1..(3 + j) LOOP
      INSERT INTO return_records (tenant_id, channel_id, order_id, buyer_id, buyer_name, sku_id, quantity, refund_amount, return_type, risk_level, status, created_at) VALUES
        (t_id, ch_id, 'ORD_' || j || '_' || k, buyer_ids[j], buyer_names[j], s_id, 1,
         (random() * 100 + 10)::DECIMAL(10,2),
         CASE WHEN random() > 0.5 THEN 'refund_only' ELSE 'return_and_refund' END,
         CASE WHEN (3 + j) >= 6 THEN 'high' WHEN (3 + j) >= 4 THEN 'medium' ELSE 'normal' END,
         CASE WHEN random() > 0.3 THEN 'completed' ELSE 'pending' END,
         now() - (random() * 30 || ' days')::INTERVAL);
    END LOOP;
  END LOOP;
END $$;

-- 同步任务历史记录
DO $$
DECLARE
  t_id UUID := 'a0000000-0000-0000-0000-000000000001';
  ch_ids UUID[] := ARRAY['c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'];
  i INT;
  ch UUID;
  task_status TEXT;
  total INT;
  success INT;
BEGIN
  FOREACH ch IN ARRAY ch_ids LOOP
    FOR i IN 1..15 LOOP
      total := (random() * 30 + 5)::INT;
      IF random() > 0.8 THEN
        task_status := 'failed';
        success := total - (random() * 5 + 1)::INT;
      ELSE
        task_status := 'completed';
        success := total;
      END IF;

      INSERT INTO sync_tasks (tenant_id, channel_id, type, status, total_skus, success_count, fail_count, started_at, completed_at, error_message, created_at) VALUES
        (t_id, ch,
         (ARRAY['order_triggered', 'scheduled', 'manual'])[1 + (random() * 2)::INT],
         task_status, total, success, total - success,
         now() - (i || ' hours')::INTERVAL,
         now() - (i || ' hours')::INTERVAL + interval '3 seconds',
         CASE WHEN task_status = 'failed' THEN '部分 SKU 同步超时，平台 API 返回 timeout' ELSE NULL END,
         now() - (i || ' hours')::INTERVAL);
    END LOOP;
  END LOOP;
END $$;

-- 订阅（免费版）
INSERT INTO subscriptions (tenant_id, plan, billing_cycle, price, started_at, expires_at, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'free', 'monthly', 0, now(), now() + interval '100 years', 'active');
