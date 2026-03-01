import React from "react";
import Link from "next/link";
import {
  SyncOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const BRAND_ORANGE = "#D35400";
const BRAND_CREAM = "#FDFCFB";
const BRAND_DARK = "#1A1A1A";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BRAND_CREAM }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: BRAND_ORANGE, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
              兜
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>兜卖 Doumai</span>
          </div>
          <nav style={{ display: "flex", gap: 32, alignItems: "center", fontSize: 14, color: "#4b5563" }}>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>核心功能</a>
            <a href="#about" style={{ color: "inherit", textDecoration: "none" }}>产品运营</a>
            <a href="#testimonials" style={{ color: "inherit", textDecoration: "none" }}>客户口碑</a>
            <a href="#pricing" style={{ color: "inherit", textDecoration: "none" }}>套餐定价</a>
            <a href="#help" style={{ color: "inherit", textDecoration: "none" }}>帮助中心</a>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none" }}>
              登录
            </Link>
            <Link
              href="/login"
              style={{
                background: BRAND_ORANGE,
                color: "#fff",
                padding: "8px 20px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              免费试用
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ position: "relative", height: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc7sZSiU1VikQbNaeBw0OVs1qN6t0G5VWRfZewP7QOe7pS5V9lMKm5BxHC9cy0Zyo9f1VfNXsbyIpA9FQUF8EtcJPB7pnkWVFmbVicAZTevwsQtw3C27PFhRyidlWhc1lIaVL99X_N03S7yFFcyuvyM9Mr-LtRv2FxB6YWdoadaW5BM9i4DNBb9TbMTEbpF3y-u3my_9DNH132BVs1HSiDlXcOLEN7V7g1CYFF4Pc6XdHkY8R7F3rGvGLAI8vc0dNwNq4SlNgY6XA"
            alt="电商仓储"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 1rem", maxWidth: 896, margin: "0 auto" }}>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", fontWeight: 700, color: "#fff", marginBottom: 24, lineHeight: 1.2 }}>
              掌握多平台库存的艺术
            </h1>
            <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.9)", marginBottom: 40, maxWidth: 576, margin: "0 auto 40px", lineHeight: 1.6 }}>
              让中小卖家像管理一个店铺一样管理所有平台的库存，彻底告别超卖焦虑与恶意退货损失。
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                background: BRAND_ORANGE,
                color: "#fff",
                padding: "16px 40px",
                borderRadius: 6,
                fontSize: 18,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)",
              }}
            >
              开启高效管理
            </Link>
          </div>
        </section>

        {/* 核心价值优势 */}
        <section id="features" style={{ padding: "80px 1rem", background: BRAND_CREAM }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111", marginBottom: 16 }}>核心价值优势</h2>
              <div style={{ width: 80, height: 4, background: BRAND_ORANGE, margin: "0 auto" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
              <div style={{ background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "#fff7ed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <SyncOutlined style={{ fontSize: 32, color: BRAND_ORANGE }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#111" }}>库存实时联动</h3>
                <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 14 }}>
                  支持微信小程序以及多服务平台库存实时同步，下单即时扣减，精准库存统计，彻底告别超卖烦恼。
                </p>
              </div>
              <div style={{ background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "#fff7ed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <WarningOutlined style={{ fontSize: 32, color: BRAND_ORANGE }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#111" }}>恶意囤货防护</h3>
                <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 14 }}>
                  行业首创买家恶意囤货行为预警，可根据风险预警一键加入黑名单，自动拦截恶意囤货，降低资产损失。
                </p>
              </div>
              <div style={{ background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "#fff7ed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <ThunderboltOutlined style={{ fontSize: 32, color: BRAND_ORANGE }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#111" }}>极致轻量体验</h3>
                <p style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 14 }}>
                  5分钟完成店铺授权，专业库存管理单一后台集中管理，简单易用。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 客户口碑 */}
        <section id="testimonials" style={{ padding: "64px 1rem", background: BRAND_CREAM }}>
          <div style={{ maxWidth: 896, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111", marginBottom: 24 }}>客户口碑</h2>
            <p style={{ color: "#4b5563", lineHeight: 1.8, fontSize: 16 }}>
              来自中小卖家的真实反馈：库存一目了然，再也不用担心超卖和恶意退货。
            </p>
          </div>
        </section>

        {/* 全能管家 */}
        <section id="about" style={{ padding: "96px 1rem", background: "#fff" }}>
          <div style={{ maxWidth: 896, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 700, color: "#111", marginBottom: 40, lineHeight: 1.3 }}>
              为中小卖家量身定制的
              <br />
              全能管家
            </h2>
            <div style={{ color: "#4b5563", lineHeight: 1.8, fontSize: 16 }}>
              <p style={{ marginBottom: 24 }}>
                在中国电商日益碎片化的今天，中小卖家往往同时经营着微信私域、拼多多、淘宝等多个渠道。这种“多点开花”的背后，是繁琐的库存核对和随时可能发生的“超卖”危机。
              </p>
              <p style={{ marginBottom: 24 }}>
                传统的 ERP 系统动辄数千元一年，操作复杂，80% 的功能对中小卖家而言都是多余的。我们意识到，卖家真正需要的不是一套庞大臃肿的系统，而是一个能实时对齐数据、能防范恶意风险的“库存管家”。
              </p>
              <p>
                兜卖（Doumai）由此诞生。我们通过轻量化的 SaaS 架构，让每一个 1-10 人的小团队也能享受到企业级的技术保障。我们的愿景，是让每一笔订单都清清楚楚，让每一件库存都物尽其用。
              </p>
            </div>
          </div>
        </section>

        {/* 套餐定价 */}
        <section id="pricing" style={{ padding: "80px 1rem", background: "#fff" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111", marginBottom: 16 }}>选择适合您的套餐</h2>
              <p style={{ color: "#6b7280", fontSize: 14 }}>透明定价，助力每一个中小梦想</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>免费版</h3>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>¥0 <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>/月</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, fontSize: 14, color: "#4b5563" }}>
                  <li style={{ marginBottom: 12 }}>✓ 50 SKU 管理上限</li>
                  <li style={{ marginBottom: 12 }}>✓ 1 个客服授权</li>
                  <li style={{ marginBottom: 12 }}>✓ 基础库存管理</li>
                  <li style={{ marginBottom: 12, color: "#d1d5db" }}>✗ 自动同步</li>
                  <li style={{ marginBottom: 12, color: "#d1d5db" }}>✗ 恶意退货检测</li>
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", border: "1px solid #e5e7eb", padding: "12px", borderRadius: 6, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                  即刻开通
                </Link>
              </div>
              <div style={{ border: `2px solid ${BRAND_ORANGE}`, borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)", background: BRAND_ORANGE, color: "#fff", padding: "4px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                  最受欢迎
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>专业版</h3>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>¥49 <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>/月</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, fontSize: 14, color: "#4b5563" }}>
                  <li style={{ marginBottom: 12 }}>✓ 500 SKU 管理上限</li>
                  <li style={{ marginBottom: 12 }}>✓ 3 个客服授权</li>
                  <li style={{ marginBottom: 12 }}>✓ 自动补货预警</li>
                  <li style={{ marginBottom: 12 }}>✓ 库存与销量数据</li>
                  <li style={{ marginBottom: 12 }}>✓ 销量溢价检测</li>
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", background: BRAND_ORANGE, color: "#fff", padding: "12px", borderRadius: 6, fontWeight: 600, textDecoration: "none" }}>
                  立即升级
                </Link>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>企业版</h3>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>¥99 <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>/月</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, fontSize: 14, color: "#4b5563" }}>
                  <li style={{ marginBottom: 12 }}>✓ 无限 SKU 拓展</li>
                  <li style={{ marginBottom: 12 }}>✓ 不限客服数量</li>
                  <li style={{ marginBottom: 12 }}>✓ 7×24 小时同步</li>
                  <li style={{ marginBottom: 12 }}>✓ 多人协作管理</li>
                  <li style={{ marginBottom: 12 }}>✓ 专属 1 对 1 客服</li>
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", border: `1px solid ${BRAND_ORANGE}`, color: BRAND_ORANGE, padding: "12px", borderRadius: 6, fontWeight: 600, textDecoration: "none" }}>
                  联系我们
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="help" style={{ background: BRAND_DARK, color: "#9ca3af", padding: "64px 1rem 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "#fff" }}>
                <div style={{ width: 24, height: 24, background: BRAND_ORANGE, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>兜</div>
                <span style={{ fontSize: 18, fontWeight: 700 }}>兜卖 Doumai</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>中小电商卖家的多平台库存管理利器，告别超卖，护航资产。</p>
            </div>
            <div>
              <h5 style={{ color: "#fff", fontWeight: 700, marginBottom: 24, fontSize: 12, letterSpacing: "0.05em" }}>相关链接</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
                <li style={{ marginBottom: 12 }}><a href="#about" style={{ color: "inherit", textDecoration: "none" }}>关于产品</a></li>
                <li style={{ marginBottom: 12 }}><a href="#features" style={{ color: "inherit", textDecoration: "none" }}>功能特性</a></li>
                <li style={{ marginBottom: 12 }}><a href="#pricing" style={{ color: "inherit", textDecoration: "none" }}>套餐价格</a></li>
                <li style={{ marginBottom: 12 }}><a href="#help" style={{ color: "inherit", textDecoration: "none" }}>帮助中心</a></li>
                <li style={{ marginBottom: 12 }}><a href="#" style={{ color: "inherit", textDecoration: "none" }}>用户协议</a></li>
              </ul>
            </div>
            <div>
              <h5 style={{ color: "#fff", fontWeight: 700, marginBottom: 24, fontSize: 12, letterSpacing: "0.05em" }}>联系我们</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
                <li style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <MailOutlined /> info@doumai-saas.com
                </li>
                <li style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <ClockCircleOutlined /> 工作日 09:00 - 18:00
                </li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #374151", paddingTop: 32, fontSize: 12, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
            <p>© 2025 兜卖 Doumai. All rights reserved. 隐私政策 | 服务条款</p>
            <p>让中国中小电商卖家经营更简单</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
