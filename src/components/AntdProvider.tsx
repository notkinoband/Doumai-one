"use client";

import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { THEME } from "@/lib/constants";

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: THEME.primaryColor,
          colorSuccess: THEME.successColor,
          colorWarning: THEME.warningColor,
          colorError: THEME.errorColor,
          fontFamily:
            '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
