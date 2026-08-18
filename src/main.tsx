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
          colorPrimary: theme === "dark" ? "#f8fafc" : "#0f172a",
          colorPrimaryHover: theme === "dark" ? "#cbd5e1" : "#1e293b",
          colorPrimaryActive: theme === "dark" ? "#ffffff" : "#020617",
          controlOutline:
            theme === "dark"
              ? "rgba(248, 250, 252, 0.15)"
              : "rgba(15, 23, 42, 0.08)",
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          borderRadius: 10,
        },
        components: {
          Input: {
            activeBorderColor: theme === "dark" ? "#f8fafc" : "#0f172a",
            hoverBorderColor: theme === "dark" ? "#475569" : "#cbd5e1",
            activeShadow:
              theme === "dark"
                ? "0 0 0 2px rgba(248, 250, 252, 0.15)"
                : "0 0 0 2px rgba(15, 23, 42, 0.08)",
          },
          Select: {
            colorPrimary: theme === "dark" ? "#f8fafc" : "#0f172a",
            colorPrimaryHover: theme === "dark" ? "#cbd5e1" : "#1e293b",
            activeBorderColor: theme === "dark" ? "#f8fafc" : "#0f172a",
            hoverBorderColor: theme === "dark" ? "#475569" : "#cbd5e1",
            activeShadow:
              theme === "dark"
                ? "0 0 0 2px rgba(248, 250, 252, 0.15)"
                : "0 0 0 2px rgba(15, 23, 42, 0.08)",
          },
          Pagination: {
            itemActiveBg: theme === "dark" ? "#1e293b" : "#0f172a",
            colorPrimary: theme === "dark" ? "#f8fafc" : "#ffffff",
          },
        },
      }}
    >
      <GlobalProvider>
        <ConfirmationDialogProvider>
          <Toaster position="top-right" />
          <App />
        </ConfirmationDialogProvider>
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
