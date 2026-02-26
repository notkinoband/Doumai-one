"use client";

import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Divider, App, Tabs } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants";

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { message } = App.useApp();
  const supabase = createClient();

  const handleEmailLogin = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
      message.success("登录链接已发送到您的邮箱，请查收");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "发送失败，请重试";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@doumai.com",
        password: "demo123456",
      });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch {
      message.error("演示账号登录失败，请使用邮箱登录");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12"
        style={{ background: "linear-gradient(135deg, #1677FF 0%, #0958D9 100%)" }}
      >
        <div className="max-w-md text-center">
          <Title level={1} style={{ color: "#fff", marginBottom: 16, fontSize: 42 }}>
            {BRAND.name}
          </Title>
          <Title level={3} style={{ color: "rgba(255,255,255,0.9)", fontWeight: 400 }}>
            {BRAND.slogan}
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 32 }}>
            跨平台库存实时联动 · 恶意退货智能识别 · 中小卖家友好定价
          </Paragraph>
          <div className="mt-12 grid grid-cols-3 gap-6 text-white text-center">
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm opacity-75 mt-1">免费 SKU</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5s</div>
              <div className="text-sm opacity-75 mt-1">同步延迟</div>
            </div>
            <div>
              <div className="text-3xl font-bold">¥49</div>
              <div className="text-sm opacity-75 mt-1">起/月</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg" styles={{ body: { padding: 32 } }}>
          <div className="text-center mb-6">
            <Title level={3} className="lg:hidden" style={{ color: "#1677FF" }}>
              {BRAND.name}
            </Title>
            <Text type="secondary">登录以管理您的多平台库存</Text>
          </div>

          <Tabs
            centered
            items={[
              {
                key: "email",
                label: "邮箱登录",
                children: sent ? (
                  <div className="text-center py-8">
                    <MailOutlined style={{ fontSize: 48, color: "#1677FF" }} />
                    <Title level={4} className="mt-4">
                      请查看您的邮箱
                    </Title>
                    <Paragraph type="secondary">
                      我们已发送登录链接到您的邮箱，点击链接即可完成登录
                    </Paragraph>
                    <Button type="link" onClick={() => setSent(false)}>
                      使用其他邮箱
                    </Button>
                  </div>
                ) : (
                  <Form onFinish={handleEmailLogin} size="large" layout="vertical">
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "请输入邮箱" },
                        { type: "email", message: "邮箱格式不正确" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block loading={loading}>
                        发送登录链接
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: "demo",
                label: "演示模式",
                children: (
                  <div className="text-center py-4">
                    <Paragraph type="secondary" className="mb-6">
                      无需注册，一键体验兜卖全部功能
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<LockOutlined />}
                      loading={loading}
                      onClick={handleDemoLogin}
                    >
                      进入演示模式
                    </Button>
                    <Paragraph type="secondary" className="mt-3" style={{ fontSize: 12 }}>
                      演示账号数据定期重置
                    </Paragraph>
                  </div>
                ),
              },
            ]}
          />

          <Divider plain>
            <Text type="secondary" style={{ fontSize: 12 }}>
              登录即表示同意《服务协议》和《隐私政策》
            </Text>
          </Divider>
        </Card>
      </div>
    </div>
  );
}
