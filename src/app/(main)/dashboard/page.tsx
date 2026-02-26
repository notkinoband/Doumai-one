"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, Col, Row, Statistic, Segmented, Timeline, Tag, Typography, Spin, Badge } from "antd";
import {
  ShoppingOutlined,
  InboxOutlined,
  WarningOutlined,
  StopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useAuthStore } from "@/stores/authStore";
import { getDashboardOverview, getSalesData, getReturnTrends, getTodoItems } from "@/services/dashboard";
import type { DashboardOverview, SalesData, ReturnTrend } from "@/types/database";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

export default function DashboardPage() {
  const { tenant } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState<string>("7日");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [sales, setSales] = useState<SalesData[]>([]);
  const [returnTrends, setReturnTrends] = useState<ReturnTrend[]>([]);
  const [todos, setTodos] = useState<{ lowStockItems: any[]; failedSyncs: any[]; pendingReturns: any[] }>({
    lowStockItems: [], failedSyncs: [], pendingReturns: [],
  });

  const days = period === "今日" ? 1 : period === "7日" ? 7 : 30;

  const loadData = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const [ov, sl, rt, td] = await Promise.all([
        getDashboardOverview(tenant.id),
        getSalesData(tenant.id, days),
        getReturnTrends(tenant.id, days),
        getTodoItems(tenant.id),
      ]);
      setOverview(ov);
      setSales(sl);
      setReturnTrends(rt);
      setTodos(td);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenant, days]);

  useEffect(() => { loadData(); }, [loadData]);

  const salesChartOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: sales.map((s) => s.channel) },
    yAxis: [
      { type: "value", name: "订单数" },
      { type: "value", name: "销售额 (¥)" },
    ],
    series: [
      { name: "订单数", type: "bar", data: sales.map((s) => s.orders), itemStyle: { color: "#1677FF" } },
      { name: "销售额", type: "bar", yAxisIndex: 1, data: sales.map((s) => s.revenue), itemStyle: { color: "#52C41A" } },
    ],
    grid: { left: "8%", right: "8%", bottom: "10%", top: "15%" },
  };

  const returnChartOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: returnTrends.map((r) => r.date.slice(5)) },
    yAxis: { type: "value", name: "退货率 (%)" },
    series: [{
      name: "退货率",
      type: "line",
      smooth: true,
      data: returnTrends.map((r) => r.return_rate),
      areaStyle: { color: "rgba(255,77,79,0.1)" },
      lineStyle: { color: "#FF4D4F" },
      itemStyle: { color: "#FF4D4F" },
    }],
    grid: { left: "8%", right: "5%", bottom: "10%", top: "15%" },
  };

  if (loading || !overview) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0 }}>数据看板</Title>
        <Segmented options={["今日", "7日", "30日"]} value={period} onChange={(v) => setPeriod(v as string)} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => router.push("/inventory")}>
            <Statistic title="总 SKU 数" value={overview.total_skus} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="总库存量" value={overview.total_inventory} prefix={<InboxOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: 14, color: "#52C41A" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => router.push("/inventory?status=low")}
            style={overview.low_stock_count > 0 ? { borderColor: "#FAAD14" } : {}}>
            <Statistic title="低库存预警" value={overview.low_stock_count} prefix={<WarningOutlined />}
              valueStyle={overview.low_stock_count > 0 ? { color: "#FAAD14" } : {}} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => router.push("/inventory?status=out")}
            style={overview.out_of_stock_count > 0 ? { borderColor: "#FF4D4F" } : {}}>
            <Statistic title="缺货 SKU" value={overview.out_of_stock_count} prefix={<StopOutlined />}
              valueStyle={overview.out_of_stock_count > 0 ? { color: "#FF4D4F" } : {}} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="渠道销售概览">
            <ReactECharts option={salesChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="退货率趋势">
            <ReactECharts option={returnChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="待处理事项" className="mt-4">
        {todos.lowStockItems.length === 0 && todos.failedSyncs.length === 0 && todos.pendingReturns.length === 0 ? (
          <Text type="secondary">暂无待处理事项</Text>
        ) : (
          <Timeline
            items={[
              ...todos.lowStockItems.map((item: any) => ({
                color: "orange",
                dot: <WarningOutlined />,
                children: (
                  <span>
                    <Tag color="orange">库存预警</Tag>
                    {item.skus?.name || "未知商品"} ({item.skus?.sku_code}) 库存仅剩 <Text strong>{item.total_quantity}</Text> 件
                  </span>
                ),
              })),
              ...todos.failedSyncs.map((item: any) => ({
                color: "red",
                dot: <SyncOutlined />,
                children: (
                  <span>
                    <Tag color="red">同步异常</Tag>
                    {item.channels?.shop_name || "未知渠道"} 同步失败：{item.error_message}
                  </span>
                ),
              })),
              ...todos.pendingReturns.map((item: any) => ({
                color: "gold",
                dot: <ExclamationCircleOutlined />,
                children: (
                  <span>
                    <Tag color="gold">退货待审</Tag>
                    买家 {item.buyer_name} 申请退款 ¥{item.refund_amount}
                  </span>
                ),
              })),
            ]}
          />
        )}
      </Card>
    </div>
  );
}
