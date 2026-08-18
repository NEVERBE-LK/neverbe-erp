import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getProfitMarginsAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconPercentage, IconRefresh, IconCoin } from "@tabler/icons-react";
import { Progress, Statistic, Button, Tag, Card } from "antd";
import Spinner from "../shared/Spinner";
import { useTheme } from "@/contexts/ThemeContext";

interface MarginData {
  grossMargin: number;
  netMargin: number;
  avgOrderValue: number;
}

const ProfitMargins = () => {
  const [data, setData] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const { theme } = useTheme();

  useEffect(() => {
    if (!currentUser) return;

    fetchData(true);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(false);
      }
    }, 30000); // 30 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getProfitMarginsAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <DashboardCard 
      title="Profit Margins" 
      subtitle="This Month"
    >
      <Spinner spinning={loading}>
        {data ? (
          <div className="flex flex-col md:flex-row items-stretch gap-6 justify-between">
            {/* Margins Progress Column */}
            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-text-sub dark:text-slate-400">
                    Gross Margin
                  </span>
                  <span className="text-sm font-bold text-text-main dark:text-text-main-dark">
                    {data.grossMargin}%
                  </span>
                </div>
                <Progress
                  percent={Math.max(0, data.grossMargin)}
                  showInfo={false}
                  strokeColor="#3b82f6"
                  trailColor={isDark ? "#334155" : "#f1f5f9"}
                  size="small"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-text-sub dark:text-slate-400">
                    Net Margin
                  </span>
                  <span className={`text-sm font-bold ${data.netMargin >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data.netMargin}%
                  </span>
                </div>
                <Progress
                  percent={Math.max(0, data.netMargin)}
                  showInfo={false}
                  strokeColor={data.netMargin >= 0 ? "#10b981" : "#ef4444"}
                  trailColor={isDark ? "#334155" : "#f1f5f9"}
                  size="small"
                />
              </div>
            </div>

            {/* Average Order Value Card Column */}
            <div className="w-full md:w-[220px] shrink-0">
              <div className="h-full p-4 border border-card-border dark:border-card-border-dark bg-panel dark:bg-slate-900/50 rounded-lg flex flex-col justify-between min-h-[140px] transition-all hover:border-slate-200 dark:hover:border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <IconCoin size={14} className="text-slate-400" />
                  <span className="text-[10px] font-semibold text-text-sub dark:text-slate-500 uppercase tracking-wider">
                    Avg. Order Value
                  </span>
                </div>
                <div className="my-auto py-2">
                  <span className="text-xs font-semibold text-text-sub dark:text-slate-500 uppercase block">LKR</span>
                  <span className="text-lg font-bold text-text-main dark:text-text-main-dark tracking-tight">
                    {data.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-[9px] text-text-sub dark:text-slate-500 mt-2 block">
                  Calculated from fulfilled sales
                </span>
              </div>
            </div>
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

export default ProfitMargins;
