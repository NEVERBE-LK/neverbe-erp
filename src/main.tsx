import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import GlobalProvider from "@/components/GlobalProvider";
import { ConfirmationDialogProvider } from "@/contexts/ConfirmationDialogContext";
import { Toaster } from "react-hot-toast";
import { ConfigProvider, theme as antdThemeHelper } from "antd";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import App from "./App";
import "./index.css";

import { SettingsProvider } from "@/contexts/SettingsContext";

const AntdAppWrapper = () => {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark"
            ? antdThemeHelper.darkAlgorithm
            : antdThemeHelper.defaultAlgorithm,
        token: {
          colorPrimary: theme === "dark" ? "#ffffff" : "#0a0a0a",
          colorPrimaryHover: theme === "dark" ? "#e5e5e5" : "#262626",
          colorPrimaryActive: theme === "dark" ? "#d4d4d4" : "#000000",
          colorSuccess: "#10b981",
          controlOutline:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(10, 10, 10, 0.08)",
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          borderRadius: 10,
        },
        components: {
          Input: {
            activeBorderColor: theme === "dark" ? "#ffffff" : "#0a0a0a",
            hoverBorderColor: theme === "dark" ? "#525252" : "#a1a1aa",
            activeShadow:
              theme === "dark"
                ? "0 0 0 2px rgba(255, 255, 255, 0.12)"
                : "0 0 0 2px rgba(10, 10, 10, 0.08)",
          },
          Select: {
            colorPrimary: theme === "dark" ? "#ffffff" : "#0a0a0a",
            colorPrimaryHover: theme === "dark" ? "#e5e5e5" : "#262626",
            activeBorderColor: theme === "dark" ? "#ffffff" : "#0a0a0a",
            hoverBorderColor: theme === "dark" ? "#525252" : "#a1a1aa",
          },
          Pagination: {
            itemActiveBg: theme === "dark" ? "#ffffff" : "#0a0a0a",
            colorPrimary: theme === "dark" ? "#0a0a0a" : "#ffffff",
          },
        },
      }}
    >
      <GlobalProvider>
        <SettingsProvider>
          <ConfirmationDialogProvider>
            <Toaster position="top-right" />
            <App />
          </ConfirmationDialogProvider>
        </SettingsProvider>
      </GlobalProvider>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <AntdAppWrapper />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
