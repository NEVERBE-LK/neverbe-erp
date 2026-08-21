import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Typography } from "antd";
import MenuItems from "./header/MenuItems";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const { Text } = Typography;

// Parent route prefixes that don't have an explicit page component
const UNLINKABLE_PARENTS = new Set(["/master", "/campaign", "/orders"]);

export default function AppBreadcrumb() {
  const location = useLocation();
  const rawPathnames = location.pathname.split("/").filter((x) => x);
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  // Don't show breadcrumbs on the dashboard or root
  if (rawPathnames.length === 0 || rawPathnames[0] === "dashboard") {
    return null;
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!currentUser) return false;
    const role = String(currentUser.role || "").toUpperCase();
    if (
      role === "ADMIN" ||
      role === "SUPERADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "MANAGER" ||
      role === "OWNER"
    ) {
      return true;
    }
    if (Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0) {
      return (
        currentUser.permissions.includes(permission) ||
        currentUser.permissions.includes("all") ||
        currentUser.permissions.includes("*")
      );
    }
    return true;
  };

  const getPermissionForPath = (toPath: string): string | undefined => {
    let bestMatchPermission: string | undefined = undefined;
    let longestHrefLength = 0;

    for (const item of MenuItems) {
      const anyItem = item as any;
      if (anyItem.children) {
        for (const child of anyItem.children) {
          const anyChild = child as any;
          if (
            anyChild.href &&
            (toPath === anyChild.href || toPath.startsWith(anyChild.href + "/"))
          ) {
            if (anyChild.href.length > longestHrefLength) {
              longestHrefLength = anyChild.href.length;
              bestMatchPermission = anyChild.permission;
            }
          }
        }
      } else if (
        anyItem.href &&
        (toPath === anyItem.href || toPath.startsWith(anyItem.href + "/"))
      ) {
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

  const KNOWN_ROUTE_SEGMENTS = new Set([
    "order-list",
    "purchase-orders",
    "petty-cash",
    "expense-categories",
    "supplier-invoices",
    "bank-accounts",
    "payment-methods",
    "email-templates",
    "daily-summary",
    "monthly-summary",
    "yearly-summary",
    "top-products",
    "by-category",
    "by-brand",
    "by-payment-method",
    "sales-vs-discount",
    "refunds-returns",
    "daily-revenue",
    "monthly-revenue",
    "yearly-revenue",
    "live-stock",
    "low-stock",
    "reset-password",
  ]);

  const getLabelForPath = (toPath: string, segment: string) => {
    if (toPath === "/inventory") return "Inventory";

    const pathLabelMap: Record<string, string> = {
      "/inventory/purchase-orders": "Purchase Orders",
      "/inventory/purchase-orders/create": "Create Purchase Order",
      "/inventory/purchase-orders/approvals": "PO Approvals",
      "/inventory/grn": "Goods Received Notes",
      "/inventory/grn/create": "Create Goods Received Note",
      "/inventory/grn/approvals": "GRN Approvals",
      "/inventory/adjustments": "Stock Adjustments",
      "/inventory/adjustments/create": "Create Stock Adjustment",
    };

    if (pathLabelMap[toPath]) return pathLabelMap[toPath];

    // 1. Search through MenuItems for exact matching href
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

    // 2. Mapping for common/parent segments
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
      products: "Products",
      categories: "Categories",
      brands: "Brands",
      sizes: "Sizes",
      stocks: "Stock Locations",
      suppliers: "Suppliers",
      adjustments: "Stock Adjustments",
      grn: "Goods Received Notes",
      "purchase-orders": "Purchase Orders",
      approvals: "Approvals",
      create: "Create",
    };

    if (segmentMap[segment]) return segmentMap[segment];

    // Capitalize segment
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Build clean breadcrumb items
  interface Crumb {
    to: string;
    label: string;
    isLinkable: boolean;
  }

  const items: Crumb[] = [];
  let currentPath = "";

  for (let i = 0; i < rawPathnames.length; i++) {
    const segment = rawPathnames[i];
    if (segment === "dashboard") {
      continue;
    }
    const isKnownRoute = KNOWN_ROUTE_SEGMENTS.has(segment);
    const isId =
      !isKnownRoute &&
      (segment.length > 15 ||
        !!segment.match(/^[a-z0-9]+-[a-zA-Z0-9_-]{3,}$/i));
    const isView = segment === "view";

    if (isId || isView) {
      let detailLabel = "View Details";
      if (rawPathnames.includes("purchase-orders")) {
        detailLabel = "PO Details";
      } else if (rawPathnames.includes("adjustments")) {
        detailLabel = "Adjustment Details";
      } else if (rawPathnames.includes("grn")) {
        detailLabel = "GRN Details";
      } else if (rawPathnames.includes("orders")) {
        detailLabel = "Order Details";
      }

      const nextSegment = rawPathnames[i + 1];
      currentPath += `/${segment}`;
      if (nextSegment === "view") {
        i++;
        currentPath += "/view";
      }

      items.push({
        to: currentPath,
        label: detailLabel,
        isLinkable: false,
      });
      break;
    } else {
      currentPath += `/${segment}`;
      const label = getLabelForPath(currentPath, segment);
      const isUnlinkable = UNLINKABLE_PARENTS.has(currentPath);
      items.push({
        to: currentPath,
        label,
        isLinkable: !isUnlinkable,
      });
    }
  }

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 px-4 sm:px-8 lg:px-12 pt-4">
      {hasPermission("view_dashboard") ? (
        <Link
          to="/dashboard"
          className="!text-slate-900 dark:!text-slate-100 hover:!text-slate-700 dark:hover:!text-slate-300 font-medium transition-colors"
        >
          Dashboard
        </Link>
      ) : (
        <span className="text-gray-400 font-medium cursor-not-allowed">
          Dashboard
        </span>
      )}
      <span className="text-gray-300 dark:text-slate-600">/</span>

      {items.map((item, index) => {
        const last = index === items.length - 1;

        if (last || !item.isLinkable) {
          if (last) {
            return (
              <Text key={item.to} strong className="text-slate-900 dark:text-slate-100">
                {item.label}
              </Text>
            );
          }
          return (
            <React.Fragment key={item.to}>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {item.label}
              </span>
              <span className="text-gray-300 dark:text-slate-600">/</span>
            </React.Fragment>
          );
        }

        const permission = getPermissionForPath(item.to);
        const permitted = hasPermission(permission);

        if (!permitted) {
          return (
            <React.Fragment key={item.to}>
              <span
                className="text-gray-400 font-medium cursor-not-allowed"
                title="You do not have permission to access this page"
              >
                {item.label}
              </span>
              <span className="text-gray-300 dark:text-slate-600">/</span>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={item.to}>
            <Link
              to={item.to}
              className="!text-slate-900 dark:!text-slate-100 hover:!text-slate-700 dark:hover:!text-slate-300 font-medium transition-colors"
            >
              {item.label}
            </Link>
            <span className="text-gray-300 dark:text-slate-600">/</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
