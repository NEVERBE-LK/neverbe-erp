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
  IconReceipt,
  IconBuildingStore,
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
    subHeader: "Master Data",
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
      { id: uniqueId(), title: "Spammer Blacklist", href: "/master/spammers", permission: "manage_spammers" },
    ],
  },
  {
    subHeader: "Sales & Operations",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    permission: "view_orders",
    children: [
      { id: uniqueId(), title: "All Orders", href: "/orders" },
      { id: uniqueId(), title: "Processing", href: "/orders/processing" },
      { id: uniqueId(), title: "Payment Pending", href: "/orders/payment-pending" },
    ],
  },
  {
    id: uniqueId(),
    title: "Procurement",
    icon: IconTruck,
    permission: "view_inventory",
    children: [
      {
        id: uniqueId(),
        title: "Suppliers",
        href: "/inventory/suppliers",
        permission: "view_suppliers",
      },
      {
        id: uniqueId(),
        title: "Purchase Orders",
        href: "/inventory/purchase-orders",
        permission: "view_purchase_orders",
      },
      {
        id: uniqueId(),
        title: "Goods Received (GRN)",
        href: "/inventory/grn",
        permission: "view_grn",
      },
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
        title: "Stock Adjustments",
        href: "/inventory/adjustments",
        permission: "view_adjustments",
      },
    ],
  },
  {
    subHeader: "Finance & Accounting",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    permission: "view_finance",
    children: [
      {
        id: uniqueId(),
        title: "Financial Overview",
        href: "/finance",
        permission: "view_finance",
      },
      {
        id: uniqueId(),
        title: "Petty Cash Vouchers",
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
        title: "Supplier Invoices (AP)",
        href: "/finance/supplier-invoices",
        permission: "view_supplier_invoices",
      },
    ],
  },
  {
    subHeader: "Marketing & Storefront",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Campaigns",
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
        title: "Product Combos",
        href: "/campaign/combos",
        permission: "view_combos",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Storefront CMS",
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
    id: uniqueId(),
    title: "Communications",
    icon: IconMessage2,
    href: "/communications",
    permission: "view_communications",
  },
  {
    subHeader: "Reports & Analytics",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Reports & Analytics",
    icon: IconChartPie,
    href: "/reports",
    permission: "view_reports",
  },
  {
    subHeader: "Administration",
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
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    permission: "view_settings",
    children: [
      {
        id: uniqueId(),
        title: "ERP Configuration",
        href: "/settings",
        permission: "view_settings",
      },
      {
        id: uniqueId(),
        title: "Shipping & Delivery",
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
        title: "Taxation & Compliance",
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
