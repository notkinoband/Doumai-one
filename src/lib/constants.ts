export const BRAND = {
  name: "兜卖",
  slogan: "多平台库存，一键掌控",
  description: "多平台电商库存管家 SaaS",
};

export const THEME = {
  primaryColor: "#1677FF",
  successColor: "#52C41A",
  warningColor: "#FAAD14",
  errorColor: "#FF4D4F",
};

export const PLANS = [
  {
    key: "free",
    name: "免费版",
    monthlyPrice: 0,
    yearlyPrice: 0,
    skuLimit: 50,
    channelLimit: 1,
    memberLimit: 1,
    features: {
      autoSync: false,
      minSyncInterval: null,
      inventoryAlert: false,
      returnDetection: false,
      customRules: false,
      apiAccess: false,
      dataExport: false,
      support: "社区",
    },
  },
  {
    key: "pro",
    name: "专业版",
    monthlyPrice: 49,
    yearlyPrice: 470,
    skuLimit: 500,
    channelLimit: 3,
    memberLimit: 3,
    features: {
      autoSync: true,
      minSyncInterval: 5,
      inventoryAlert: true,
      returnDetection: true,
      customRules: false,
      apiAccess: false,
      dataExport: "CSV",
      support: "在线客服",
    },
  },
  {
    key: "enterprise",
    name: "企业版",
    monthlyPrice: 99,
    yearlyPrice: 950,
    skuLimit: Infinity,
    channelLimit: Infinity,
    memberLimit: 10,
    features: {
      autoSync: true,
      minSyncInterval: 1,
      inventoryAlert: true,
      returnDetection: true,
      customRules: true,
      apiAccess: true,
      dataExport: "CSV+API",
      support: "专属客服",
    },
  },
] as const;
