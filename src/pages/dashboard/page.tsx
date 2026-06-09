import PageContainer from "../components/container/PageContainer";
// components
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel";
import ProfitMargins from "../components/dashboard/ProfitMargins";
import RevenueByCategory from "../components/dashboard/RevenueByCategory";

import { Tabs, Spin } from "antd";
import { Suspense } from "react";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="Overview of your business performance">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spin size="large" />
        </div>
      }>
        <div className="flex flex-col gap-6">
          {/* Row 1: High Level Performance (Hero Section) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            <div className="xl:col-span-2">
              <DailyEarnings />
            </div>
            <div className="xl:col-span-1">
              <MonthlyComparison />
            </div>
          </div>

          {/* Row 2: Sales Trends & Order Flow */}
          <div className="grid grid-cols-1 gap-6 items-stretch">
            <div className="w-full">
              <SalesOverview />
            </div>
          </div>

          {/* Row 3: Operational Status & Financials */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <div className="xl:col-span-1">
              <OrderStatusPanel />
            </div>
            <div className="xl:col-span-1">
              <ProfitMargins />
            </div>
          </div>

          {/* Row 4: Insights & Recent Activity (Tabbed for simplification) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-1">
              <RevenueByCategory />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                <Tabs
                  defaultActiveKey="1"
                  className="dashboard-tabs px-4"
                  items={[
                    {
                      key: "1",
                      label: <span className="font-bold px-2">Popular Items</span>,
                      children: <PopularItems />,
                    },
                    {
                      key: "2",
                      label: <span className="font-bold px-2">Low Stock Alerts</span>,
                      children: <LowStockAlerts />,
                    },
                    {
                      key: "3",
                      label: <span className="font-bold px-2">Recent Transactions</span>,
                      children: <RecentTransactions />,
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </PageContainer>
  );
};

export default Dashboard;
