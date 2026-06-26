import { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./header/Sidebar";
import { Layout, Button, Drawer, Badge, Tooltip, Spin } from "antd";
import ErrorBoundary from "@/components/ErrorBoundary";
import { IconMenu2, IconBell } from "@tabler/icons-react";
import AppBreadcrumb from "./AppBreadcrumb";
import NotificationPanel from "./header/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import api from "@/lib/api";

const { Content } = Layout;

export default function AppLayout() {
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
      className="bg-[#f9fafb] text-black font-sans selection:bg-black selection:text-white flex flex-row overflow-x-hidden"
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
        className={`bg-[#f9fafb] transition-all duration-300 flex flex-col flex-1 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}
        style={{ minHeight: "100vh" }}
      >
        {/* Global Brand Accent */}
        <div className="w-full h-1 bg-black fixed top-0 z-[100] left-0"></div>

        <header className="sticky top-0 bg-white border-b-2 border-gray-200 h-16 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<IconMenu2 size={24} />}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            />
            <div className="hidden lg:block w-8"></div>
          </div>

          <div className="flex items-center gap-4">
            <Tooltip title="Notifications">
              <div 
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                onClick={() => setNotificationOpen(true)}
              >
                <Badge count={unreadCount} size="small" offset={[2, 0]}>
                  <IconBell size={22} className="text-gray-600" />
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
                      <Spin size="large" tip="Loading page..." />
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
        <footer className="w-full py-4 text-center border-t border-gray-100 mt-auto bg-[#f9fafb]">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">
            &copy; {new Date().getFullYear()} Developed by{" "}
            <a
              href="https://vx9studio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors underline"
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
