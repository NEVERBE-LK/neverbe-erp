import PageContainer from "../components/container/PageContainer";
// components
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel";
import WeeklyTrends from "../components/dashboard/WeeklyTrends";
import ExpenseSummary from "../components/dashboard/ExpenseSummary";
import ProfitMargins from "../components/dashboard/ProfitMargins";
import InventoryValue from "../components/dashboard/InventoryValue";
import RevenueByCategory from "../components/dashboard/RevenueByCategory";
import NeuralStrategicHub from "../components/dashboard/NeuralStrategicHub";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="This is the Dashboard">
      <div className="flex flex-col gap-6">
        {/* Row 1: Key Metrics - Daily + Monthly */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-2">
            <DailyEarnings />
          </div>
          <div className="md:col-span-1">
            <MonthlyComparison />
          </div>
        </div>

        {/* 🤖 NEURAL STRATEGIC HUB (AI/ML LAYER) */}
        <div className="py-2">
           <NeuralStrategicHub />
        </div>

        {/* Row 2: Sales Chart + Order Status Panel (combined donut + attention) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          <div className="md:col-span-2">
            <SalesOverview />
          </div>
          <div className="md:col-span-1 xl:col-span-2">
            <OrderStatusPanel />
          </div>
        </div>

        {/* Row 3: Weekly Trends + Financial 3-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          <div>
            <WeeklyTrends />
          </div>
          <div>
            <ProfitMargins />
          </div>
          <div>
            <ExpenseSummary />
          </div>
          <div>
            <InventoryValue />
          </div>
        </div>

        {/* Row 4: Category Revenue + Popular Items + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div>
            <RevenueByCategory />
          </div>
          <div>
            <PopularItems />
          </div>
          <div>
            <LowStockAlerts />
          </div>
        </div>

        {/* Row 5: Recent Activity - Full width */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
