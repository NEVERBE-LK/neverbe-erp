import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Typography } from "antd";
import MenuItems from "./header/MenuItems";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const { Text } = Typography;

export default function AppBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  // Don't show breadcrumbs on the dashboard or root
  if (pathnames.length === 0 || pathnames[0] === "dashboard") {
    return null;
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!currentUser) return false;
    return (
      currentUser.permissions?.includes(permission)
    );
  };

  const getPermissionForPath = (toPath: string): string | undefined => {
    let bestMatchPermission: string | undefined = undefined;
    let longestHrefLength = 0;

    for (const item of MenuItems) {
      const anyItem = item as any;
      if (anyItem.children) {
        for (const child of anyItem.children) {
          const anyChild = child as any;
          if (anyChild.href && (toPath === anyChild.href || toPath.startsWith(anyChild.href + "/"))) {
            if (anyChild.href.length > longestHrefLength) {
              longestHrefLength = anyChild.href.length;
              bestMatchPermission = anyChild.permission;
            }
          }
        }
      } else if (anyItem.href && (toPath === anyItem.href || toPath.startsWith(anyItem.href + "/"))) {
        if (anyItem.href.length > longestHrefLength) {
          longestHrefLength = anyItem.href.length;
          bestMatchPermission = anyItem.permission;
        }
      }
    }

    if (!bestMatchPermission) {
      const parentMap: Record<string, string> = {
        "/master": "view_master_data",
        "/inventory": "view_inventory",
        "/finance": "view_finance",
        "/campaign": "view_promotions",
        "/settings": "view_settings",
        "/reports": "view_reports",
        "/orders": "view_orders",
        "/users": "view_users",
        "/roles": "manage_roles",
        "/website": "view_website",
      };

      for (const [prefix, perm] of Object.entries(parentMap)) {
        if (toPath === prefix || toPath.startsWith(prefix + "/")) {
          bestMatchPermission = perm;
          break;
        }
      }
    }

    return bestMatchPermission;
  };

  // Find the label for a given path from MenuItems or fallbacks
  const getLabelForPath = (toPath: string, segment: string) => {
    // 1. Search through MenuItems for a matching href
    for (const item of MenuItems) {
      const anyItem = item as any;
      if (anyItem.children) {
        for (const child of anyItem.children) {
          const anyChild = child as any;
          if (anyChild.href === toPath) {
            return anyChild.title;
          }
        }
      } else if (anyItem.href === toPath) {
        return anyItem.title;
      }
    }

    // 2. Fallback to matching child/item ending in segment with slash
    for (const item of MenuItems) {
      const anyItem = item as any;
      if (anyItem.children) {
        for (const child of anyItem.children) {
          const anyChild = child as any;
          if (anyChild.href && anyChild.href.endsWith("/" + segment)) {
            return anyChild.title;
          }
        }
      } else if (anyItem.href && anyItem.href.endsWith("/" + segment)) {
        return anyItem.title;
      }
    }

    // 3. Mapping for common/parent segments
    const segmentMap: Record<string, string> = {
      master: "Master Data",
      inventory: "Inventory",
      finance: "Finance",
      campaign: "Campaign",
      settings: "Settings",
      reports: "Reports",
      orders: "Orders",
      users: "Users",
      roles: "Roles",
      website: "Website",
      approvals: "Approvals",
      create: "Create",
    };

    if (segmentMap[segment]) return segmentMap[segment];

    // 4. Default fallback: capitalize segment
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 px-4 sm:px-8 lg:px-12 pt-4">
      {hasPermission("view_dashboard") ? (
        <Link
          to="/dashboard"
          className="!text-green-600 hover:!text-green-700 font-medium transition-colors"
        >
          Dashboard
        </Link>
      ) : (
        <span className="text-gray-400 font-medium cursor-not-allowed">
          Dashboard
        </span>
      )}
      <span className="text-gray-300">/</span>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        // Skip IDs in breadcrumbs (UUIDs, generated IDs like p-, grn-, etc.)
        let label = getLabelForPath(to, value);
        if (value.length > 15 || value.match(/^[a-z]+-[a-zA-Z0-9_-]{8}$/)) {
          label = "View Details"; // Override ugly IDs with generic text
        }

        if (last) {
          return (
            <Text key={to} strong className="text-gray-700">
              {label}
            </Text>
          );
        }

        const permission = getPermissionForPath(to);
        const permitted = hasPermission(permission);

        if (!permitted) {
          return (
            <React.Fragment key={to}>
              <span className="text-gray-400 font-medium cursor-not-allowed" title="You do not have permission to access this page">
                {label}
              </span>
              <span className="text-gray-300">/</span>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={to}>
            <Link
              to={to}
              className="!text-green-600 hover:!text-green-700 font-medium transition-colors"
            >
              {label}
            </Link>
            <span className="text-gray-300">/</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
