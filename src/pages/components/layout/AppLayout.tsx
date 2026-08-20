import { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./header/Sidebar";
import { Layout, Button, Drawer, Badge, Tooltip } from "antd";
import Spinner from "../shared/Spinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { IconMenu2, IconBell, IconSun, IconMoon } from "@tabler/icons-react";
import AppBreadcrumb from "./AppBreadcrumb";
import NotificationPanel from "./header/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { IconAlertTriangle } from "@tabler/icons-react";

const { Content } = Layout;

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const { unreadCount, requestPermission, fcmToken } = useNotifications();
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleMouseLeave = () => {
    if (!collapsed) {
      const timeout = setTimeout(() => {
        setCollapsed(true);
      }, 500); // 500ms delay
      setHoverTimeout(timeout);
    }
  };

  const handleSidebarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isMenuItem =
      target.closest(".ant-menu-item") || target.closest(".ant-menu-submenu");

    if (collapsed && !isMenuItem) {
      setCollapsed(false);
    }
  };

  // Push Permission & Topic Subscription
  useEffect(() => {
    const enrollNotifications = async () => {
      await requestPermission();
    };
    enrollNotifications();
  }, []);

  // Subscribe token to topic once obtained
  useEffect(() => {
    if (fcmToken) {
      api.post("/api/v1/erp/notifications/subscribe", { token: fcmToken })
         .catch(err => console.warn("Failed to subscribe token on server", err));
    }
  }, [fcmToken]);

  return (
    <Layout
      className="bg-[#f9fafb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-black selection:text-white flex flex-row overflow-x-hidden"
      style={{ minHeight: "100vh" }}
    >
      {/* Desktop Fixed Sidebar */}
      <div
        className="hidden lg:block h-screen fixed top-0 left-0 z-50 transition-all duration-300"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleSidebarClick}
      >
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      </div>

      {/* Main Content Area */}
      <Layout
        hasSider={false}
        className={`bg-[#f9fafb] dark:bg-slate-950 transition-all duration-300 flex flex-col flex-1 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}
        style={{ minHeight: "100vh" }}
      >
        {/* Global Brand Accent */}
        <div className="w-full h-1 bg-black dark:bg-slate-800 fixed top-0 z-[100] left-0"></div>

        {/* System Maintenance Alert Banner */}
        {settings?.maintenanceMode && (
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold font-mono flex items-center justify-center gap-2 z-50 shadow-xs">
            <IconAlertTriangle size={16} />
            <span>SYSTEM MAINTENANCE MODE IS ACTIVE — Storefront checkout is locked.</span>
          </div>
        )}

        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 h-16 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Button
                type="text"
                icon={<IconMenu2 size={24} className="text-slate-600 dark:text-slate-300" />}
                onClick={() => setMobileMenuOpen(true)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <Tooltip title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}>
              <div 
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                onClick={toggleTheme}
              >
                {theme === "light" ? <IconMoon size={20} /> : <IconSun size={20} />}
              </div>
            </Tooltip>

            {/* Notifications Button */}
            <Tooltip title="Notifications">
              <div 
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
                onClick={() => setNotificationOpen(true)}
              >
                <Badge count={unreadCount} size="small" offset={[2, 0]}>
                  <IconBell size={20} className="text-slate-600 dark:text-slate-300" />
                </Badge>
              </div>
            </Tooltip>
          </div>
        </header>

        {/* Mobile Drawer Sidebar */}
        <Drawer
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          styles={{ body: { padding: 0 } }}
          width={260}
          closable={false}
        >
          <div className="h-full">
            <Sidebar isMobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </Drawer>

        <Content className="grow flex flex-col pt-8 lg:pt-12">
          {/* Global Padding Container matched to old ERP */}
          <div className="w-full mx-auto pb-12 flex-1 flex flex-col">
            <AppBreadcrumb />
            <div className="px-4 xl:px-8 flex-1 flex flex-col">
              <ErrorBoundary>
                <Suspense 
                  fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                      <Spinner size="large" tip="Loading page..." />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </Content>

        {/* Footer */}
        <footer className="w-full py-4 text-center border-t border-slate-100 dark:border-slate-900 mt-auto bg-[#f9fafb] dark:bg-slate-950">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest m-0">
            &copy; {new Date().getFullYear()} Developed by{" "}
            <a
              href="https://vx9studio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 transition-colors underline"
            >
              VX9Studio
            </a>
          </p>
        </footer>
      </Layout>

      {/* Global Notification Panel */}
      <NotificationPanel 
        open={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
    </Layout>
  );
}
