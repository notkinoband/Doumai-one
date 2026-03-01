"use client";

import React, { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Spin } from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  LinkOutlined,
  CrownOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { BRAND } from "@/lib/constants";
import { isMockMode, MOCK_USER, MOCK_TENANT } from "@/lib/mock-mode";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "数据看板" },
  { key: "/inventory", icon: <ShoppingOutlined />, label: "库存管理" },
  { key: "/channels", icon: <LinkOutlined />, label: "渠道同步" },
  { key: "/subscription", icon: <CrownOutlined />, label: "订阅服务" },
];

const bottomMenuItems = [
  { key: "settings", icon: <SettingOutlined />, label: "设置" },
  { key: "help", icon: <QuestionCircleOutlined />, label: "帮助" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, setTenant, setLoading, loading } = useAuthStore();
  const { siderCollapsed, toggleSider } = useUIStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      if (isMockMode) {
        setUser(MOCK_USER as any);
        setTenant(MOCK_TENANT as any);
        setLoading(false);
        setInitializing(false);
        return;
      }
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { router.push("/login"); return; }
        const { data: profile } = await supabase.from("users").select("*, tenants(*)").eq("auth_id", authUser.id).single();
        if (profile) {
          const { tenants, ...userData } = profile;
          setUser(userData); setTenant(tenants);
          if (userData.onboarding_completed === false) {
            router.replace(`/auth/welcome?next=${encodeURIComponent(pathname)}`);
            return;
          }
        } else {
          const res = await fetch("/api/auth/setup", { method: "POST" });
          if (res.ok) {
            const { data: newProfile } = await supabase.from("users").select("*, tenants(*)").eq("auth_id", authUser.id).single();
            if (newProfile) {
              const { tenants: t, ...ud } = newProfile;
              setUser(ud); setTenant(t);
              if (ud.onboarding_completed === false) {
                router.replace(`/auth/welcome?next=${encodeURIComponent(pathname)}`);
                return;
              }
            }
          }
        }
      } catch (err) { console.error("Init user error:", err); }
      finally { setLoading(false); setInitializing(false); }
    };
    initUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().clear();
    window.location.href = "/login";
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: user?.nickname || user?.email || "用户",
      },
      { type: "divider" as const },
      { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") handleLogout();
    },
  };

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout className="h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={siderCollapsed}
        width={200}
        style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      >
        <div
          className="h-16 flex items-center justify-center border-b border-gray-100 cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <Text strong style={{ fontSize: siderCollapsed ? 16 : 20, color: "#1677FF" }}>
            {siderCollapsed ? "兜" : BRAND.name}
          </Text>
        </div>
        <div className="flex flex-col justify-between" style={{ height: "calc(100vh - 64px)" }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{ border: "none" }}
            onClick={({ key }) => router.push(key)}
          />
          <Menu
            mode="inline"
            items={bottomMenuItems}
            style={{ border: "none" }}
            selectable={false}
          />
        </div>
      </Sider>
      <Layout>
        <Header
          className="flex items-center justify-between px-6"
          style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 24px", height: 64 }}
        >
          <div className="flex items-center">
            {React.createElement(
              siderCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              { className: "text-lg cursor-pointer", onClick: toggleSider }
            )}
          </div>
          <Space size={16}>
            <BellOutlined className="text-lg cursor-pointer" />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space className="cursor-pointer">
                <Avatar size="small" icon={<UserOutlined />} />
                {!siderCollapsed && (
                  <Text>{user?.nickname || user?.email?.split("@")[0] || "用户"}</Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          className="overflow-auto"
          style={{ padding: 24, background: "#f5f5f5", minHeight: 280 }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
