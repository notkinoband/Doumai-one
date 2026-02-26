import type { Metadata } from "next";
import AntdRegistry from "@/components/AntdRegistry";
import AntdProvider from "@/components/AntdProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "兜卖 - 多平台电商库存管家",
  description: "让中小电商卖家像管理一个店铺一样管理所有平台的库存",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
