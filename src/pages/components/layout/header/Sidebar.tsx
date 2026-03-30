import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Layout, MenuProps, ConfigProvider, Dropdown } from "antd";
import { IconMenu2, IconUser, IconLogout } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";
import Menuitems from "./MenuItems";
import NeuralPulse from "./NeuralPulse";

const { Sider } = Layout;

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapse?: (value: boolean) => void;
}

const Sidebar = ({
  isMobile,
  onClose,
  collapsed = false,
  onCollapse,
}: SidebarProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Helper to check permission
  const checkPermission = (item: any) => {
    if (!item.permission) return true;
    if (!currentUser) return false;
    if (
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPERADMIN" ||
      currentUser.role === "Manager"
    )
      return true;
    return currentUser.permissions?.includes(item.permission);
  };

  const transformMenuItems = (items: any[]): MenuProps["items"] => {
    return items
      .map((item) => {
        if (item.navLabel) {
          return {
            type: "group",
            key: item.subHeader,
            label: (
              <span
                className={`text-xs font-semibold text-gray-500 tracking-wide ${collapsed ? "hidden" : "block"}`}
              >
                {item.subHeader}
              </span>
            ),
            children: [],
          };
        }

        const hasPermission = checkPermission(item);

        if (item.children) {
          const visibleChildren = item.children.filter((child: any) =>
            checkPermission(child),
          );

          if (!hasPermission && visibleChildren.length === 0) {
            return null;
          }

          const childrenItems = transformMenuItems(item.children);
          if (!childrenItems || childrenItems.length === 0) return null;

          return {
            key: item.id || item.title,
            icon: item.icon ? <item.icon size={20} stroke={2} /> : null,
            label: <span className="font-medium">{item.title}</span>,
            children: childrenItems,
          };
        }

        if (!hasPermission) return null;

        return {
          key: item.href || item.id,
          icon: item.icon ? <item.icon size={20} stroke={2} /> : null,
          label: <span className="font-medium">{item.title}</span>,
          onClick: () => {
            if (item.href) {
              navigate(item.href);
              if (isMobile && onClose) {
                onClose();
              }
            }
          },
        };
      })
      .filter(Boolean) as MenuProps["items"];
  };

  const menuItems = useMemo(
    () => transformMenuItems(Menuitems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, pathname, isMobile, onClose, collapsed],
  );

  const handleLogout = () => {
    window.localStorage.removeItem("nvrUser");
    dispatch(clearUser());
    navigate("/");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: <span className="text-sm font-medium">My Profile</span>,
      icon: <IconUser size={16} />,
      onClick: () => navigate("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: <span className="text-sm font-medium text-red-600">Log Out</span>,
      icon: <IconLogout size={16} className="text-red-600" />,
      onClick: handleLogout,
    },
  ];

  return (
    <Sider
      width={260}
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => onCollapse && onCollapse(value)}
      trigger={null}
      className={`border-r border-gray-200 shadow-sm no-scrollbar custom-sidebar ${isMobile ? "h-full" : "fixed h-screen z-50 left-0 top-0"}`}
      style={{
        background: "#ffffff",
      }}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header / Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0 relative gap-3">
          {!collapsed ? (
            <div className="flex items-center justify-start w-full px-4">
              <Link
                to="/dashboard"
                className="block transform scale-75 origin-left w-20"
              >
                <img
                  src="/logo.png"
                  alt="NeverBe Logo"
                  className="w-full h-auto object-contain"
                />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full gap-2">
              <img
                src="/logo.png"
                alt="NeverBe Logo"
                className="w-10 h-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* User Profile Block */}
        {!collapsed && (
          <div className="p-4 mx-4 mt-6 mb-2 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 font-bold">
                {currentUser?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-gray-800 m-0 truncate w-24">
                  {currentUser?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-green-600 m-0 truncate">
                  {currentUser?.role || "USER"}
                </p>
              </div>
            </div>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click", "hover"]}
            >
              <button className="w-8 h-8 rounded-full hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-black transition-all flex items-center justify-center flex-shrink-0">
                <IconMenu2 size={16} />
              </button>
            </Dropdown>
          </div>
        )}

        {/* Menu Scroller */}
        <div className="flex-grow overflow-y-auto no-scrollbar py-4 px-3">
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  itemBg: "transparent",
                  itemColor: "#64748b",
                  itemHoverColor: "#16a34a",
                  itemHoverBg: "#f0fdf4",
                  itemSelectedColor: "#15803d",
                  itemSelectedBg: "#dcfce7",
                  itemBorderRadius: 12,
                  itemMarginBlock: 4,
                  activeBarBorderWidth: 0,
                },
              },
            }}
          >
            <Menu
              mode="inline"
              items={menuItems}
              selectedKeys={[pathname]}
              className="border-none bg-transparent font-medium"
            />
          </ConfigProvider>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
