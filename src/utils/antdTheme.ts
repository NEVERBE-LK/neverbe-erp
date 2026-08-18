import type { ThemeConfig } from "antd";

/**
 * Ant Design Theme Configuration for NEVER Panel
 * Modern B2B Slate ERP Theme (Emerald accents for success metrics)
 */
export const antdTheme: ThemeConfig = {
  token: {
    // Primary slate palette
    colorPrimary: "#0f172a", // Slate-900
    colorSuccess: "#10b981", // Emerald-500 (Preserved for status indicators)
    colorWarning: "#f59e0b", // Amber-500
    colorError: "#ef4444", // Red-500
    colorInfo: "#0f172a", // Slate-900

    // Background colors
    colorBgLayout: "#f9fafb", // Gray-50

    // Typography
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,

    // Softer spacing & borders for modern professional look
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 600,
      primaryShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    Input: {
      controlHeight: 40,
      activeBorderColor: "#0f172a",
      hoverBorderColor: "#64748b",
      activeShadow: "0 0 0 2px rgba(15, 23, 42, 0.08)",
    },
    Select: {
      controlHeight: 40,
    },
    DatePicker: {
      controlHeight: 40,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#475569",
      rowHoverBg: "#f8fafc",
    },
    Menu: {
      itemSelectedBg: "#f1f5f9",
      itemSelectedColor: "#0f172a",
      activeBarBorderWidth: 2,
    },
    Tabs: {
      inkBarColor: "#0f172a",
      itemSelectedColor: "#0f172a",
      itemHoverColor: "#334155",
    },
  },
};

export default antdTheme;
