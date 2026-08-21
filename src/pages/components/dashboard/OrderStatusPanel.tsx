import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState, lazy } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getOrderStatusDistributionAction } from "@/actions/reportsActions";
import { useDashboardSummary } from "./DashboardContext";
import toast from "react-hot-toast";
import {
  IconChartPie,
  IconRefresh,
  IconClock,
  IconChecklist,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Button, Tag } from "antd";
import Spinner from "../shared/Spinner";
import { useTheme } from "@/contexts/ThemeContext";

const Chart = lazy(() => import("react-apexcharts"));

interface StatusData {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
}

const OrderStatusPanel = () => {
  const { data: summaryData } = useDashboardSummary();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const { theme } = useTheme();

  const isDark = theme === "dark";

  useEffect(() => {
    if (summaryData?.orderStatusDistribution) {
      setStatusData(summaryData.orderStatusDistribution);
      setLoading(false);
    }
  }, [summaryData]);

  useEffect(() => {
    if (!currentUser) return;

    if (!summaryData?.orderStatusDistribution) {
      fetchAll(true);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAll(false);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, summaryData]);

  const fetchAll = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const status = await getOrderStatusDistributionAction();
      setStatusData(status);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to load order status");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Pending", "Processing", "Completed", "Cancelled"],
    colors: ["#f59e0b", "#3b82f6", "#10b981", "#64748b"],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "11px",
              fontFamily: "inherit",
              fontWeight: 500,
              color: isDark ? "#64748b" : "#94a3b8",
            },
            value: {
              show: true,
              fontSize: "20px",
              fontFamily: "inherit",
              fontWeight: 600,
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "11px",
              fontFamily: "inherit",
              fontWeight: 500,
              color: isDark ? "#64748b" : "#94a3b8",
              formatter: (w) =>
                w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                ),
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
      y: { formatter: (val: number) => `${val} orders` },
    },
  };

  const series = statusData
    ? [
        statusData.pending,
        statusData.processing,
        statusData.completed,
        statusData.cancelled,
      ]
    : [];

  return (
    <DashboardCard 
      title="Order Status" 
      subtitle="This Month"
    >
      <Spinner spinning={loading}>
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          {/* Donut Chart */}
          <div className="flex-1 flex justify-center items-center">
            {statusData && series.some((v) => v > 0) ? (
              <Chart
                options={chartOptions}
                series={series}
                type="donut"
                height={220}
                width={240}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                <IconChartPie size={32} className="mb-2 opacity-50 text-slate-300 dark:text-slate-700" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">No orders this month</span>
              </div>
            )}
          </div>

          {/* Details & Needs Attention Panel */}
          <div className="w-full md:w-[220px] shrink-0 flex flex-col justify-between">
            {/* Custom Status Legend */}
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Pending", count: statusData?.pending || 0, color: "bg-amber-500" },
                { label: "Processing", count: statusData?.processing || 0, color: "bg-blue-500" },
                { label: "Completed", count: statusData?.completed || 0, color: "bg-emerald-500" },
                { label: "Cancelled", count: statusData?.cancelled || 0, color: "bg-slate-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-text-sub dark:text-slate-400 font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Needs Attention Section */}
            {statusData && (
              <div className="border-t border-card-border dark:border-card-border-dark pt-4 mt-5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <IconAlertTriangle size={14} className="text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub dark:text-slate-500">
                    Needs Attention
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 border border-card-border dark:border-card-border-dark bg-panel dark:bg-slate-900/50 rounded-lg">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-text-sub block truncate">
                      Awaiting Pay
                    </span>
                    <span className="text-base font-bold text-text-main dark:text-text-main-dark block mt-0.5">
                      {statusData.pending}
                    </span>
                  </div>
                  <div className="p-2.5 border border-card-border dark:border-card-border-dark bg-panel dark:bg-slate-900/50 rounded-lg">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-text-sub block truncate">
                      To Fulfill
                    </span>
                    <span className="text-base font-bold text-text-main dark:text-text-main-dark block mt-0.5">
                      {statusData.processing}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Spinner>
    </DashboardCard>
  );
};

export default OrderStatusPanel;
