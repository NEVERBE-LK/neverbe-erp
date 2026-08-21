import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getLowStockAlertsAction } from "@/actions/reportsActions";
import { useDashboardSummary } from "./DashboardContext";
import toast from "react-hot-toast";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { List, Avatar, Tag, Button, Typography } from "antd";
import Spinner from "../shared/Spinner";

interface LowStockItem {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  currentStock: number;
  thumbnail?: string;
}

const LowStockAlerts = () => {
  const { data: summaryData } = useDashboardSummary();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (summaryData?.lowStock) {
      setItems(summaryData.lowStock);
      setLoading(false);
    }
  }, [summaryData]);

  useEffect(() => {
    if (!currentUser) return;

    if (!summaryData?.lowStock) {
      fetchLowStock(true);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLowStock(false);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, summaryData]);

  const fetchLowStock = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getLowStockAlertsAction(5, 8);
      setItems(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <div className="py-2 flex flex-col h-[350px]">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2 shrink-0">
        <span className="text-xs font-semibold text-text-sub dark:text-slate-400">
          Items Below Minimum Threshold
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
          {items.length} Alerts
        </span>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <Spinner spinning={loading}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <IconAlertTriangle size={32} className="mb-2 opacity-50 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">No low stock items</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-1 no-scrollbar space-y-1">
              {items.map((item, idx, arr) => (
                <div 
                  key={item.productId}
                  className={`flex justify-between items-center py-3 ${idx !== arr.length - 1 ? 'border-b border-card-border dark:border-card-border-dark' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.thumbnail ? (
                      <Avatar
                        shape="square"
                        src={item.thumbnail}
                        size="small"
                        className="shrink-0 rounded-md"
                      />
                    ) : (
                      <Avatar
                        shape="square"
                        size="small"
                        icon={<IconAlertTriangle size={12} />}
                        className="bg-panel dark:bg-slate-800 text-text-sub shrink-0 rounded-md"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-text-main dark:text-text-main-dark truncate max-w-[180px]">
                        {item.productName}
                      </span>
                      <span className="text-[10px] text-text-sub dark:text-slate-500 mt-0.5 truncate max-w-[180px]">
                        {item.variantName} • Size {item.size}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-sm font-bold block ${item.currentStock <= 2 ? "text-red-500" : "text-amber-500"}`}>
                      {item.currentStock}
                    </span>
                    <span className="text-[10px] text-text-sub">left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spinner>
      </div>
    </div>
  );
};

export default LowStockAlerts;
