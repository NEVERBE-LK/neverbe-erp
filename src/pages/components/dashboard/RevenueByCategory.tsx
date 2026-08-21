import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getRevenueByCategoryAction } from "@/actions/reportsActions";
import { useDashboardSummary } from "./DashboardContext";
import toast from "react-hot-toast";
import { IconRefresh, IconCategory2 } from "@tabler/icons-react";
import { Button, Tag, Tooltip, List, Typography } from "antd";
import Spinner from "../shared/Spinner";

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

const RevenueByCategory = () => {
  const { data: summaryData } = useDashboardSummary();
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (summaryData?.revenueByCategory) {
      setData(summaryData.revenueByCategory);
      setLoading(false);
    }
  }, [summaryData]);

  useEffect(() => {
    if (!currentUser) return;

    if (!summaryData?.revenueByCategory) {
      fetchData(true);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(false);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, summaryData]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getRevenueByCategoryAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const widthColors = [
    "#0f172a", // Slate 900
    "#3b82f6", // Blue 500
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#64748b", // Slate 500
    "#cbd5e1", // Slate 300
  ];

  return (
    <DashboardCard 
      title="Revenue by Category" 
      subtitle="This Month"
    >
      <div className="py-2 flex flex-col h-[350px]">
        <Spinner spinning={loading}>
          {data.length > 0 ? (
            <div className="flex flex-col h-full min-h-0 space-y-4">
              {/* Stacked Segment Bar */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
                {data.map((cat, idx) => (
                  <Tooltip
                    key={cat.category}
                    title={`${cat.category}: ${cat.percentage}%`}
                  >
                    <div
                      className="h-full transition-all duration-300 hover:opacity-90"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: widthColors[idx] || "#cbd5e1",
                      }}
                    />
                  </Tooltip>
                ))}
              </div>

              {/* List of categories */}
              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-1 min-h-0">
                {data.map((item, idx, arr) => (
                  <div 
                    key={item.category}
                    className={`flex justify-between items-center py-3 ${idx !== arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/80' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: widthColors[idx] || "#cbd5e1",
                        }}
                      ></span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                          {item.orders} orders
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                        LKR {item.revenue.toLocaleString()}
                      </span>
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 mt-1">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <IconCategory2 size={32} className="mb-2 opacity-50 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">No sales data this month</span>
            </div>
          )}
        </Spinner>
      </div>
    </DashboardCard>
  );
};

export default RevenueByCategory;
