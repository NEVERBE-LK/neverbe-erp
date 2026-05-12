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
const GRNList = lazy(() => import("@/pages/inventory/grn/page"));
const GRNDetail = lazy(() => import("@/pages/inventory/grn/[id]/page"));
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
          <Route path="dashboard" element={<Dashboard />} />

          {/* Orders */}
          <Route path="orders" element={<Navigate to="/orders/all" replace />} />
          <Route path="orders/all" element={<Orders />} />
          <Route path="orders/processing" element={<Orders />} />
          <Route path="orders/payment-pending" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="orders/:orderId/view" element={<OrderView />} />
          <Route path="orders/:orderId/invoice" element={<OrderInvoice />} />

          {/* Master Data */}
          <Route path="master/products" element={<Products />} />
          <Route
            path="master/products/:productId/view"
            element={<ProductView />}
          />
          <Route path="master/categories" element={<Categories />} />
          <Route path="master/brands" element={<Brands />} />
          <Route path="master/sizes" element={<Sizes />} />
          <Route path="master/stocks" element={<Stocks />} />

          {/* Inventory */}
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/suppliers" element={<Suppliers />} />
          <Route
            path="inventory/purchase-orders"
            element={<PurchaseOrders />}
          />
          <Route
            path="inventory/purchase-orders/:id"
            element={<PurchaseOrderDetail />}
          />
          <Route path="inventory/grn" element={<GRNList />} />
          <Route path="inventory/grn/:id" element={<GRNDetail />} />
          <Route path="inventory/adjustments" element={<Adjustments />} />
          <Route
            path="inventory/adjustments/:id"
            element={<AdjustmentDetail />}
          />

          {/* Finance */}
          <Route path="finance" element={<Finance />} />
          <Route path="finance/bank-accounts" element={<BankAccounts />} />
          <Route
            path="finance/expense-categories"
            element={<ExpenseCategories />}
          />
          <Route path="finance/petty-cash" element={<PettyCash />} />
          <Route
            path="finance/supplier-invoices"
            element={<SupplierInvoices />}
          />

          {/* Campaign */}
          <Route path="campaign/combos" element={<Combos />} />
          <Route path="campaign/coupons" element={<Coupons />} />
          <Route path="campaign/promotions" element={<Promotions />} />

          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          <Route
            path="reports/sales/daily-summary"
            element={<DailySummary />}
          />
          <Route
            path="reports/sales/monthly-summary"
            element={<MonthlySummary />}
          />
          <Route
            path="reports/sales/yearly-summary"
            element={<YearlySummary />}
          />
          <Route path="reports/sales/top-products" element={<TopProducts />} />
          <Route path="reports/sales/by-category" element={<ByCategory />} />
          <Route path="reports/sales/by-brand" element={<ByBrand />} />
          <Route
            path="reports/sales/by-payment-method"
            element={<ByPaymentMethod />}
          />
          <Route
            path="reports/sales/sales-vs-discount"
            element={<SalesVsDiscount />}
          />
          <Route
            path="reports/sales/refunds-returns"
            element={<RefundsReturns />}
          />
          <Route
            path="reports/revenues/daily-revenue"
            element={<DailyRevenue />}
          />
          <Route
            path="reports/revenues/monthly-revenue"
            element={<MonthlyRevenue />}
          />
          <Route
            path="reports/revenues/yearly-revenue"
            element={<YearlyRevenue />}
          />
          <Route path="reports/stocks/live-stock" element={<LiveStock />} />
          <Route path="reports/stocks/low-stock" element={<LowStock />} />
          <Route path="reports/stocks/valuation" element={<Valuation />} />
          <Route path="reports/cash/cashflow" element={<Cashflow />} />
          <Route path="reports/customers" element={<Customers />} />
          <Route path="reports/expenses" element={<Expenses />} />
          <Route path="reports/pnl" element={<PnL />} />
          <Route path="reports/tax" element={<Tax />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/payment-methods" element={<PaymentMethods />} />
          <Route path="settings/shipping" element={<Shipping />} />
          <Route path="settings/tax" element={<TaxSettings />} />
          <Route path="settings/templates" element={<TemplatesSettings />} />
          <Route
            path="settings/email-templates"
            element={<EmailTemplatesSettings />}
          />

          {/* Users & Roles */}
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="roles/create" element={<RoleCreate />} />
          <Route path="roles/:id" element={<RoleEdit />} />

          {/* Website */}
          <Route path="website" element={<Website />} />
          <Route path="website/banner" element={<Banner />} />
          <Route path="website/navigation" element={<Navigation />} />
          <Route path="website/collections" element={<Collections />} />


          {/* Profile */}
          <Route path="profile" element={<Profile />} />

          {/* Communications */}
          <Route path="communications" element={<Communications />} />

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
