import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Spin } from "antd";

import AppLayout from "@/pages/components/layout/AppLayout";

// Lazy-load all pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password/page"));
const Unauthorized = lazy(() => import("@/pages/unauthorized/page"));
const Dashboard = lazy(() => import("@/pages/dashboard/page"));
const Orders = lazy(() => import("@/pages/orders/page"));
const OrderDetail = lazy(() => import("@/pages/orders/[orderId]/page"));
const OrderView = lazy(() => import("@/pages/orders/[orderId]/view/page"));
const OrderInvoice = lazy(
  () => import("@/pages/orders/[orderId]/invoice/page"),
);

// Master Data
const Products = lazy(() => import("@/pages/master/products/page"));
const ProductView = lazy(
  () => import("@/pages/master/products/[productId]/view/page"),
);
const Categories = lazy(() => import("@/pages/master/categories/page"));
const Brands = lazy(() => import("@/pages/master/brands/page"));
const Sizes = lazy(() => import("@/pages/master/sizes/page"));
const Stocks = lazy(() => import("@/pages/master/stocks/page"));

// Inventory
const Inventory = lazy(() => import("@/pages/inventory/page"));
const Suppliers = lazy(() => import("@/pages/inventory/suppliers/page"));
const PurchaseOrders = lazy(
  () => import("@/pages/inventory/purchase-orders/page"),
);
const PurchaseOrderDetail = lazy(
  () => import("@/pages/inventory/purchase-orders/[id]/page"),
);
const POApprovals = lazy(
  () => import("@/pages/inventory/purchase-orders/approvals/page"),
);
const GRNList = lazy(() => import("@/pages/inventory/grn/page"));
const GRNDetail = lazy(() => import("@/pages/inventory/grn/[id]/page"));
const GRNApprovals = lazy(
  () => import("@/pages/inventory/grn/approvals/page"),
);
const Adjustments = lazy(() => import("@/pages/inventory/adjustments/page"));
const AdjustmentDetail = lazy(
  () => import("@/pages/inventory/adjustments/[id]/page"),
);

// Finance
const Finance = lazy(() => import("@/pages/finance/page"));
const BankAccounts = lazy(() => import("@/pages/finance/bank-accounts/page"));
const ExpenseCategories = lazy(
  () => import("@/pages/finance/expense-categories/page"),
);
const PettyCash = lazy(() => import("@/pages/finance/petty-cash/page"));
const SupplierInvoices = lazy(
  () => import("@/pages/finance/supplier-invoices/page"),
);

// Campaign
const Combos = lazy(() => import("@/pages/campaign/combos/page"));
const Coupons = lazy(() => import("@/pages/campaign/coupons/page"));
const Promotions = lazy(() => import("@/pages/campaign/promotions/page"));

// Reports
const Reports = lazy(() => import("@/pages/reports/page"));
const DailySummary = lazy(
  () => import("@/pages/reports/sales/daily-summary/page"),
);
const MonthlySummary = lazy(
  () => import("@/pages/reports/sales/monthly-summary/page"),
);
const YearlySummary = lazy(
  () => import("@/pages/reports/sales/yearly-summary/page"),
);
const TopProducts = lazy(
  () => import("@/pages/reports/sales/top-products/page"),
);
const ByCategory = lazy(() => import("@/pages/reports/sales/by-category/page"));
const ByBrand = lazy(() => import("@/pages/reports/sales/by-brand/page"));
const ByPaymentMethod = lazy(
  () => import("@/pages/reports/sales/by-payment-method/page"),
);
const SalesVsDiscount = lazy(
  () => import("@/pages/reports/sales/sales-vs-discount/page"),
);
const RefundsReturns = lazy(
  () => import("@/pages/reports/sales/refunds-returns/page"),
);
const DailyRevenue = lazy(
  () => import("@/pages/reports/revenues/daily-revenue/page"),
);
const MonthlyRevenue = lazy(
  () => import("@/pages/reports/revenues/monthly-revenue/page"),
);
const YearlyRevenue = lazy(
  () => import("@/pages/reports/revenues/yearly-revenue/page"),
);
const LiveStock = lazy(() => import("@/pages/reports/stocks/live-stock/page"));
const LowStock = lazy(() => import("@/pages/reports/stocks/low-stock/page"));
const Valuation = lazy(() => import("@/pages/reports/stocks/valuation/page"));
const Cashflow = lazy(() => import("@/pages/reports/cash/cashflow/page"));
const Customers = lazy(() => import("@/pages/reports/customers/page"));
const Expenses = lazy(() => import("@/pages/reports/expenses/page"));
const PnL = lazy(() => import("@/pages/reports/pnl/page"));
const Tax = lazy(() => import("@/pages/reports/tax/page"));

