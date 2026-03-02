"use client";

import React, { useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Checkbox,
  App,
  Row,
  Col,
  Typography,
} from "antd";
import {
  InfoCircleOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  TagOutlined,
  ShoppingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { createProductWithSku, type CreateProductPayload } from "@/services/inventory";

const { Text } = Typography;

const BRAND_ORANGE = "#D35400";

function generateSkuCode(): string {
  return `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export default function NewProductPage() {
  const { tenant } = useAuthStore();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [saveAndContinue, setSaveAndContinue] = useState(false);

  const handleRefreshSku = () => {
    form.setFieldValue("sku_code", generateSkuCode());
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!tenant) return;
    setSaving(true);
    try {
      const payload: CreateProductPayload = {
        name: String(values.name ?? "").trim(),
        image_url: (values.image_url as string)?.trim() || null,
        category: (values.brand as string)?.trim() || null,
        sku_code: (values.sku_code as string)?.trim() || undefined,
        price: values.price != null ? Number(values.price) : null,
        cost: values.cost != null ? Number(values.cost) : null,
        initial_stock: values.initial_stock != null ? Number(values.initial_stock) : 0,
        alert_threshold: values.alert_threshold != null ? Number(values.alert_threshold) : 10,
      };
      await createProductWithSku(tenant.id, payload);
      message.success("商品已保存");
      if (saveAndContinue) {
        form.resetFields();
        form.setFieldValue("sku_code", generateSkuCode());
        form.setFieldValue("alert_threshold", 10);
        form.setFieldValue("initial_stock", 0);
      } else {
        router.push("/inventory");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldValue("sku_code", generateSkuCode());
    form.setFieldValue("alert_threshold", 10);
    form.setFieldValue("initial_stock", 0);
  };

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #f0f0f0",
          padding: "16px 0",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Breadcrumb
            items={[
              { title: <Link href="/inventory">库存管理</Link> },
              { title: "新增商品" },
            ]}
            style={{ marginBottom: 4 }}
          />
          <Text strong style={{ fontSize: 20 }}>新增商品</Text>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={handleCancel}>取消</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() => form.submit()}
            style={{ background: BRAND_ORANGE, borderColor: BRAND_ORANGE }}
          >
            保存商品
          </Button>
        </div>
      </header>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          sku_code: generateSkuCode(),
          alert_threshold: 10,
          initial_stock: 0,
        }}
      >
        <Card
          title={
            <span>
              <InfoCircleOutlined style={{ marginRight: 8, color: BRAND_ORANGE }} />
              ① 基本信息
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Form.Item
                name="name"
                label="姓名/名称"
                rules={[{ required: true, message: "请输入商品完整名称" }]}
              >
                <Input placeholder="输入商品完整名称" size="large" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="brand" label="品牌">
                    <Input placeholder="选择或输入品牌" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="manufacturer" label="制造商">
                    <Input placeholder="生产商名称" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col xs={24} lg={8}>
              <div
                style={{
                  aspectRatio: "8/3",
                  border: "2px dashed #d9d9d9",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                  marginBottom: 8,
                }}
              >
                <PictureOutlined style={{ fontSize: 28, color: "#bfbfbf", marginBottom: 8 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>正面主图</Text>
              </div>
              <Form.Item name="image_url" label="商品图片">
                <Input placeholder="图片 URL（选填）" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <span>
              <UnorderedListOutlined style={{ marginRight: 8, color: BRAND_ORANGE }} />
              ② 商品详情
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="sku_code" label="SKU">
                <Input.Group compact>
                  <Form.Item name="sku_code" noStyle>
                    <Input placeholder="库存单位编码" style={{ width: "calc(100% - 40px)" }} />
                  </Form.Item>
                  <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshSku}
                    style={{ width: 40 }}
                    title="重新生成"
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="initial_stock" label="初始库存">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="alert_threshold" label="预警阈值">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="10" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <TagOutlined style={{ marginRight: 8, color: BRAND_ORANGE }} />
                  销售信息
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item name="price" label="售价 (CNY)">
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="0.00" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <ShoppingOutlined style={{ marginRight: 8, color: BRAND_ORANGE }} />
                  采购信息
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item name="cost" label="成本价 (CNY)">
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="0.00" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
          <Checkbox checked={saveAndContinue} onChange={(e) => setSaveAndContinue(e.target.checked)}>
            保存后继续新增下一个
          </Checkbox>
          <Button type="link" onClick={handleReset} style={{ padding: 0 }}>
            重置表单
          </Button>
        </div>
      </Form>
    </div>
  );
}
