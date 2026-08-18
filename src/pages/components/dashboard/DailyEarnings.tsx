import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getDailyOverviewAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import {
  IconCurrencyDollar,
  IconRefresh,
  IconReceiptRefund,
} from "@tabler/icons-react";
import { Row, Col, Statistic, Card, Tag, Button } from "antd";
import Spinner from "../shared/Spinner";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { dayjs, SL_TIMEZONE } from "@/utils/dateUtils";

const DailyEarnings = () => {
  const [totalGrossSales, setTotalGrossSales] = useState(0);
  const [totalNetSales, setTotalNetSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0); // Future Implementation (Default 0)
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const fetchDailyEarnings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const overview = await getDailyOverviewAction();
      setTotalGrossSales(overview.totalGrossSales);
      setTotalNetSales(overview.totalNetSales);
      setTotalProfit(overview.totalProfit);
      setInvoiceCount(overview.totalOrders);
      setTotalDiscount(overview.totalDiscount);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    let isFirst = true;
    const now = dayjs().tz(SL_TIMEZONE);
    const startOfDay = now.startOf("day").toDate();
    const endOfDay = now.endOf("day").toDate();

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      where("createdAt", "<=", Timestamp.fromDate(endOfDay))
    );

    const unsubscribe = onSnapshot(
      q,
      () => {
        fetchDailyEarnings(isFirst);
        isFirst = false;
      },
      (error) => {
        console.error("[DailyEarnings] Firestore live snapshot failed, falling back to fetch:", error);
        fetchDailyEarnings(isFirst);
        isFirst = false;
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <DashboardCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 min-w-0 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
            Daily Overview
          </h4>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
          {invoiceCount} Orders
        </span>
      </div>

      <Spinner spinning={loading}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Profit Block */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/60 rounded-xl p-5 flex flex-col justify-between min-h-[140px] transition-all hover:border-slate-200">
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Net Profit
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-400">LKR</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
              Live calculations
            </div>
          </div>

          {/* Grid of other metrics */}
          <div className="grid grid-cols-2 gap-4 flex-[2]">
            {/* Gross Sales */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 rounded-lg p-4 transition-all hover:border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                Gross Sales
              </span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                LKR {totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Net Sales */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 rounded-lg p-4 transition-all hover:border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                Net Sales
              </span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                LKR {totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Total Discounts */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 rounded-lg p-4 transition-all hover:border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                Discounts Given
              </span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                LKR {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Refunds */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 rounded-lg p-4 transition-all hover:border-slate-200/60">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[11px] font-medium text-slate-400">Refunds</span>
                <IconReceiptRefund size={12} className="text-slate-400" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                LKR {totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </Spinner>
    </DashboardCard>
  );
};

export const dynamic = "force-dynamic";
export default DailyEarnings;