// Settings
const Settings = lazy(() => import("@/pages/settings/page"));
const PaymentMethods = lazy(
  () => import("@/pages/settings/payment-methods/page"),
);
const Shipping = lazy(() => import("@/pages/settings/shipping/page"));
const TaxSettings = lazy(() => import("@/pages/settings/tax/page"));
const TemplatesSettings = lazy(() => import("@/pages/settings/templates/page"));
const EmailTemplatesSettings = lazy(
  () => import("@/pages/settings/email-templates/page"),
);


// Users & Roles
const Users = lazy(() => import("@/pages/users/page"));
const Roles = lazy(() => import("@/pages/roles/page"));
const RoleCreate = lazy(() => import("@/pages/roles/create/page"));
const RoleEdit = lazy(() => import("@/pages/roles/[id]/page"));

// Website
const Website = lazy(() => import("@/pages/website/page"));
const Banner = lazy(() => import("@/pages/website/banner/page"));
const Navigation = lazy(() => import("@/pages/website/navigation/page"));
const Collections = lazy(() => import("@/pages/website/collections/page"));


// Profile
const Profile = lazy(() => import("@/pages/profile/page"));

// Communications
const Communications = lazy(() => import("@/pages/communications/page"));

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Spin size="large" />
    </div>
  );
}

