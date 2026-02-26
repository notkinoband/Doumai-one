"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card, Button, Space, Tag, Modal, Form, Input, Select, Radio, Switch,
  InputNumber, Drawer, Table, Typography, Badge, Progress, App, Popconfirm, Empty,
} from "antd";
import {
  PlusOutlined, SyncOutlined, SettingOutlined, DisconnectOutlined,
  WechatOutlined, ShopOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { getChannels, addChannel, updateChannelConfig, deleteChannel, triggerSync, getSyncLogs } from "@/services/channels";
import type { Channel, SyncTask, ChannelPlatform } from "@/types/database";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const platformInfo: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  pinduoduo: { name: "拼多多", icon: <ShopOutlined />, color: "#E02E24" },
  wechat_miniprogram: { name: "微信小程序", icon: <WechatOutlined />, color: "#07C160" },
};

export default function ChannelsPage() {
  const { tenant } = useAuthStore();
  const { message } = App.useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [configDrawer, setConfigDrawer] = useState<{ open: boolean; channel: Channel | null }>({ open: false, channel: null });
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [addForm] = Form.useForm();
  const [configForm] = Form.useForm();

  const loadData = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const [ch, logs] = await Promise.all([getChannels(tenant.id), getSyncLogs(tenant.id)]);
      setChannels(ch.filter((c) => c.status !== "disconnected"));
      setSyncLogs(logs);
    } catch { message.error("加载失败"); }
    finally { setLoading(false); }
  }, [tenant]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (values: { platform: ChannelPlatform; shop_name: string }) => {
    if (!tenant) return;
    try {
      await addChannel(tenant.id, values.platform, values.shop_name);
      message.success("渠道添加成功（模拟授权）");
      setAddModal(false);
      addForm.resetFields();
      loadData();
    } catch { message.error("添加失败"); }
  };

  const handleSync = async (channelId: string) => {
    if (!tenant) return;
    setSyncing((s) => ({ ...s, [channelId]: true }));
    try {
      await triggerSync(tenant.id, channelId);
      message.loading("正在同步...", 3);
      setTimeout(() => {
        setSyncing((s) => ({ ...s, [channelId]: false }));
        message.success("同步完成");
        loadData();
      }, 3500);
    } catch {
      setSyncing((s) => ({ ...s, [channelId]: false }));
      message.error("同步失败");
    }
  };

  const handleConfigSave = async (values: any) => {
    if (!configDrawer.channel) return;
    try {
      await updateChannelConfig(configDrawer.channel.id, values);
      message.success("配置已保存");
      setConfigDrawer({ open: false, channel: null });
      loadData();
    } catch { message.error("保存失败"); }
  };

  const handleDisconnect = async (channelId: string) => {
    try {
      await deleteChannel(channelId);
      message.success("已断开连接");
      loadData();
    } catch { message.error("操作失败"); }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    connected: { color: "green", text: "已连接" },
    expired: { color: "orange", text: "授权过期" },
    disconnected: { color: "default", text: "已断开" },
  };

  const logColumns = [
    { title: "时间", dataIndex: "created_at", width: 160, render: (v: string) => dayjs(v).format("MM-DD HH:mm:ss") },
    {
      title: "渠道", key: "channel", width: 140,
      render: (_: any, r: SyncTask) => (r as any).channel?.shop_name || "-",
    },
    {
      title: "类型", dataIndex: "type", width: 100,
      render: (v: string) => ({ order_triggered: "订单触发", scheduled: "定时同步", manual: "手动同步" }[v] || v),
    },
    { title: "SKU 数", dataIndex: "total_skus", width: 80 },
    {
      title: "状态", dataIndex: "status", width: 100,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          completed: { color: "green", text: "成功" },
          failed: { color: "red", text: "失败" },
          processing: { color: "blue", text: "进行中" },
          pending: { color: "default", text: "等待中" },
        };
        return <Tag color={map[v]?.color}>{map[v]?.text || v}</Tag>;
      },
    },
    { title: "错误信息", dataIndex: "error_message", ellipsis: true },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0 }}>渠道同步</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加渠道</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {channels.map((ch) => {
          const info = platformInfo[ch.platform] || { name: ch.platform, icon: <ShopOutlined />, color: "#999" };
          const st = statusMap[ch.status];
          return (
            <Card key={ch.id} hoverable>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl" style={{ color: info.color }}>{info.icon}</div>
                  <div>
                    <Text strong>{info.name}</Text>
                    <Text type="secondary" className="block text-sm">{ch.shop_name}</Text>
                  </div>
                </div>
                <Tag color={st.color}>{st.text}</Tag>
              </div>
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <div>同步模式：{ch.sync_mode === "realtime" ? "实时同步" : `定时 ${ch.sync_interval_minutes} 分钟`}</div>
                <div>扣减规则：{ch.deduct_on === "payment" ? "付款扣减" : "下单扣减"}</div>
                <div>最近同步：{ch.last_sync_at ? dayjs(ch.last_sync_at).format("YYYY-MM-DD HH:mm") : "未同步"}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="small" icon={<SyncOutlined spin={syncing[ch.id]} />}
                  loading={syncing[ch.id]} onClick={() => handleSync(ch.id)}>同步</Button>
                <Button size="small" icon={<SettingOutlined />} onClick={() => {
                  setConfigDrawer({ open: true, channel: ch });
                  configForm.setFieldsValue({
                    sync_mode: ch.sync_mode, sync_interval_minutes: ch.sync_interval_minutes,
                    deduct_on: ch.deduct_on, return_auto_restore: ch.return_auto_restore,
                  });
                }}>设置</Button>
                <Popconfirm title="确定断开连接？" onConfirm={() => handleDisconnect(ch.id)}>
                  <Button size="small" danger icon={<DisconnectOutlined />}>断开</Button>
                </Popconfirm>
              </div>
            </Card>
          );
        })}

        <Card className="flex items-center justify-center cursor-pointer border-dashed min-h-[200px]"
          onClick={() => setAddModal(true)} hoverable>
          <div className="text-center text-gray-400">
            <PlusOutlined style={{ fontSize: 32 }} />
            <div className="mt-2">添加渠道</div>
          </div>
        </Card>
      </div>

      <Card title="同步日志">
        <Table rowKey="id" columns={logColumns} dataSource={syncLogs} loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} scroll={{ x: 700 }}
          rowClassName={(r) => r.status === "failed" ? "bg-red-50" : ""} />
      </Card>

      <Modal title="添加渠道" open={addModal} onCancel={() => setAddModal(false)} onOk={() => addForm.submit()} okText="确认授权">
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="platform" label="选择平台" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="pinduoduo"><ShopOutlined /> 拼多多</Radio.Button>
              <Radio.Button value="wechat_miniprogram"><WechatOutlined /> 微信小程序</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="shop_name" label="店铺名称" rules={[{ required: true, message: "请输入店铺名称" }]}>
            <Input placeholder="例如：张姐日用品专营店" />
          </Form.Item>
          <Text type="secondary" className="text-xs">
            MVP 阶段为模拟授权，正式版将跳转到平台 OAuth 授权页面。
          </Text>
        </Form>
      </Modal>

      <Drawer title={`同步设置：${configDrawer.channel?.shop_name}`} open={configDrawer.open} width={400}
        onClose={() => setConfigDrawer({ open: false, channel: null })}
        extra={<Button type="primary" onClick={() => configForm.submit()}>保存</Button>}>
        <Form form={configForm} layout="vertical" onFinish={handleConfigSave}>
          <Form.Item name="sync_mode" label="同步模式">
            <Radio.Group>
              <Radio value="realtime">实时同步</Radio>
              <Radio value="scheduled">定时同步</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.sync_mode !== cur.sync_mode}>
            {({ getFieldValue }) => getFieldValue("sync_mode") === "scheduled" && (
              <Form.Item name="sync_interval_minutes" label="同步间隔（分钟）">
                <InputNumber min={1} max={60} style={{ width: "100%" }} />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="deduct_on" label="库存扣减时机">
            <Radio.Group>
              <Radio value="order">下单扣减</Radio>
              <Radio value="payment">付款扣减</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="return_auto_restore" label="退货自动回补" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
