import React, { createContext, useContext, useEffect, useState } from "react";
import { getDashboardSummaryAction } from "@/actions/reportsActions";

interface DashboardSummaryData {
  daily?: any;
  monthlyComparison?: any;
  yearlyPerformance?: any;
  orderStatusDistribution?: any;
  profitMargins?: any;
  revenueByCategory?: any;
  popularItems?: any;
  lowStock?: any;
  recentOrders?: any;
}

interface DashboardContextType {
  data: DashboardSummaryData | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
  data: null,
  loading: true,
  refresh: async () => {},
});

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (forceRefresh = false) => {
    try {
      const summary = await getDashboardSummaryAction(forceRefresh);
      setData(summary);
    } catch (err) {
      console.error("[DashboardContext] Failed to load dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(false);
  }, []);

  return (
    <DashboardContext.Provider value={{ data, loading, refresh: () => fetchSummary(true) }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardSummary = () => useContext(DashboardContext);
