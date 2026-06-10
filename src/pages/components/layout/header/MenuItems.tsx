import {
  IconLayoutDashboard,
  IconApps,
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconCash,
  IconSpeakerphone,
  IconWorld,
  IconChartPie,
  IconSettings,
  IconShield,
  IconMessage2,
  IconTruck,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    subHeader: "Overview",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
    permission: "view_dashboard",
  },
  {
    subHeader: "Management",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Master Data",
    icon: IconApps,
    permission: "view_master_data",
    children: [
      { id: uniqueId(), title: "Categories", href: "/master/categories" },
      { id: uniqueId(), title: "Brands", href: "/master/brands" },
      { id: uniqueId(), title: "Sizes", href: "/master/sizes" },
      { id: uniqueId(), title: "Products", href: "/master/products" },
      { id: uniqueId(), title: "Stock Locations", href: "/master/stocks" },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconPackage,
    permission: "view_inventory",
    children: [
      {
        id: uniqueId(),
        title: "Stock Overview",
        href: "/inventory",
        permission: "view_inventory",
      },
      {
        id: uniqueId(),
        title: "Adjustments",
        href: "/inventory/adjustments",
        permission: "view_adjustments",
      },
      {
        id: uniqueId(),
        title: "Suppliers",
        href: "/inventory/suppliers",
        permission: "view_suppliers",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Purchase Orders",
    icon: IconShoppingCart,
    permission: "view_purchase_orders",
    children: [
      {
        id: uniqueId(),
        title: "Create PO",
        href: "/inventory/purchase-orders/create",
        permission: "create_purchase_orders",
      },
      {
        id: uniqueId(),
        title: "PO List",
        href: "/inventory/purchase-orders",
        permission: "view_purchase_orders",
      },
      {
        id: uniqueId(),
        title: "PO Approvals",
        href: "/inventory/purchase-orders/approvals",
        permission: "approve_po",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Goods Received",
    icon: IconTruck,
    permission: "view_grn",
    children: [
      {
        id: uniqueId(),
        title: "Create GRN",
        href: "/inventory/grn/create",
        permission: "create_grn",
      },
      {
        id: uniqueId(),
        title: "GRN List",
        href: "/inventory/grn",
        permission: "view_grn",
      },
      {
        id: uniqueId(),
        title: "GRN Approvals",
        href: "/inventory/grn/approvals",
        permission: "approve_grn",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    permission: "view_orders",
    children: [
      { id: uniqueId(), title: "All Orders", href: "/orders/all" },
      { id: uniqueId(), title: "Processing", href: "/orders/processing" },
      { id: uniqueId(), title: "Payment Pending", href: "/orders/payment-pending" },
    ],
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    permission: "view_finance",
    children: [
      {
        id: uniqueId(),
        title: "Dashboard",
        href: "/finance",
        permission: "view_finance",
      },
      {
        id: uniqueId(),
        title: "Petty Cash",
        href: "/finance/petty-cash",
        permission: "view_petty_cash",
      },
      {
        id: uniqueId(),
        title: "Expense Categories",
        href: "/finance/expense-categories",
        permission: "view_expense_categories",
      },
      {
        id: uniqueId(),
        title: "Bank Accounts",
        href: "/finance/bank-accounts",
        permission: "view_bank_accounts",
      },
      {
        id: uniqueId(),
        title: "Supplier Invoices",
        href: "/finance/supplier-invoices",
        permission: "view_supplier_invoices",
      },
    ],
  },
  {
    subHeader: "Marketing",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Campaign",
    icon: IconSpeakerphone,
    permission: "view_promotions",
    children: [
      {
        id: uniqueId(),
        title: "Promotions",
        href: "/campaign/promotions",
        permission: "view_promotions",
      },
      {
        id: uniqueId(),
        title: "Coupons",
        href: "/campaign/coupons",
        permission: "view_coupons",
      },
      {
        id: uniqueId(),
        title: "Combos",
        href: "/campaign/combos",
        permission: "view_combos",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Communications",
    icon: IconMessage2,
    href: "/communications",
    permission: "view_communications",
  },
  {
    subHeader: "Website",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Website Manager",
    icon: IconWorld,
    permission: "view_website",
    children: [
      {
        id: uniqueId(),
        title: "Banners",
        href: "/website/banner",
        permission: "view_website",
      },
      {
        id: uniqueId(),
        title: "Collections",
        href: "/website/collections",
        permission: "view_website",
      },
      {
        id: uniqueId(),
        title: "Navigation",
        href: "/website/navigation",
        permission: "view_website",
      },
    ],
  },
  {
    subHeader: "Reports",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Analytics",
    icon: IconChartPie,
    href: "/reports",
    permission: "view_reports",
  },
  {
    subHeader: "Security",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsers,
    href: "/users",
    permission: "view_users",
  },
  {
    id: uniqueId(),
    title: "Roles",
    icon: IconShield,
    href: "/roles",
    permission: "manage_roles",
  },
  {
    subHeader: "System",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    permission: "view_settings",
    children: [
      {
        id: uniqueId(),
        title: "ERP Settings",
        href: "/settings",
        permission: "view_settings",
      },
      {
        id: uniqueId(),
        title: "Shipping Rates",
        href: "/settings/shipping",
        permission: "view_shipping",
      },
      {
        id: uniqueId(),
        title: "Payment Methods",
        href: "/settings/payment-methods",
        permission: "view_payment_methods",
      },
      {
        id: uniqueId(),
        title: "Tax Settings",
        href: "/settings/tax",
        permission: "view_tax_settings",
      },
      {
        id: uniqueId(),
        title: "SMS Templates",
        href: "/settings/templates",
        permission: "view_settings",
      },
      {
        id: uniqueId(),
        title: "Email Templates",
        href: "/settings/email-templates",
        permission: "view_settings",
      },

    ],
  },
];

export default Menuitems;
