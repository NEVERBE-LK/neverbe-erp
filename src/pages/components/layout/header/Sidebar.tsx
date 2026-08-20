import React, { useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown, MenuProps } from "antd";
import {
  IconDotsVertical,
  IconUser,
  IconLogout,
  IconChevronRight,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";
import { logoutUserAction } from "@/actions/authActions";
import toast from "react-hot-toast";
import Menuitems from "./MenuItems";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();

  // Track which submenus are open by their key
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Permission check
  const checkPermission = useCallback(
    (item: any) => {
      if (!item.permission) return true;
      if (!currentUser) return false;
      const role = (currentUser.role || "").toUpperCase();
      if (
        role === "ADMIN" ||
        role === "SUPERADMIN" ||
        role === "SUPER_ADMIN" ||
        role === "MANAGER" ||
        role === "OWNER"
      ) {
        return true;
      }
      if (
        Array.isArray(currentUser.permissions) &&
        (currentUser.permissions.includes("all") ||
          currentUser.permissions.includes("*"))
      ) {
        return true;
      }
      return currentUser.permissions?.includes(item.permission);
    },
    [currentUser]
  );

  // Auto-expand active submenu on mount
  const initialOpenMenus = useMemo(() => {
    const result: Record<string, boolean> = {};
    Menuitems.forEach((item: any) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child: any) => child.href && pathname.startsWith(child.href)
        );
        if (hasActiveChild) {
          result[item.id || item.title] = true;
        }
      }
    });
    return result;
  }, [pathname]);

  // Merge initial with user toggled
  const effectiveOpenMenus = useMemo(
    () => ({ ...initialOpenMenus, ...openMenus }),
    [initialOpenMenus, openMenus]
  );

  const toggleSubmenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    if (isMobile && onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logoutUserAction();
      dispatch(clearUser());
      navigate("/login");
    } catch (e) {
      console.error("Logout failed", e);
      toast.error("Failed to logout");
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: <span className="text-sm font-medium">My Profile</span>,
      icon: <IconUser size={16} />,
      onClick: () => navigate("/profile"),
    },
    { type: "divider" },
    {
      key: "logout",
      label: (
        <span className="text-sm font-medium text-red-600">Log Out</span>
      ),
      icon: <IconLogout size={16} className="text-red-600" />,
      onClick: handleLogout,
    },
  ];

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children: any[]) =>
    children?.some((c: any) => c.href && pathname.startsWith(c.href));

  const sidebarWidth = collapsed && !isMobile ? "w-[80px]" : "w-[260px]";

  return (
    <aside
      className={`${sidebarWidth} ${isMobile ? "h-full" : "fixed h-screen z-50 left-0 top-0"} flex flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800/80 transition-all duration-300 select-none`}
    >
      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0 overflow-hidden">
        {collapsed && !isMobile ? (
          <Link to="/dashboard" className="flex items-center justify-center w-full">
            <img
              src="/logo.png"
              alt="NeverBe"
              className="w-9 h-9 object-contain dark:brightness-120 dark:contrast-120"
            />
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center">
            <img
              src="/logo.png"
              alt="NeverBe Logo"
              className="h-8 w-auto object-contain dark:brightness-120 dark:contrast-120"
            />
          </Link>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3">
        {Menuitems.map((item: any, idx: number) => {
          // ─── Section Header ───
          if (item.navLabel) {
            if (collapsed && !isMobile) return null;
            return (
              <p
                key={`header-${idx}`}
                className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mt-6 mb-2 px-3 font-mono first:mt-2"
              >
                {item.subHeader}
              </p>
            );
          }

          const hasPermission = checkPermission(item);
          if (!hasPermission) return null;

          // ─── Submenu Parent ───
          if (item.children) {
            const permittedChildren = item.children.filter((c: any) =>
              checkPermission(c)
            );
            if (permittedChildren.length === 0) return null;

            const menuKey = item.id || item.title;
            const isOpen =
              effectiveOpenMenus[menuKey] || (collapsed && !isMobile && false);
            const hasActive = isChildActive(permittedChildren);

            return (
              <div key={menuKey} className="mb-0.5">
                <button
                  onClick={() => {
                    if (collapsed && !isMobile) {
                      // On collapsed, expand sidebar first
                      onCollapse && onCollapse(false);
                      setOpenMenus((prev) => ({ ...prev, [menuKey]: true }));
                    } else {
                      toggleSubmenu(menuKey);
                    }
                  }}
                  title={collapsed && !isMobile ? item.title : undefined}
                  className={`
                    w-full flex items-center gap-3 h-9 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer
                    ${
                      hasActive
                        ? "text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }
                    ${collapsed && !isMobile ? "justify-center" : ""}
                  `}
                >
                  {item.icon && (
                    <item.icon
                      size={19}
                      stroke={1.8}
                      className={`flex-shrink-0 ${
                        hasActive
                          ? "text-brand dark:text-brand-dark"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                  )}
                  {!(collapsed && !isMobile) && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {item.title}
                      </span>
                      <IconChevronRight
                        size={14}
                        stroke={2}
                        className={`flex-shrink-0 text-slate-300 dark:text-slate-600 transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </>
                  )}
                </button>

                {/* Submenu Children — accordion */}
                {!(collapsed && !isMobile) && (
                  <div
                    className={`sidebar-accordion overflow-hidden transition-all duration-200 ${
                      isOpen ? "sidebar-accordion-open" : ""
                    }`}
                    style={{
                      maxHeight: isOpen
                        ? `${permittedChildren.length * 36 + 8}px`
                        : "0px",
                    }}
                  >
                    <div className="ml-[18px] pl-4 border-l border-slate-100 dark:border-slate-800/80 mt-1 mb-1 space-y-0.5">
                      {permittedChildren.map((child: any) => {
                        const active = isActive(child.href);
                        return (
                          <button
                            key={child.id || child.href}
                            onClick={() => handleNavClick(child.href)}
                            className={`
                              w-full flex items-center h-[32px] rounded-md px-3 text-[12px] font-medium transition-colors duration-150 cursor-pointer
                              ${
                                active
                                  ? "text-brand dark:text-brand-dark bg-brand/5 dark:bg-brand-dark/5"
                                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                              }
                            `}
                          >
                            {child.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // ─── Single Link ───
          const active = isActive(item.href);
          return (
            <button
              key={item.id || item.href}
              onClick={() => handleNavClick(item.href)}
              title={collapsed && !isMobile ? item.title : undefined}
              className={`
                w-full flex items-center gap-3 h-9 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 mb-0.5 cursor-pointer relative
                ${
                  active
                    ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/60"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }
                ${collapsed && !isMobile ? "justify-center" : ""}
              `}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-brand dark:bg-brand-dark" />
              )}
              {item.icon && (
                <item.icon
                  size={19}
                  stroke={1.8}
                  className={`flex-shrink-0 ${
                    active
                      ? "text-brand dark:text-brand-dark"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
              )}
              {!(collapsed && !isMobile) && (
                <span className="truncate">{item.title}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile Footer ── */}
      <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/80 p-3">
        {collapsed && !isMobile ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <button className="w-full flex items-center justify-center h-10 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (
                    currentUser?.username?.charAt(0) ||
                    currentUser?.email?.charAt(0) ||
                    "U"
                  ).toUpperCase()
                )}
              </div>
            </button>
          </Dropdown>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                (
                  currentUser?.username?.charAt(0) ||
                  currentUser?.email?.charAt(0) ||
                  "U"
                ).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p
                className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 m-0 truncate"
                title={currentUser?.username || currentUser?.email}
              >
                {currentUser?.username ||
                  currentUser?.email?.split("@")[0] ||
                  "User"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 m-0 truncate font-mono">
                {currentUser?.role || "USER"}
              </p>
            </div>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
            >
              <button className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer">
                <IconDotsVertical size={14} />
              </button>
            </Dropdown>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
