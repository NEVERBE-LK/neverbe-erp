import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getMonthlyComparisonAction } from "@/actions/reportsActions";
import { useDashboardSummary } from "./DashboardContext";
import toast from "react-hot-toast";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconArrowRight,
} from "@tabler/icons-react";
import { List, Tag, Button, Typography, Space } from "antd";
import Spinner from "../shared/Spinner";

interface MonthlyData {
  currentMonth: { orders: number; revenue: number; profit: number };
  lastMonth: { orders: number; revenue: number; profit: number };
  percentageChange: { orders: number; revenue: number; profit: number };
}

const MonthlyComparison = () => {
  const { data: summaryData } = useDashboardSummary();
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (summaryData?.monthlyComparison) {
      setData(summaryData.monthlyComparison);
      setLoading(false);
    }
  }, [summaryData]);

  useEffect(() => {
    if (!currentUser) return;

    if (!summaryData?.monthlyComparison) {
      fetchData(true);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(false);
      }
    }, 60000); // 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, summaryData]);

  const fetchData = async (showLoading = true) => {
    if (showLoading && !data) setLoading(true);
    try {
      const result = await getMonthlyComparisonAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight m-0">Monthly Comparison</h4>
        </div>
        <Space size={4} className="text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>vs Last Month</span>
        </Space>
      </div>

      <Spinner spinning={loading}>
        {data ? (
          <div className="flex flex-col">
            {[
              {
                label: "Orders",
                current: data.currentMonth.orders,
                change: data.percentageChange.orders,
              },
              {
                label: "Net Sale",
                current: data.currentMonth.revenue,
                change: data.percentageChange.revenue,
                isCurrency: true,
              },
              {
                label: "Profit",
                current: data.currentMonth.profit,
                change: data.percentageChange.profit,
                isCurrency: true,
              },
            ].map((item, idx, arr) => {
              const isPositive = item.change >= 0;
              return (
                <div 
                  key={item.label}
                  className={`flex justify-between items-center py-4 ${idx !== arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/80' : ''}`}
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">
                      {item.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      {item.isCurrency && (
                        <span className="text-xs font-semibold text-slate-400">
                          LKR
                        </span>
                      )}
                      <span className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        {item.current.toLocaleString(undefined, { minimumFractionDigits: item.isCurrency ? 2 : 0, maximumFractionDigits: item.isCurrency ? 2 : 0 })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isPositive 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" 
                        : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <IconTrendingUp size={13} />
                    ) : (
                      <IconTrendingDown size={13} />
                    )}
                    {Math.abs(item.change)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs">
            No data available
          </div>
        )}
      </Spinner>
    </DashboardCard>
  );
};

export default MonthlyComparison;
