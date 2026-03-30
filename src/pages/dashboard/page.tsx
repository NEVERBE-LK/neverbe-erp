import PageContainer from "../components/container/PageContainer";
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel";
import WeeklyTrends from "../components/dashboard/WeeklyTrends";
import FinancialHealthPanel from "../components/dashboard/FinancialHealthPanel";
import RevenueByCategory from "../components/dashboard/RevenueByCategory";
import HybridIntelligencePanel from "../components/dashboard/HybridIntelligencePanel";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="System Overview & Analytics">
      <div className="space-y-6">
        {/* HYBRID INTELLIGENCE HUB (ML + LLM) */}
        <div>
          <HybridIntelligencePanel />
        </div>

        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                System Overview
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Dashboard
              </h2>
            </div>
          </div>
        </div>
        {/* Row 1: Daily Earnings (wide) + Monthly Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <DailyEarnings />
          </div>
          <div>
            <MonthlyComparison />
          </div>
        </div>

        {/* Row 2: Sales Overview + Order Status (donut + attention merged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SalesOverview />
          <OrderStatusPanel />
        </div>

        {/* Row 3: Weekly Trends + Financial Health (tabbed: margins / expenses / inventory) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WeeklyTrends />
          <FinancialHealthPanel />
        </div>

        {/* Row 4: Revenue by Category + Low Stock side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevenueByCategory />
          <LowStockAlerts />
        </div>

        {/* Row 5: Trending Products — full width, horizontal scroll */}
        <div>
          <PopularItems />
        </div>

        {/* Row 6: Recent Orders — full width */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