import ErrorBoundary from "@/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes Wrapper */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="dashboard" element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />

          {/* Orders */}
          <Route path="orders" element={<Navigate to="/orders/all" replace />} />
          <Route path="orders/all" element={<ProtectedRoute permission="view_orders"><Orders /></ProtectedRoute>} />
          <Route path="orders/processing" element={<ProtectedRoute permission="view_orders"><Orders /></ProtectedRoute>} />
          <Route path="orders/payment-pending" element={<ProtectedRoute permission="view_orders"><Orders /></ProtectedRoute>} />
          <Route path="orders/:orderId" element={<ProtectedRoute permission="view_orders"><OrderDetail /></ProtectedRoute>} />
          <Route path="orders/:orderId/view" element={<ProtectedRoute permission="view_orders"><OrderView /></ProtectedRoute>} />
          <Route path="orders/:orderId/invoice" element={<ProtectedRoute permission="view_orders"><OrderInvoice /></ProtectedRoute>} />

          {/* Master Data */}
          <Route path="master/products" element={<ProtectedRoute permission="view_master_data"><Products /></ProtectedRoute>} />
          <Route
            path="master/products/:productId/view"
            element={<ProtectedRoute permission="view_master_data"><ProductView /></ProtectedRoute>}
          />
          <Route path="master/categories" element={<ProtectedRoute permission="view_master_data"><Categories /></ProtectedRoute>} />
          <Route path="master/brands" element={<ProtectedRoute permission="view_master_data"><Brands /></ProtectedRoute>} />
          <Route path="master/sizes" element={<ProtectedRoute permission="view_master_data"><Sizes /></ProtectedRoute>} />
          <Route path="master/stocks" element={<ProtectedRoute permission="view_master_data"><Stocks /></ProtectedRoute>} />

          {/* Inventory */}
          <Route path="inventory" element={<ProtectedRoute permission="view_inventory"><Inventory /></ProtectedRoute>} />
          <Route path="inventory/suppliers" element={<ProtectedRoute permission="view_suppliers"><Suppliers /></ProtectedRoute>} />
          <Route
            path="inventory/purchase-orders"
            element={<ProtectedRoute permission="view_purchase_orders"><PurchaseOrders /></ProtectedRoute>}
          />
          <Route
            path="inventory/purchase-orders/:id"
            element={<ProtectedRoute permission="view_purchase_orders"><PurchaseOrderDetail /></ProtectedRoute>}
          />
          <Route
            path="inventory/purchase-orders/approvals"
            element={<ProtectedRoute permission="approve_po"><POApprovals /></ProtectedRoute>}
          />
          <Route path="inventory/grn" element={<ProtectedRoute permission="view_grn"><GRNList /></ProtectedRoute>} />
          <Route path="inventory/grn/:id" element={<ProtectedRoute permission="view_grn"><GRNDetail /></ProtectedRoute>} />
          <Route
            path="inventory/grn/approvals"
            element={<ProtectedRoute permission="approve_grn"><GRNApprovals /></ProtectedRoute>}
          />
          <Route path="inventory/adjustments" element={<ProtectedRoute permission="view_adjustments"><Adjustments /></ProtectedRoute>} />
          <Route
            path="inventory/adjustments/:id"
            element={<ProtectedRoute permission="view_adjustments"><AdjustmentDetail /></ProtectedRoute>}
          />

          {/* Finance */}
          <Route path="finance" element={<ProtectedRoute permission="view_finance"><Finance /></ProtectedRoute>} />
          <Route path="finance/bank-accounts" element={<ProtectedRoute permission="view_bank_accounts"><BankAccounts /></ProtectedRoute>} />
          <Route
            path="finance/expense-categories"
            element={<ProtectedRoute permission="view_expense_categories"><ExpenseCategories /></ProtectedRoute>}
          />
          <Route path="finance/petty-cash" element={<ProtectedRoute permission="view_petty_cash"><PettyCash /></ProtectedRoute>} />
          <Route
            path="finance/supplier-invoices"
            element={<ProtectedRoute permission="view_supplier_invoices"><SupplierInvoices /></ProtectedRoute>}
          />

          {/* Campaign */}
          <Route path="campaign/combos" element={<ProtectedRoute permission="view_combos"><Combos /></ProtectedRoute>} />
          <Route path="campaign/coupons" element={<ProtectedRoute permission="view_coupons"><Coupons /></ProtectedRoute>} />
          <Route path="campaign/promotions" element={<ProtectedRoute permission="view_promotions"><Promotions /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="reports" element={<ProtectedRoute permission="view_reports"><Reports /></ProtectedRoute>} />
          <Route
            path="reports/sales/daily-summary"
            element={<ProtectedRoute permission="view_reports"><DailySummary /></ProtectedRoute>}
          />
          <Route
            path="reports/sales/monthly-summary"
            element={<ProtectedRoute permission="view_reports"><MonthlySummary /></ProtectedRoute>}
          />
          <Route
            path="reports/sales/yearly-summary"
            element={<ProtectedRoute permission="view_reports"><YearlySummary /></ProtectedRoute>}
          />
          <Route path="reports/sales/top-products" element={<ProtectedRoute permission="view_reports"><TopProducts /></ProtectedRoute>} />
          <Route path="reports/sales/by-category" element={<ProtectedRoute permission="view_reports"><ByCategory /></ProtectedRoute>} />
          <Route path="reports/sales/by-brand" element={<ProtectedRoute permission="view_reports"><ByBrand /></ProtectedRoute>} />
          <Route
            path="reports/sales/by-payment-method"
            element={<ProtectedRoute permission="view_reports"><ByPaymentMethod /></ProtectedRoute>}
          />
          <Route
            path="reports/sales/sales-vs-discount"
            element={<ProtectedRoute permission="view_reports"><SalesVsDiscount /></ProtectedRoute>}
          />
          <Route
            path="reports/sales/refunds-returns"
            element={<ProtectedRoute permission="view_reports"><RefundsReturns /></ProtectedRoute>}
          />
          <Route
            path="reports/revenues/daily-revenue"
            element={<ProtectedRoute permission="view_reports"><DailyRevenue /></ProtectedRoute>}
          />
          <Route
            path="reports/revenues/monthly-revenue"
            element={<ProtectedRoute permission="view_reports"><MonthlyRevenue /></ProtectedRoute>}
          />
          <Route
            path="reports/revenues/yearly-revenue"
            element={<ProtectedRoute permission="view_reports"><YearlyRevenue /></ProtectedRoute>}
          />
          <Route path="reports/stocks/live-stock" element={<ProtectedRoute permission="view_reports"><LiveStock /></ProtectedRoute>} />
          <Route path="reports/stocks/low-stock" element={<ProtectedRoute permission="view_reports"><LowStock /></ProtectedRoute>} />
          <Route path="reports/stocks/valuation" element={<ProtectedRoute permission="view_reports"><Valuation /></ProtectedRoute>} />
          <Route path="reports/cash/cashflow" element={<ProtectedRoute permission="view_reports"><Cashflow /></ProtectedRoute>} />
          <Route path="reports/customers" element={<ProtectedRoute permission="view_reports"><Customers /></ProtectedRoute>} />
          <Route path="reports/expenses" element={<ProtectedRoute permission="view_reports"><Expenses /></ProtectedRoute>} />
          <Route path="reports/pnl" element={<ProtectedRoute permission="view_reports"><PnL /></ProtectedRoute>} />
          <Route path="reports/tax" element={<ProtectedRoute permission="view_reports"><Tax /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="settings" element={<ProtectedRoute permission="view_settings"><Settings /></ProtectedRoute>} />
          <Route path="settings/payment-methods" element={<ProtectedRoute permission="view_payment_methods"><PaymentMethods /></ProtectedRoute>} />
          <Route path="settings/shipping" element={<ProtectedRoute permission="view_shipping"><Shipping /></ProtectedRoute>} />
          <Route path="settings/tax" element={<ProtectedRoute permission="view_tax_settings"><TaxSettings /></ProtectedRoute>} />
          <Route path="settings/templates" element={<ProtectedRoute permission="view_settings"><TemplatesSettings /></ProtectedRoute>} />
          <Route
            path="settings/email-templates"
            element={<ProtectedRoute permission="view_settings"><EmailTemplatesSettings /></ProtectedRoute>}
          />

          {/* Users & Roles */}
          <Route path="users" element={<ProtectedRoute permission="view_users"><Users /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute permission="manage_roles"><Roles /></ProtectedRoute>} />
          <Route path="roles/create" element={<ProtectedRoute permission="manage_roles"><RoleCreate /></ProtectedRoute>} />
          <Route path="roles/:id" element={<ProtectedRoute permission="manage_roles"><RoleEdit /></ProtectedRoute>} />

          {/* Website */}
          <Route path="website" element={<ProtectedRoute permission="view_website"><Website /></ProtectedRoute>} />
          <Route path="website/banner" element={<ProtectedRoute permission="view_website"><Banner /></ProtectedRoute>} />
          <Route path="website/navigation" element={<ProtectedRoute permission="view_website"><Navigation /></ProtectedRoute>} />
          <Route path="website/collections" element={<ProtectedRoute permission="view_website"><Collections /></ProtectedRoute>} />


          {/* Profile */}
          <Route path="profile" element={<Profile />} />

          {/* Communications */}
          <Route path="communications" element={<ProtectedRoute permission="view_communications"><Communications /></ProtectedRoute>} />

          {/* Fallback inner match */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
