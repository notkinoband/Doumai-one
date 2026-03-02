"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Button, Input, Space, Tag, Modal, Form, InputNumber, Radio,
  Select, Tabs, Drawer, Timeline, App, Popconfirm, Typography, Badge, Tooltip
} from "antd";
import {
  SearchOutlined, PlusOutlined, EditOutlined, HistoryOutlined,
  ExclamationCircleOutlined, UserDeleteOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { getSkuList, updateInventory, batchUpdateInventory, getInventoryLogs, updateAlertThreshold } from "@/services/inventory";
import { getRiskyBuyers, getBlacklist, addToBlacklist, removeFromBlacklist } from "@/services/returns";
import type { Sku, InventoryLog, RiskyBuyer, BuyerBlacklist } from "@/types/database";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

const { Text } = Typography;

export default function InventoryPage() {
  const { tenant } = useAuthStore();
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");

  const [skus, setSkus] = useState<Sku[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<string | undefined>(initialStatus || undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editModal, setEditModal] = useState<{ open: boolean; sku: Sku | null }>({ open: false, sku: null });
  const [batchModal, setBatchModal] = useState(false);
  const [logDrawer, setLogDrawer] = useState<{ open: boolean; skuId: string; skuName: string }>({ open: false, skuId: "", skuName: "" });
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [riskyBuyers, setRiskyBuyers] = useState<RiskyBuyer[]>([]);
  const [blacklist, setBlacklist] = useState<BuyerBlacklist[]>([]);
  const [editForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const loadSkus = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const result = await getSkuList({
        tenantId: tenant.id, page, pageSize: 20, search: search || undefined,
        stockStatus: stockFilter as any,
      });
      setSkus(result.data);
      setTotal(result.total);
    } catch { message.error("加载失败"); }
    finally { setLoading(false); }
  }, [tenant, page, search, stockFilter]);

  useEffect(() => { loadSkus(); }, [loadSkus]);

  const loadReturns = async () => {
    if (!tenant) return;
    const [rb, bl] = await Promise.all([getRiskyBuyers(tenant.id), getBlacklist(tenant.id)]);
    setRiskyBuyers(rb);
    setBlacklist(bl);
  };

  const getStockTag = (sku: Sku) => {
    const inv = Array.isArray(sku.inventory) ? sku.inventory[0] : sku.inventory;
    if (!inv || inv.total_quantity === 0) return <Tag color="red">缺货</Tag>;
    if (inv.total_quantity <= inv.alert_threshold) return <Tag color="orange">预警</Tag>;
    return <Tag color="green">正常</Tag>;
  };

  const handleEdit = async (values: any) => {
    if (!editModal.sku || !tenant) return;
    try {
      const changeType = values.operation === "set" ? "manual_adjust"
        : values.operation === "decrease" ? "order_deduct" : "return_restore";
      await updateInventory(editModal.sku.id, tenant.id, changeType, values.quantity, values.reason);
      if (values.alertThreshold !== undefined) {
        await updateAlertThreshold(editModal.sku.id, tenant.id, values.alertThreshold);
      }
      message.success("库存更新成功");
      setEditModal({ open: false, sku: null });
      loadSkus();
    } catch { message.error("更新失败"); }
  };

  const handleBatch = async (values: any) => {
    if (!tenant) return;
    try {
      await batchUpdateInventory(tenant.id, selectedRowKeys, values.operation, values.quantity, values.reason);
      message.success(`已批量更新 ${selectedRowKeys.length} 个 SKU`);
      setBatchModal(false);
      setSelectedRowKeys([]);
      loadSkus();
    } catch { message.error("批量更新失败"); }
  };

  const openLogs = async (skuId: string, skuName: string) => {
    if (!tenant) return;
    setLogDrawer({ open: true, skuId, skuName });
    const data = await getInventoryLogs(skuId, tenant.id);
    setLogs(data);
  };

  const columns = [
    {
      title: "SKU 编码", dataIndex: "sku_code", width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: "商品名称", dataIndex: "name", ellipsis: true },
    {
      title: "总库存", key: "stock", width: 90, sorter: true,
      render: (_: any, r: Sku) => {
        const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
        return <Text strong>{inv?.total_quantity ?? 0}</Text>;
      },
    },
    {
      title: "预警值", key: "alert", width: 80,
      render: (_: any, r: Sku) => {
        const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
        return inv?.alert_threshold ?? 10;
      },
    },
    {
      title: "状态", key: "status", width: 80,
      render: (_: any, r: Sku) => getStockTag(r),
    },
    {
      title: "操作", key: "action", width: 140,
      render: (_: any, r: Sku) => (
        <Space>
          <Tooltip title="编辑库存">
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditModal({ open: true, sku: r }); editForm.resetFields(); }} />
          </Tooltip>
          <Tooltip title="变动日志">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => openLogs(r.id, r.name)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const changeTypeLabels: Record<string, string> = {
    manual_adjust: "手动调整", order_deduct: "订单扣减", return_restore: "退货回补", sync: "同步", import: "导入",
  };

  return (
    <div>
      <Tabs
        defaultActiveKey="inventory"
        onChange={(key) => { if (key === "returns") loadReturns(); }}
        items={[
          {
            key: "inventory",
            label: <Badge count={stockFilter ? 1 : 0} dot><span>库存管理</span></Badge>,
            children: (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <Space wrap>
                    <Input.Search placeholder="搜索 SKU 名称/编码" allowClear style={{ width: 250 }}
                      onSearch={(v) => { setSearch(v); setPage(1); }} />
                    <Select placeholder="库存状态" allowClear style={{ width: 120 }} value={stockFilter}
                      onChange={(v) => { setStockFilter(v); setPage(1); }}
                      options={[
                        { value: "normal", label: "正常" },
                        { value: "low", label: "预警" },
                        { value: "out", label: "缺货" },
                      ]} />
                  </Space>
                  <Space>
                    {selectedRowKeys.length > 0 && (
                      <Button onClick={() => setBatchModal(true)}>批量操作 ({selectedRowKeys.length})</Button>
                    )}
                    <Button type="primary" icon={<PlusOutlined />} href="/inventory/new">
                      新增商品
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={loadSkus}>刷新</Button>
                  </Space>
                </div>

                <Table
                  rowKey="id" columns={columns} dataSource={skus} loading={loading}
                  rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as string[]) }}
                  pagination={{ current: page, total, pageSize: 20, showSizeChanger: false, showTotal: (t) => `共 ${t} 项`,
                    onChange: (p) => setPage(p) }}
                  scroll={{ x: 700 }}
                />
              </>
            ),
          },
          {
            key: "returns",
            label: "退货风险",
            children: (
              <Tabs type="card" items={[
                {
                  key: "risky",
                  label: `高风险买家 (${riskyBuyers.length})`,
                  children: (
                    <Table rowKey="buyer_id" dataSource={riskyBuyers} pagination={{ pageSize: 10 }}
                      columns={[
                        { title: "买家 ID", dataIndex: "buyer_id", ellipsis: true },
                        { title: "买家昵称", dataIndex: "buyer_name" },
                        { title: "退货次数", dataIndex: "return_count", sorter: (a: RiskyBuyer, b: RiskyBuyer) => a.return_count - b.return_count },
                        { title: "退货金额", dataIndex: "total_refund", render: (v: number) => `¥${v.toFixed(2)}` },
                        {
                          title: "操作", render: (_: any, r: RiskyBuyer) => r.is_blacklisted
                            ? <Tag color="red">已拉黑</Tag>
                            : <Button size="small" danger onClick={async () => {
                                await addToBlacklist(tenant!.id, r.buyer_id, r.buyer_name, "pinduoduo", "高频退货", r.return_count, r.total_refund);
                                message.success("已加入黑名单");
                                loadReturns();
                              }}>加入黑名单</Button>,
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: "blacklist",
                  label: `黑名单 (${blacklist.length})`,
                  children: (
                    <Table rowKey="id" dataSource={blacklist} pagination={{ pageSize: 10 }}
                      columns={[
                        { title: "买家 ID", dataIndex: "buyer_id", ellipsis: true },
                        { title: "买家昵称", dataIndex: "buyer_name" },
                        { title: "平台", dataIndex: "platform" },
                        { title: "退货次数", dataIndex: "return_count" },
                        { title: "退货金额", dataIndex: "return_amount", render: (v: number) => `¥${v.toFixed(2)}` },
                        { title: "原因", dataIndex: "reason", ellipsis: true },
                        {
                          title: "操作", render: (_: any, r: BuyerBlacklist) => (
                            <Popconfirm title="确定移出黑名单？" onConfirm={async () => {
                              await removeFromBlacklist(r.id);
                              message.success("已移出");
                              loadReturns();
                            }}>
                              <Button size="small">移出</Button>
                            </Popconfirm>
                          ),
                        },
                      ]}
                    />
                  ),
                },
              ]} />
            ),
          },
        ]}
      />

      <Modal title={`编辑库存：${editModal.sku?.name || ""}`} open={editModal.open}
        onCancel={() => setEditModal({ open: false, sku: null })} onOk={() => editForm.submit()} okText="确认保存">
        <Form form={editForm} layout="vertical" onFinish={handleEdit}
          initialValues={{ operation: "set", alertThreshold: (Array.isArray(editModal.sku?.inventory) ? editModal.sku?.inventory[0] : editModal.sku?.inventory)?.alert_threshold ?? 10 }}>
          <Form.Item label="当前库存">
            <Text strong style={{ fontSize: 20 }}>
              {(Array.isArray(editModal.sku?.inventory) ? editModal.sku?.inventory[0] : editModal.sku?.inventory)?.total_quantity ?? 0}
            </Text>
          </Form.Item>
          <Form.Item name="operation" label="操作类型">
            <Radio.Group>
              <Radio.Button value="set">设为固定值</Radio.Button>
              <Radio.Button value="increase">增加</Radio.Button>
              <Radio.Button value="decrease">减少</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true, message: "请输入数量" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="alertThreshold" label="预警阈值">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="reason" label="变动原因">
            <Select placeholder="选择原因" allowClear
              options={[
                { value: "采购入库", label: "采购入库" },
                { value: "盘点调整", label: "盘点调整" },
                { value: "损耗报废", label: "损耗报废" },
                { value: "其他", label: "其他" },
              ]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量操作" open={batchModal} onCancel={() => setBatchModal(false)} onOk={() => batchForm.submit()} okText="确认执行">
        <Form form={batchForm} layout="vertical" onFinish={handleBatch} initialValues={{ operation: "set" }}>
          <Text type="secondary">已选中 {selectedRowKeys.length} 个 SKU</Text>
          <Form.Item name="operation" label="操作类型" className="mt-4">
            <Radio.Group>
              <Radio.Button value="set">设为固定值</Radio.Button>
              <Radio.Button value="increase">增加</Radio.Button>
              <Radio.Button value="decrease">减少</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input placeholder="批量调整原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={`库存变动日志：${logDrawer.skuName}`} open={logDrawer.open} width={500}
        onClose={() => setLogDrawer({ open: false, skuId: "", skuName: "" })}>
        <Timeline
          items={logs.map((log) => ({
            color: log.change_quantity > 0 ? "green" : log.change_quantity < 0 ? "red" : "gray",
            children: (
              <div>
                <div className="flex justify-between">
                  <Tag>{changeTypeLabels[log.change_type] || log.change_type}</Tag>
                  <Text type="secondary">{dayjs(log.created_at).format("MM-DD HH:mm")}</Text>
                </div>
                <div className="mt-1">
                  {log.before_quantity} → <Text strong>{log.after_quantity}</Text>
                  <Text type={log.change_quantity > 0 ? "success" : "danger"} className="ml-2">
                    ({log.change_quantity > 0 ? "+" : ""}{log.change_quantity})
                  </Text>
                </div>
                {log.reason && <Text type="secondary" className="text-xs">{log.reason}</Text>}
              </div>
            ),
          }))}
        />
        {logs.length === 0 && <Text type="secondary">暂无变动记录</Text>}
      </Drawer>
    </div>
  );
}
