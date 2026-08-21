import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import toast from "react-hot-toast";
import { IconReceipt, IconRefresh } from "@tabler/icons-react";
import { getRecentOrdersAction } from "@/actions/reportsActions";
import { useDashboardSummary } from "./DashboardContext";
import { useAppSelector } from "@/lib/hooks";
import { Timeline, Tag, Button, Typography, Card } from "antd";
import Spinner from "../shared/Spinner";

interface RecentOrder {
  orderId: string;
  paymentStatus: string;
  customerName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  createdAt: string;
}

const RecentTransactions = () => {
  const { data: summaryData } = useDashboardSummary();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (summaryData?.recentOrders) {
      setOrders(summaryData.recentOrders);
      setLoading(false);
    }
  }, [summaryData]);

  useEffect(() => {
    if (!currentUser) return;

    if (!summaryData?.recentOrders) {
      fetchRecentOrders(true);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchRecentOrders(false);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, summaryData]);

  const fetchRecentOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getRecentOrdersAction(6);
      setOrders(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50";
      case "Pending":
        return "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50";
      case "Failed":
        return "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50";
      case "Refunded":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50";
      default:
        return "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50";
    }
  };

  return (
    <div className="py-2 flex flex-col h-[350px]">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <span className="text-xs font-semibold text-text-sub dark:text-slate-400">
          Latest Customer Activity & Orders
        </span>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
          REALTIME FEED
        </span>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <Spinner spinning={loading}>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <IconReceipt size={32} className="mb-2 opacity-50 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">No Recent Orders</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-2 pr-1 no-scrollbar">
              <Timeline
                items={orders.map((order) => ({
                  color:
                    order.paymentStatus === "Paid"
                      ? "green"
                      : order.paymentStatus === "Failed"
                        ? "red"
                        : "gray",
                  children: (
                    <div className="pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-text-sub dark:text-slate-500 font-medium">
                          {order.createdAt}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusClasses(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-text-main dark:text-text-main-dark m-0">
                        Order #{order.orderId}
                      </h4>
                      <p className="text-xs text-text-sub dark:text-slate-500 mb-2 truncate">
                        {order.customerName}
                      </p>

                      <div className="border border-card-border dark:border-card-border-dark bg-panel dark:bg-slate-800/30 rounded-lg p-3 mt-2 transition-all hover:border-text-sub/30">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] text-text-sub dark:text-slate-500 font-medium">
                            <span>Gross Sale</span>
                            <span className="font-semibold text-text-main dark:text-slate-400">
                              LKR {order.grossAmount.toFixed(2)}
                            </span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-[11px] text-red-500 dark:text-red-400 font-medium">
                              <span>Discount</span>
                              <span className="font-semibold">
                                - LKR {order.discountAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t border-card-border dark:border-card-border-dark pt-1 mt-1">
                            <span className="text-xs font-bold text-text-sub dark:text-slate-400">
                              Net Total
                            </span>
                            <span className="text-sm font-bold text-text-main dark:text-text-main-dark">
                              LKR {order.netAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          )}
        </Spinner>
      </div>
    </div>
  );
};

export default RecentTransactions;
