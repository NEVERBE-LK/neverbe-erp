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
import NeuralStrategicHub from "../components/dashboard/NeuralStrategicHub";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import { useNeural } from "@/contexts/NeuralContext";

const Dashboard = () => {
  return (
    <PageContainer title="Neural Dashboard" description="Propulsion Hub & Predictive Analytics">
      <div className="space-y-10">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-0 gap-4">
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

        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-50 my-4" />

        {/* layer 0: The Neural Strategy Command */}
        <div className="grid grid-cols-1 gap-10">
          <ErrorBoundary fallbackTitle="Strategic Hub Syncing">
             <NeuralStrategicHub />
          </ErrorBoundary>
        </div>

        {/* Layer 2: Strategic Deep Dive (Charts & Resilience) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SalesOverview />
          <FinancialHealthPanel />
        </div>

        {/* Layer 3: Inventory Intelligence (Risks & Performance) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <RevenueByCategory />
          <PopularItems />
        </div>

        {/* 📜 The Audit Trail */}
        <div className="pt-8 border-t border-gray-100/50">
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
