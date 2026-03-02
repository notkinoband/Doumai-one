"use client";

import React, { useState, useRef } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Select,
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
  UploadOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { createProductWithSku, type CreateProductPayload } from "@/services/inventory";
import { createClient } from "@/lib/supabase/client";

const { Text } = Typography;

const BRAND_ORANGE = "#D35400";
// 需在 Supabase Dashboard → Storage 创建公开桶 product-images，并设置允许已认证用户上传
const PRODUCT_IMAGE_BUCKET = "product-images";

function generateSkuCode(): string {
  return `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function ProductImageUpload({ form }: { form: FormInstance }) {
  const { message } = App.useApp();
  const imageUrl = Form.useWatch("image_url", form) as string | undefined;
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const tenant = useAuthStore.getState().tenant;
    if (!tenant) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      form.setFieldValue("image_url", publicUrl);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const clearImage = () => {
    form.setFieldValue("image_url", undefined);
  };

  return (
    <div
      style={{
        aspectRatio: "8/3",
        border: "2px dashed #d9d9d9",
        borderRadius: 8,
        background: "#fafafa",
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={uploading}
      />
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="商品图" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          <div style={{ position: "absolute", bottom: 8, display: "flex", gap: 8 }}>
            <Button size="small" onClick={() => inputRef.current?.click()} loading={uploading} icon={<UploadOutlined />}>
              更换
            </Button>
            <Button size="small" onClick={clearImage}>移除</Button>
          </div>
        </>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: uploading ? "wait" : "pointer" }}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <PictureOutlined style={{ fontSize: 28, color: "#bfbfbf", marginBottom: 8 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{uploading ? "上传中…" : "点击上传正面主图"}</Text>
        </div>
      )}
    </div>
  );
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
        form.setFieldValue("image_url", undefined);
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
    form.setFieldValue("image_url", undefined);
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
              基本信息
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
              <Form.Item name="alert_threshold" label="预警阈值">
                <InputNumber min={0} style={{ width: "100%", maxWidth: 160 }} placeholder="10" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>商品图片</Text>
              </div>
              <ProductImageUpload form={form} />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <span>
              <UnorderedListOutlined style={{ marginRight: 8, color: BRAND_ORANGE }} />
              商品详情
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="unit_type" label="货物类型">
                <Input placeholder="例如: 件、个、kg" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="initial_stock" label="初始库存">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
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
              <Form.Item name="price" label="售价 (CNY) *" rules={[{ required: true, message: "请输入售价" }]}>
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="0.00" />
              </Form.Item>
              <Form.Item name="sales_account" label="销售账户">
                <Select placeholder="选择销售账户" allowClear options={[{ value: "一般销售收入", label: "一般销售收入" }, { value: "劳务服务收入", label: "劳务服务收入" }]} />
              </Form.Item>
              <Form.Item name="sales_description" label="销售描述">
                <Input.TextArea rows={3} placeholder="将显示在报价单和发票上" />
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
              <Form.Item name="cost" label="成本价 (CNY) *" rules={[{ required: true, message: "请输入成本价" }]}>
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="0.00" />
              </Form.Item>
              <Form.Item name="preferred_supplier" label="首选供应商">
                <Select placeholder="选择供应商..." allowClear options={[{ value: "供应商 A", label: "供应商 A" }, { value: "供应商 B", label: "供应商 B" }]} />
              </Form.Item>
              <Form.Item name="procurement_description" label="采购描述">
                <Input.TextArea rows={3} placeholder="内部备注 or 采购单说明" />
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
