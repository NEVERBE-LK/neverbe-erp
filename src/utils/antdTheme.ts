import type { ThemeConfig } from "antd";

/**
 * Ant Design Theme Configuration for NEVERBE ERP
 * Sleek athletic monochrome palette (emerald accents for success metrics)
 */
export const antdTheme: ThemeConfig = {
  token: {
    // Primary athletic palette
    colorPrimary: "#0a0a0a",
    colorPrimaryHover: "#262626",
    colorPrimaryActive: "#000000",
    colorSuccess: "#10b981", // Emerald-500
    colorWarning: "#f59e0b", // Amber-500
    colorError: "#ef4444", // Red-500
    colorInfo: "#0a0a0a",

    // Background colors
    colorBgLayout: "#f5f5f5",

    // Typography
    fontFamily:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,

    // Clean modern rounded borders
    borderRadius: 10,
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 600,
      primaryShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
      borderRadius: 10,
    },
    Input: {
      controlHeight: 40,
      activeBorderColor: "#0a0a0a",
      hoverBorderColor: "#71717a",
      activeShadow: "0 0 0 2px rgba(10, 10, 10, 0.08)",
      borderRadius: 10,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 10,
    },
    DatePicker: {
      controlHeight: 40,
      borderRadius: 10,
    },
    Table: {
      headerBg: "#fafafa",
      headerColor: "#18181b",
      rowHoverBg: "#f4f4f5",
      borderRadius: 10,
    },
    Menu: {
      itemSelectedBg: "#f4f4f5",
      itemSelectedColor: "#0a0a0a",
      activeBarBorderWidth: 2,
    },
    Tabs: {
      inkBarColor: "#0a0a0a",
      itemSelectedColor: "#0a0a0a",
      itemHoverColor: "#27272a",
    },
  },
};

export default antdTheme;
