"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card, Button, Tag, Typography, Progress, Table, Switch, Modal, Space, App, Spin, Row, Col, Segmented, QRCode,
} from "antd";
import {
  CrownOutlined, CheckOutlined, CloseOutlined, WechatOutlined, AlipayCircleOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { getCurrentSubscription, getUsage, upgradePlan, getPayments } from "@/services/subscription";
import { PLANS } from "@/lib/constants";
import type { Subscription, Payment, PlanType, BillingCycle } from "@/types/database";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionPage() {
  const { tenant } = useAuthStore();
  const { message } = App.useApp();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ skuCount: 0, channelCount: 0, memberCount: 0 });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [payModal, setPayModal] = useState<{ open: boolean; plan: typeof PLANS[number] | null }>({ open: false, plan: null });
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        getCurrentSubscription(tenant.id), getUsage(tenant.id), getPayments(tenant.id),
      ]);
      setSub(s);
      setUsage(u);
      setPayments(p);
    } catch { console.error("Load error"); }
    finally { setLoading(false); }
  }, [tenant]);

  useEffect(() => { loadData(); }, [loadData]);

  const currentPlanKey = sub?.plan || "free";

  const handleUpgrade = async (plan: typeof PLANS[number]) => {
    if (plan.key === currentPlanKey) return;
    setPayModal({ open: true, plan });
  };

  const confirmPay = async () => {
    if (!tenant || !payModal.plan) return;
    setPaying(true);
    setTimeout(async () => {
      try {
        const price = billingCycle === "yearly" ? payModal.plan!.yearlyPrice : payModal.plan!.monthlyPrice;
        await upgradePlan(tenant.id, payModal.plan!.key as PlanType, billingCycle as BillingCycle, price);
        message.success("支付成功！已升级套餐");
        setPayModal({ open: false, plan: null });
        loadData();
      } catch { message.error("支付失败"); }
      finally { setPaying(false); }
    }, 3000);
  };

  const planColors: Record<string, string> = { free: "#999", pro: "#1677FF", enterprise: "#722ED1" };

  const featureRows: { label: string; key: string; render?: (v: any) => React.ReactNode }[] = [
    { label: "SKU 上限", key: "skuLimit", render: (v: any) => v === Infinity ? "无限" : v },
    { label: "渠道数", key: "channelLimit", render: (v: any) => v === Infinity ? "不限" : v },
    { label: "协作成员", key: "memberLimit" },
    { label: "自动同步", key: "autoSync", render: (v: any) => v ? <CheckOutlined style={{ color: "#52C41A" }} /> : <CloseOutlined style={{ color: "#ccc" }} /> },
    { label: "最小同步间隔", key: "minSyncInterval", render: (v: any) => v ? `${v} 分钟` : "-" },
    { label: "库存预警", key: "inventoryAlert", render: (v: any) => v ? <CheckOutlined style={{ color: "#52C41A" }} /> : <CloseOutlined style={{ color: "#ccc" }} /> },
    { label: "退货检测", key: "returnDetection", render: (v: any) => v ? <CheckOutlined style={{ color: "#52C41A" }} /> : <CloseOutlined style={{ color: "#ccc" }} /> },
    { label: "API 接口", key: "apiAccess", render: (v: any) => v ? <CheckOutlined style={{ color: "#52C41A" }} /> : <CloseOutlined style={{ color: "#ccc" }} /> },
    { label: "客服支持", key: "support" },
  ];

  const paymentColumns = [
    { title: "时间", dataIndex: "created_at", render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm") },
    { title: "金额", dataIndex: "amount", render: (v: number) => `¥${v.toFixed(2)}` },
    { title: "类型", dataIndex: "type", render: (v: string) => ({ purchase: "购买", upgrade: "升级", renewal: "续费", refund: "退款" }[v] || v) },
    { title: "状态", dataIndex: "status", render: (v: string) => {
      const m: Record<string, { color: string; text: string }> = { paid: { color: "green", text: "已支付" }, pending: { color: "blue", text: "待支付" }, failed: { color: "red", text: "失败" } };
      return <Tag color={m[v]?.color}>{m[v]?.text || v}</Tag>;
    }},
  ];

  if (loading) return <div className="flex justify-center h-64 items-center"><Spin size="large" /></div>;

  return (
    <div>
      <Title level={4}>订阅服务</Title>

      {sub && sub.plan !== "free" && (
        <Card className="mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <Space>
                <CrownOutlined style={{ color: planColors[sub.plan], fontSize: 24 }} />
                <Title level={5} style={{ margin: 0 }}>当前套餐：{PLANS.find((p) => p.key === sub.plan)?.name}</Title>
              </Space>
              <div className="mt-2 text-sm text-gray-500">
                <div>订阅周期：{dayjs(sub.started_at).format("YYYY-MM-DD")} ~ {dayjs(sub.expires_at).format("YYYY-MM-DD")}</div>
                <div>到期剩余：{dayjs(sub.expires_at).diff(dayjs(), "day")} 天</div>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-[400px]">
              <div className="mb-2">
                <Text className="text-xs">SKU：{usage.skuCount} / {PLANS.find((p) => p.key === sub.plan)?.skuLimit === Infinity ? "∞" : PLANS.find((p) => p.key === sub.plan)?.skuLimit}</Text>
                <Progress percent={Math.min(100, (usage.skuCount / (PLANS.find((p) => p.key === sub.plan)?.skuLimit || 1)) * 100)} size="small" showInfo={false} />
              </div>
              <div>
                <Text className="text-xs">渠道：{usage.channelCount} / {PLANS.find((p) => p.key === sub.plan)?.channelLimit === Infinity ? "∞" : PLANS.find((p) => p.key === sub.plan)?.channelLimit}</Text>
                <Progress percent={Math.min(100, (usage.channelCount / (PLANS.find((p) => p.key === sub.plan)?.channelLimit || 1)) * 100)} size="small" showInfo={false} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="text-center mb-4">
        <Segmented
          options={[
            { label: "月付", value: "monthly" },
            { label: "年付 (省20%)", value: "yearly" },
          ]}
          value={billingCycle}
          onChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
        />
      </div>

      <Row gutter={16} className="mb-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlanKey;
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <Col xs={24} md={8} key={plan.key}>
              <Card
                hoverable
                style={plan.key === "pro" ? { borderColor: "#1677FF", borderWidth: 2 } : {}}
                title={
                  <div className="text-center">
                    {plan.key === "pro" && <Tag color="blue" className="mb-1">推荐</Tag>}
                    <Title level={5} style={{ margin: 0, color: planColors[plan.key] }}>{plan.name}</Title>
                  </div>
                }
              >
                <div className="text-center mb-4">
                  <Text style={{ fontSize: 36, fontWeight: 700, color: planColors[plan.key] }}>
                    ¥{price}
                  </Text>
                  <Text type="secondary">/{billingCycle === "yearly" ? "年" : "月"}</Text>
                </div>

                <div className="space-y-2 mb-6">
                  {featureRows.map((row) => {
                    const val = row.key in plan ? (plan as any)[row.key] : (plan.features as any)[row.key];
                    return (
                      <div key={row.key} className="flex justify-between text-sm">
                        <Text type="secondary">{row.label}</Text>
                        <Text>{row.render ? row.render(val) : val}</Text>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type={isCurrent ? "default" : "primary"} block
                  disabled={isCurrent}
                  style={!isCurrent && plan.key === "pro" ? {} : {}}
                  onClick={() => handleUpgrade(plan)}
                >
                  {isCurrent ? "当前套餐" : "立即升级"}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card title="支付记录">
        <Table rowKey="id" columns={paymentColumns} dataSource={payments}
          pagination={{ pageSize: 10 }} locale={{ emptyText: "暂无支付记录" }} />
      </Card>

      <Modal
        title="确认支付" open={payModal.open} width={400} footer={null}
        onCancel={() => { if (!paying) setPayModal({ open: false, plan: null }); }}
      >
        {payModal.plan && (
          <div className="text-center py-4">
            <Title level={4}>{payModal.plan.name}</Title>
            <Text style={{ fontSize: 28, fontWeight: 700, color: planColors[payModal.plan.key] }}>
              ¥{billingCycle === "yearly" ? payModal.plan.yearlyPrice : payModal.plan.monthlyPrice}
            </Text>
            <Text type="secondary"> / {billingCycle === "yearly" ? "年" : "月"}</Text>

            {!paying ? (
              <div className="mt-6">
                <Button type="primary" size="large" block onClick={confirmPay}>
                  模拟支付
                </Button>
                <Paragraph type="secondary" className="mt-2 text-xs">
                  MVP 演示模式，点击后 3 秒自动完成支付
                </Paragraph>
              </div>
            ) : (
              <div className="mt-6">
                <Spin size="large" tip="支付处理中..." />
                <Paragraph type="secondary" className="mt-4">
                  请稍候，正在处理支付...
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
