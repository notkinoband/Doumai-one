"use client";

import React, { useState, Suspense, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  InputNumber,
  Button,
  Steps,
  Card,
  App,
  Space,
  Spin,
} from "antd";
import {
  ShopOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants";
import type { OnboardingCompletePayload, OnboardingProduct } from "@/services/onboarding";

const BRAND_PRIMARY = "#D35400";
const BRAND_SECONDARY = "#E67E22";

const STORE_CATEGORIES = [
  { value: "服饰鞋包", label: "服饰鞋包" },
  { value: "美妆个护", label: "美妆个护" },
  { value: "食品生鲜", label: "食品生鲜" },
  { value: "3C数码", label: "3C数码" },
  { value: "家居日用", label: "家居日用" },
  { value: "其他", label: "其他" },
];

const SKU_SCALE_OPTIONS = [
  { value: "1-100", label: "1-100" },
  { value: "100-500", label: "100-500" },
  { value: "500+", label: "500+" },
];

const PLATFORM_OPTIONS = [
  "淘宝/天猫",
  "拼多多",
  "京东",
  "微信视频号",
  "抖音电商",
  "快手小店",
  "小红书",
  "自有小程序",
];

const stepItems = [
  { title: "店铺基础", icon: <ShopOutlined /> },
  { title: "渠道与偏好", icon: <ShoppingCartOutlined /> },
  { title: "初始商品", icon: <InboxOutlined /> },
];

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/dashboard";
  const { message } = App.useApp();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      supabase
        .from("users")
        .select("onboarding_completed")
        .eq("auth_id", user.id)
        .single()
        .then(({ data }) => {
          setChecking(false);
          if (data?.onboarding_completed) router.replace(next);
        })
        .then(undefined, () => setChecking(false));
    });
  }, [next, router]);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [step1Data, setStep1Data] = useState<{ storeName?: string; category?: string | null; skuScale?: string | null } | null>(null);
  const [step2Data, setStep2Data] = useState<{ platforms?: string[]; globalAlertThreshold?: number } | null>(null);
  const [step1Form] = Form.useForm();
  const [step2Form] = Form.useForm();
  const [step3Form] = Form.useForm();

  const goNext = async () => {
    if (currentStep === 0) {
      try {
        await step1Form.validateFields();
        setStep1Data(step1Form.getFieldsValue());
        setCurrentStep(1);
      } catch {
        // validation failed
      }
      return;
    }
    if (currentStep === 1) {
      setStep2Data(step2Form.getFieldsValue());
      setCurrentStep(2);
      return;
    }
    await submitOnboarding();
  };

  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const submitOnboarding = async () => {
    try {
      await step3Form.validateFields();
    } catch {
      return;
    }
    const step1 = step1Data ?? step1Form.getFieldsValue();
    const step2 = step2Data ?? step2Form.getFieldsValue();
    const { productList } = step3Form.getFieldsValue();
    const products: OnboardingProduct[] = (productList || [])
      .filter((p: { name?: string }) => p?.name?.trim())
      .map((p: { name: string; skuCode?: string; initialStock?: number }) => ({
        name: p.name.trim(),
        skuCode: p.skuCode?.trim() || undefined,
        initialStock: Number(p.initialStock) || 0,
      }));
    if (products.length === 0) {
      message.error("请至少添加一个商品");
      return;
    }

    const payload: OnboardingCompletePayload = {
      step1: {
        storeName: step1.storeName?.trim() || "",
        category: step1.category || null,
        skuScale: step1.skuScale || null,
      },
      step2: {
        platforms: step2.platforms || [],
        globalAlertThreshold: Number(step2.globalAlertThreshold) ?? 5,
      },
      products,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      message.success("设置完成，即将进入控制台");
      router.push(next);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            兜
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
            {BRAND.name} Doumai
          </span>
        </Space>
        <span style={{ fontSize: 14, color: "#666" }}>初始化设置</span>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Card
          style={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #f0f0f0" }}>
            <Steps
              current={currentStep}
              items={stepItems.map((item, i) => ({
                title: item.title,
                icon: item.icon,
                status: i < currentStep ? "finish" : i === currentStep ? "process" : "wait",
              }))}
            />
          </div>

          <div style={{ padding: "32px 40px 40px" }}>
            {currentStep === 0 && (
              <Form
                form={step1Form}
                layout="vertical"
                initialValues={{ category: undefined, skuScale: undefined }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#1a1a1a" }}>
                    欢迎来到兜卖！先告诉我们您的店铺信息
                  </h2>
                  <p style={{ color: "#666", fontSize: 14 }}>
                    这些信息将帮助我们为您配置最合适的系统环境。
                  </p>
                </div>
                <Form.Item
                  name="storeName"
                  label="您的店铺名称/品牌名"
                  rules={[{ required: true, message: "请输入店铺名称" }]}
                >
                  <Input placeholder="例如：兜卖官方旗舰店" size="large" />
                </Form.Item>
                <Form.Item name="category" label="主营商品类目">
                  <Select placeholder="请选择类目..." allowClear options={STORE_CATEGORIES} size="large" />
                </Form.Item>
                <Form.Item name="skuScale" label="预计SKU规模">
                  <Select placeholder="请选择规模..." allowClear options={SKU_SCALE_OPTIONS} size="large" />
                </Form.Item>
              </Form>
            )}

            {currentStep === 1 && (
              <Form
                form={step2Form}
                layout="vertical"
                initialValues={{ platforms: [], globalAlertThreshold: 5 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#1a1a1a" }}>
                    您的销售渠道与库存偏好
                  </h2>
                  <p style={{ color: "#666", fontSize: 14 }}>
                    选择您正在使用的平台，我们将为您开启对应的库存同步接口。
                  </p>
                </div>
                <Form.Item name="platforms" label="最常使用的电商平台 (可多选)">
                  <Checkbox.Group
                    options={PLATFORM_OPTIONS.map((p) => ({ label: p, value: p }))}
                    style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}
                  />
                </Form.Item>
                <div
                  style={{
                    background: "#e6f4ff",
                    border: "1px solid #91caff",
                    borderRadius: 8,
                    padding: 16,
                    marginTop: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#1677ff", fontSize: 16 }}>ℹ️</span>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>库存预警设置</h4>
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#666" }}>
                        当商品全网总库存低于此数值时，系统将向您发送预警通知，防止超卖。
                      </p>
                      <Form.Item
                        name="globalAlertThreshold"
                        label="全局预警阈值"
                        rules={[{ required: true, message: "请输入预警阈值" }]}
                        style={{ marginBottom: 0 }}
                        labelCol={{ style: { marginBottom: 4 } }}
                      >
                        <InputNumber min={0} addonAfter="件" style={{ width: 120 }} />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </Form>
            )}

            {currentStep === 2 && (
              <Form form={step3Form} layout="vertical" initialValues={{ productList: [{ name: "", skuCode: "", initialStock: 100 }] }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#1a1a1a" }}>
                    录入您的第一批商品
                  </h2>
                  <p style={{ color: "#666", fontSize: 14 }}>
                    您可以先手动添加几个核心商品体验功能，后续支持 Excel 批量导入或从平台一键同步。
                  </p>
                </div>
                <Form.List name="productList">
                  {(fields, { add, remove }) => (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 40px", gap: 8, marginBottom: 8, alignItems: "center", fontSize: 12, color: "#666" }}>
                        <span>商品名称</span>
                        <span>SKU 编码 (选填)</span>
                        <span>初始库存</span>
                        <span />
                      </div>
                      {fields.map(({ key, name }) => (
                        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 40px", gap: 8, alignItems: "center", marginBottom: 8 }}>
                          <Form.Item name={[name, "name"]} noStyle rules={[{ required: true, message: "必填" }]}>
                            <Input placeholder="例如：夏季纯棉T恤 白色 M码" />
                          </Form.Item>
                          <Form.Item name={[name, "skuCode"]} noStyle>
                            <Input placeholder="TSHIRT-W-M" />
                          </Form.Item>
                          <Form.Item name={[name, "initialStock"]} noStyle initialValue={100}>
                            <InputNumber min={0} style={{ width: "100%" }} placeholder="100" />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                            disabled={fields.length <= 1}
                          />
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                        继续添加商品
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form>
            )}

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {currentStep > 0 ? (
                <Button icon={<ArrowLeftOutlined />} onClick={goPrev}>
                  上一步
                </Button>
              ) : (
                <span />
              )}
              {currentStep < 2 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={goNext}
                  style={{ background: BRAND_PRIMARY, borderColor: BRAND_PRIMARY }}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={submitting}
                  onClick={goNext}
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                >
                  完成设置，进入控制台
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="large" tip="加载中..." /></div>}>
      <WelcomeContent />
    </Suspense>
  );
}
