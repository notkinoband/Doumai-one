"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Button, Typography, Progress, Spin } from "antd";
import {
  CheckCircleFilled,
  ShopOutlined,
  AppstoreOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useSearchParams, useRouter } from "next/navigation";
import { BRAND } from "@/lib/constants";

const { Title, Text } = Typography;

const steps = [
  { icon: <ShopOutlined />, label: "创建您的店铺" },
  { icon: <AppstoreOutlined />, label: "初始化示例商品" },
  { icon: <RocketOutlined />, label: "准备就绪" },
];

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/dashboard";
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => { setProgress(35); setCurrentStep(1); }, 600));
    timers.push(setTimeout(() => { setProgress(75); setCurrentStep(2); }, 1400));
    timers.push(setTimeout(() => { setProgress(100); setDone(true); }, 2200));
    timers.push(setTimeout(() => router.push(next), 3800));
    return () => timers.forEach(clearTimeout);
  }, [next, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #FDE68A 0%, #BEF264 50%, #86EFAC 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "56px 48px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        {done ? (
          <CheckCircleFilled
            style={{ fontSize: 64, color: "#52C41A", marginBottom: 24 }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FACC15, #EAB308)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            兜
          </div>
        )}

        <Title level={3} style={{ marginBottom: 8 }}>
          {done ? "一切准备就绪!" : `欢迎加入 ${BRAND.name}`}
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 32 }}>
          {done
            ? "示例数据已就位，即将进入工作台"
            : "正在为您初始化店铺环境..."}
        </Text>

        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={{ from: "#FACC15", to: "#52C41A" }}
          style={{ marginBottom: 32 }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {steps.map((step, i) => {
            const finished = i < currentStep || done;
            const active = i === currentStep && !done;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: finished
                    ? "#f6ffed"
                    : active
                      ? "#fffbe6"
                      : "#fafafa",
                  border: `1px solid ${finished ? "#b7eb8f" : active ? "#ffe58f" : "#f0f0f0"}`,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: finished
                      ? "#52C41A"
                      : active
                        ? "#FACC15"
                        : "#e8e8e8",
                    color: "#fff",
                    fontSize: 16,
                    transition: "all 0.3s",
                  }}
                >
                  {finished ? <CheckCircleFilled /> : step.icon}
                </div>
                <Text
                  strong={finished || active}
                  style={{
                    color: finished ? "#52C41A" : active ? "#d48806" : "#999",
                  }}
                >
                  {step.label}
                </Text>
              </div>
            );
          })}
        </div>

        {done && (
          <Button
            type="primary"
            size="large"
            block
            onClick={() => router.push(next)}
            style={{
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #FACC15, #EAB308)",
              border: "none",
              fontWeight: 600,
              color: "#fff",
              boxShadow: "0 4px 16px rgba(234, 179, 8, 0.35)",
            }}
          >
            进入工作台
          </Button>
        )}
      </div>
    </div>
  );
}
