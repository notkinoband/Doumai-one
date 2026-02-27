"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Checkbox, Tabs, App, Space } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  WechatOutlined,
  DingtalkOutlined,
  SwapOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { BRAND } from "@/lib/constants";
import { isMockMode } from "@/lib/mock-mode";

const { Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { message } = App.useApp();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 600));
      message.success("登录成功，正在跳转...");
      setTimeout(() => (window.location.href = "/dashboard"), 300);
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.phone,
        password: values.password,
      });
      if (error) throw error;
      message.success("登录成功，正在跳转...");
      setTimeout(() => (window.location.href = "/dashboard"), 300);
    } catch {
      message.error("邮箱或密码错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = () => {
    if (countdown > 0) return;
    setCountdown(60);
    message.success("验证码已发送");
  };

  const headerNav = (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #FACC15, #EAB308)",
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
        <span style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>
          {BRAND.name}
        </span>
      </div>

      <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {["首页", "产品功能", "价格方案", "帮助中心"].map((item) => (
          <Text
            key={item}
            style={{ fontSize: 14, color: "#666", cursor: "pointer" }}
          >
            {item}
          </Text>
        ))}
      </nav>

      <Button
        type="primary"
        shape="round"
        style={{
          background: "linear-gradient(135deg, #FACC15, #EAB308)",
          border: "none",
          fontWeight: 600,
          height: 36,
          padding: "0 24px",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(234, 179, 8, 0.3)",
        }}
      >
        免费试用
      </Button>
    </header>
  );

  const leftPanel = (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(160deg, #FDE68A 0%, #BEF264 50%, #86EFAC 100%)",
        borderRadius: 24,
        margin: 24,
        padding: "60px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          transform: "translate(100px, -100px)",
        }}
      />

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.6)",
          borderRadius: 20,
          padding: "4px 14px",
          width: "fit-content",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22C55E",
          }}
        />
        <Text style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>
          V1.0 全新发布
        </Text>
      </div>

      <h1
        style={{
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.2,
          color: "#1a1a1a",
          margin: "0 0 16px",
        }}
      >
        一键同步
        <br />
        全网订单
      </h1>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: "rgba(0,0,0,0.6)",
          margin: "0 0 40px",
          maxWidth: 320,
        }}
      >
        高效管理多平台库存，智能补货预警，助力商家轻松运营。让数据驱动您的电商生意增长。
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SwapOutlined style={{ fontSize: 20, color: "#1a1a1a" }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>
              全渠道同步
            </div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
              支持淘宝、京东、拼多多、抖音等主流平台订单自动抓取。
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DatabaseOutlined style={{ fontSize: 20, color: "#1a1a1a" }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>
              智能库存管理
            </div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
              多仓联动，实时扣减，精准预警，告别超卖烦恼。
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 48,
        }}
      >
        <div style={{ display: "flex" }}>
          {["🛒", "👩", "📦"].map((emoji, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: i === 0 ? "#FDE68A" : i === 1 ? "#FBBF24" : "#F59E0B",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                marginLeft: i > 0 ? -10 : 0,
                zIndex: 3 - i,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
        <div
          style={{
            marginLeft: 4,
            background: "#FACC15",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            border: "2px solid #fff",
          }}
        >
          +2k
        </div>
      </div>
    </div>
  );

  const loginForm = (
    <Form size="large" layout="vertical" onFinish={handleLogin}>
      <Form.Item
        name="phone"
        rules={[{ required: true, message: "请输入手机号或邮箱地址" }]}
        style={{ marginBottom: 20 }}
      >
        <Input
          prefix={<UserOutlined style={{ color: "#bbb" }} />}
          placeholder="请输入手机号或邮箱地址"
          style={{ height: 46, borderRadius: 10 }}
        />
      </Form.Item>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: "#333" }}>密码</Text>
          <Text
            style={{ fontSize: 13, color: "#EAB308", cursor: "pointer" }}
          >
            忘记密码?
          </Text>
        </div>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
          style={{ marginBottom: 20 }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#bbb" }} />}
            placeholder="请输入密码"
            style={{ height: 46, borderRadius: 10 }}
          />
        </Form.Item>
      </div>

      <Form.Item style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: "#333", display: "block", marginBottom: 8 }}>
          验证码
        </Text>
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            prefix={<SafetyCertificateOutlined style={{ color: "#bbb" }} />}
            placeholder="输入验证码"
            style={{ flex: 1, height: 46, borderRadius: 10 }}
          />
          <Button
            style={{
              height: 46,
              borderRadius: 10,
              minWidth: 120,
              fontWeight: 500,
            }}
            disabled={countdown > 0}
            onClick={handleSendCode}
          >
            {countdown > 0 ? `${countdown}s` : "获取验证码"}
          </Button>
        </div>
      </Form.Item>

      <Form.Item style={{ marginBottom: 24 }}>
        <Checkbox>
          <Text style={{ fontSize: 13, color: "#999" }}>记住我</Text>
        </Checkbox>
      </Form.Item>

      <Form.Item style={{ marginBottom: 20 }}>
        <Button
          htmlType="submit"
          block
          loading={loading}
          style={{
            height: 50,
            borderRadius: 12,
            background: "linear-gradient(135deg, #FACC15, #EAB308)",
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            boxShadow: "0 4px 16px rgba(234, 179, 8, 0.35)",
          }}
        >
          <span style={{ marginRight: 8 }}>登录</span>
          <ArrowRightOutlined />
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <div style={{ padding: "20px 0", textAlign: "center" }}>
      <p style={{ color: "#999", marginBottom: 24 }}>
        无需注册，点击下方按钮一键体验 {BRAND.name} 全部功能
      </p>
      <Button
        size="large"
        block
        loading={loading}
        onClick={() => handleLogin({ phone: "demo@doumai.com", password: "demo123456" })}
        style={{
          height: 50,
          borderRadius: 12,
          background: "linear-gradient(135deg, #FACC15, #EAB308)",
          border: "none",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          boxShadow: "0 4px 16px rgba(234, 179, 8, 0.35)",
        }}
      >
        <TeamOutlined />
        <span style={{ marginLeft: 8 }}>进入演示模式</span>
      </Button>
      <p style={{ fontSize: 12, color: "#bbb", marginTop: 12 }}>
        演示数据定期重置，请放心体验
      </p>
    </div>
  );

  const rightPanel = (
    <div
      style={{
        width: 480,
        minWidth: 420,
        padding: "40px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Tabs
          defaultActiveKey="login"
          items={[
            { key: "login", label: "登录", children: loginForm },
            { key: "register", label: "注册", children: registerForm },
          ]}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 13, color: "#ccc" }}>其他方式登录</Text>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 32 }}>
        <div style={{ textAlign: "center", cursor: "pointer" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 6px",
            }}
          >
            <WechatOutlined style={{ fontSize: 24, color: "#22C55E" }} />
          </div>
          <Text style={{ fontSize: 12, color: "#999" }}>微信</Text>
        </div>
        <div style={{ textAlign: "center", cursor: "pointer" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 6px",
            }}
          >
            <DingtalkOutlined style={{ fontSize: 24, color: "#3B82F6" }} />
          </div>
          <Text style={{ fontSize: 12, color: "#999" }}>钉钉</Text>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <Text style={{ fontSize: 12, color: "#ccc" }}>
          登录即代表您同意{" "}
          <a style={{ color: "#EAB308" }}>服务条款</a>
          {" "}和{" "}
          <a style={{ color: "#EAB308" }}>隐私政策</a>
        </Text>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {headerNav}

      <div
        style={{
          flex: 1,
          display: "flex",
          paddingTop: 64,
          overflow: "hidden",
        }}
      >
        {leftPanel}
        {rightPanel}
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "16px 0",
          color: "#ccc",
          fontSize: 13,
        }}
      >
        © 2025 {BRAND.name} 版权所有
      </footer>
    </div>
  );
}
