import { Outlet } from "react-router-dom";
import Sidebar from "./header/Sidebar";
import { Layout, Button, Drawer } from "antd";
import { IconMenu2 } from "@tabler/icons-react";
import { useState } from "react";
import AppBreadcrumb from "./AppBreadcrumb";
import { AIChatProvider } from "@/contexts/AIChatContext";

const { Content } = Layout;

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
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
    // Check if the click was directly on the sider container or background,
    // but not on an actual link/menu item if we want to be strict.
    // However, user said "expand menu only user click on menu outside menu items".
    // We can check the event target.
    const target = e.target as HTMLElement;
    const isMenuItem =
      target.closest(".ant-menu-item") || target.closest(".ant-menu-submenu");

    if (collapsed && !isMenuItem) {
      setCollapsed(false);
    }
  };

  return (
    <AIChatProvider>
      <Layout className="min-h-screen bg-[#f9fafb] text-black font-sans selection:bg-black selection:text-white flex-row overflow-x-hidden">
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
          className={`bg-[#f9fafb] transition-all duration-300 min-h-screen flex-1 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}
        >
          {/* Global Brand Accent */}
          <div className="w-full h-1 bg-black fixed top-0 z-[100] left-0"></div>

          {/* Mobile Header (Only visible on lg < screens) */}
          <header className="lg:hidden sticky top-0 bg-white border-b-2 border-gray-200 h-16 flex items-center justify-between px-4 z-40">
            <Button
              type="text"
              icon={<IconMenu2 size={24} />}
              onClick={() => setMobileMenuOpen(true)}
            />
            <div className="w-12">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="w-8"></div> {/* Spacer for centering */}
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

          <Content className="grow flex flex-col pt-4 lg:pt-[40px]">
            {/* Global Padding Container matched to old ERP */}
            <div className="w-full mx-auto pb-12">
              <AppBreadcrumb />
              <div className="px-4 xl:px-8">
                <Outlet />
              </div>
            </div>
          </Content>

          {/* Footer */}
          <footer className="w-full py-4 text-center border-t border-gray-100 mt-auto bg-[#f9fafb]">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">
              NeverBe Internal Systems v2.0
            </p>
          </footer>
        </Layout>

        {/* Global AI Chat Modal */}
        <AIChatModal />
      </Layout>
    </AIChatProvider>
  );
}
