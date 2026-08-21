import api from "@/lib/api";
import { DatePicker, Form, Progress } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconReceipt,
  IconCoin,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { exportPNLPDF } from "@/lib/pdf/exportPNLPDF";
import Spinner from "@/pages/components/shared/Spinner";

interface ProfitLossStatement {
  period: { from: string; to: string };
  revenue: {
    grossSales: number;
    discounts: number;
    netSales: number;
    shippingIncome: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: {
    productCost: number;
    shippingCost: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    byCategory: { category: string; amount: number }[];
    totalExpenses: number;
  };
  operatingIncome: number;
  otherExpenses: {
    transactionFees: number;
    otherFees: number;
    totalOther: number;
  };
  netProfit: number;
  netProfitMargin: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const ProfitLossPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => dayjs().startOf("year").format("YYYY-MM-DD"));
  const [to, setTo] = useState(() => dayjs().endOf("month").format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProfitLossStatement | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    setLoading(true);
    const range = values?.dateRange || form.getFieldValue("dateRange");
    const fromDate = range?.[0]
      ? range[0].startOf("month").format("YYYY-MM-DD")
      : from;
    const toDate = range?.[1]
      ? range[1].endOf("month").format("YYYY-MM-DD")
      : to;

    if (range?.[0] && range?.[1]) {
      setFrom(fromDate);
      setTo(toDate);
    }

    try {
      const res = await api.get<ProfitLossStatement>(
        "/api/v1/erp/reports/pnl",
        {
          params: { from: fromDate, to: toDate },
        }
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch P&L statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const defaultRange = [dayjs().startOf("year"), dayjs()];
      form.setFieldsValue({ dateRange: defaultRange });
      fetchReport({ dateRange: defaultRange });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const getPeriodLabel = () => {
    const range = form.getFieldValue("dateRange");
    if (range?.[0] && range?.[1]) {
      return `${range[0].format("MMM YYYY")} – ${range[1].format("MMM YYYY")}`;
    }
    return `${dayjs(from).format("MMM YYYY")} – ${dayjs(to).format("MMM YYYY")}`;
  };

  const handleExportExcel = () => {
    if (!report) {
      toast("No data to export");
      return;
    }

    const rows = [
      ["Neverbe ERP"],
      ["Profit & Loss Statement"],
      [`Period: ${getPeriodLabel()}`],
      [""],
      ["Description", "Amount (LKR)", "% of Revenue"],
      ["REVENUE"],
      ["Gross Sales", report.revenue.grossSales],
      ["Less: Discounts", -report.revenue.discounts],
      ["Net Sales", report.revenue.netSales],
      ["Shipping Income", report.revenue.shippingIncome],
      ...(report.revenue.otherIncome > 0
        ? [["Other Income", report.revenue.otherIncome]]
        : []),
      ["Total Revenue", report.revenue.totalRevenue],
      [""],
      ["COST OF GOODS SOLD"],
      ["Product Cost", report.costOfGoodsSold.productCost],
      ...(report.costOfGoodsSold.shippingCost > 0
        ? [["Shipping Cost", report.costOfGoodsSold.shippingCost]]
        : []),
      ["Total COGS", report.costOfGoodsSold.totalCOGS],
      ["GROSS PROFIT", report.grossProfit, `${report.grossProfitMargin.toFixed(1)}%`],
      [""],
      ["OPERATING EXPENSES"],
      ...report.operatingExpenses.byCategory.map((e) => [
        e.category,
        e.amount,
        report.operatingExpenses.totalExpenses > 0
          ? `${((e.amount / report.operatingExpenses.totalExpenses) * 100).toFixed(1)}%`
          : "—",
      ]),
      ["Total Expenses", report.operatingExpenses.totalExpenses],
      ["OPERATING INCOME", report.operatingIncome],
      [""],
      ["NON-OPERATING EXPENSES"],
      ["Transaction Fees", report.otherExpenses.transactionFees],
      ...(report.otherExpenses.otherFees > 0
        ? [["Other Fees", report.otherExpenses.otherFees]]
        : []),
      ["Total Non-Operating Expenses", report.otherExpenses.totalOther],
      ["NET PROFIT / (LOSS)", report.netProfit, `${report.netProfitMargin.toFixed(1)}%`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P&L Statement");
    XLSX.writeFile(wb, `pnl_statement_${from}_to_${to}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!report) return;
    const toastId = toast.loading("Generating P&L PDF...");
    try {
      await exportPNLPDF({
        periodLabel: getPeriodLabel(),
        report,
        filename: `pnl_statement_${from}_to_${to}`,
      });
      toast.success("PDF downloaded!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const kpiCards = report
    ? [
        {
          label: "Total Revenue",
          value: report.revenue.totalRevenue,
          icon: <IconCoin size={18} />,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/40",
          margin: null,
        },
        {
          label: "Gross Profit",
          value: report.grossProfit,
          icon:
            report.grossProfit >= 0 ? (
              <IconTrendingUp size={18} />
            ) : (
              <IconTrendingDown size={18} />
            ),
          color: report.grossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          bg: report.grossProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",
          margin: report.grossProfitMargin,
        },
        {
          label: "Operating Expenses",
          value: report.operatingExpenses.totalExpenses,
          icon: <IconReceipt size={18} />,
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-50 dark:bg-purple-950/40",
          margin: null,
        },
        {
          label: "Net Profit",
          value: report.netProfit,
          icon:
            report.netProfit >= 0 ? (
              <IconTrendingUp size={18} />
            ) : (
              <IconTrendingDown size={18} />
            ),
          color: report.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          bg: report.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",
          margin: report.netProfitMargin,
        },
      ]
    : [];

  return (
    <PageContainer title="Profit & Loss Statement">
      <div className="w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Financial Statements
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Profit & Loss Statement
                </h2>
                {report && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                    {getPeriodLabel()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Month/Year Picker & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-1.5 rounded-xl shadow-xs">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker
                    picker="month"
                    format="MMM YYYY"
                    size="middle"
                    className="rounded-lg text-xs"
                  />
                </Form.Item>
                <button
                  type="submit"
                  className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <IconFilter size={14} />
                  <span>Filter</span>
                </button>
              </Form>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={!report}
              className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark text-text-main dark:text-text-main-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl px-3 py-2 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconDownload size={15} />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!report}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileTypePdf size={15} />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        )}

        {/* Content */}
        {!loading && report && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-sub dark:text-slate-400">
                      {card.label}
                    </span>
                    <span className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                      {card.icon}
                    </span>
                  </div>
                  <p className={`text-lg font-mono font-bold ${card.color} leading-none mb-1`}>
                    Rs {fmt(Math.abs(card.value))}
                  </p>
                  {card.margin !== null && card.margin !== undefined && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-text-sub dark:text-slate-500">Margin</span>
                        <span className={`font-bold ${card.color}`}>
                          {card.margin.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(Math.abs(card.margin), 100)}
                        showInfo={false}
                        strokeColor={card.value >= 0 ? "#10b981" : "#f43f5e"}
                        trailColor="rgba(148, 163, 184, 0.15)"
                        size="small"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Operating Expense Breakdown */}
            {report.operatingExpenses.byCategory.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block mb-3">
                  Operating Expense Category Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.operatingExpenses.byCategory.map((cat) => {
                    const pct =
                      report.operatingExpenses.totalExpenses > 0
                        ? (cat.amount / report.operatingExpenses.totalExpenses) * 100
                        : 0;
                    return (
                      <div
                        key={cat.category}
                        className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-card-border dark:border-card-border-dark"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-text-main dark:text-text-main-dark truncate max-w-[180px]">
                            {cat.category}
                          </span>
                          <span className="font-mono font-bold text-text-main dark:text-text-main-dark">
                            Rs {fmt(cat.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress
                              percent={pct}
                              showInfo={false}
                              strokeColor="#3b82f6"
                              trailColor="rgba(148, 163, 184, 0.2)"
                              size="small"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-text-sub dark:text-slate-400 shrink-0">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Statement Table */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-card-border dark:border-card-border-dark flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block">
                    Statement of Operations
                  </span>
                  <span className="text-xs font-bold text-text-main dark:text-text-main-dark">
                    Period: {getPeriodLabel()}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  LKR
                </span>
              </div>

              <div className="divide-y divide-card-border dark:divide-card-border-dark font-mono text-xs">
                {/* 1. REVENUE */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block font-mono">
                    1. Revenue & Income
                  </span>
                  <div className="flex justify-between pl-3 text-text-main dark:text-text-main-dark">
                    <span>Gross Sales</span>
                    <span>Rs {fmt(report.revenue.grossSales)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-rose-600 dark:text-rose-400">
                    <span>Less: Promotional Discounts</span>
                    <span>- Rs {fmt(report.revenue.discounts)}</span>
                  </div>
                  <div className="flex justify-between pl-3 font-semibold text-text-main dark:text-text-main-dark">
                    <span>Net Sales</span>
                    <span>Rs {fmt(report.revenue.netSales)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-text-sub dark:text-slate-400">
                    <span>Shipping Income (Collected)</span>
                    <span>Rs {fmt(report.revenue.shippingIncome)}</span>
                  </div>
                  {report.revenue.otherIncome > 0 && (
                    <div className="flex justify-between pl-3 text-text-sub dark:text-slate-400">
                      <span>Other Income</span>
                      <span>Rs {fmt(report.revenue.otherIncome)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-text-main dark:text-text-main-dark mt-1">
                    <span>Total Operating Revenue</span>
                    <span>Rs {fmt(report.revenue.totalRevenue)}</span>
                  </div>
                </div>

                {/* 2. COGS */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block font-mono">
                    2. Cost of Goods Sold (COGS)
                  </span>
                  <div className="flex justify-between pl-3 text-text-main dark:text-text-main-dark">
                    <span>Direct Product Cost</span>
                    <span>Rs {fmt(report.costOfGoodsSold.productCost)}</span>
                  </div>
                  {report.costOfGoodsSold.shippingCost > 0 && (
                    <div className="flex justify-between pl-3 text-text-sub dark:text-slate-400">
                      <span>Shipping & Logistics Cost</span>
                      <span>Rs {fmt(report.costOfGoodsSold.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold mt-1">
                    <span>Total Cost of Goods Sold</span>
                    <span>Rs {fmt(report.costOfGoodsSold.totalCOGS)}</span>
                  </div>
                </div>

                {/* GROSS PROFIT HIGHLIGHT */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <div className="flex justify-between items-center font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    <span>GROSS PROFIT ({report.grossProfitMargin.toFixed(1)}% Margin)</span>
                    <span>Rs {fmt(report.grossProfit)}</span>
                  </div>
                </div>

                {/* 3. OPERATING EXPENSES */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block font-mono">
                    3. Operating Expenses
                  </span>
                  {report.operatingExpenses.byCategory.map((cat) => (
                    <div key={cat.category} className="flex justify-between pl-3 text-text-main dark:text-text-main-dark">
                      <span>{cat.category}</span>
                      <span>Rs {fmt(cat.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold mt-1">
                    <span>Total Operating Expenses</span>
                    <span>Rs {fmt(report.operatingExpenses.totalExpenses)}</span>
                  </div>
                </div>

                {/* OPERATING INCOME */}
                <div className="p-4">
                  <div className="flex justify-between items-center font-bold text-text-main dark:text-text-main-dark text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span>Operating Income (EBIT)</span>
                    <span>Rs {fmt(report.operatingIncome)}</span>
                  </div>
                </div>

                {/* 4. NON-OPERATING EXPENSES */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub dark:text-slate-400 block font-mono">
                    4. Non-Operating Expenses
                  </span>
                  <div className="flex justify-between pl-3 text-text-main dark:text-text-main-dark">
                    <span>Transaction & Gateway Fees</span>
                    <span>Rs {fmt(report.otherExpenses.transactionFees)}</span>
                  </div>
                  {report.otherExpenses.otherFees > 0 && (
                    <div className="flex justify-between pl-3 text-text-sub dark:text-slate-400">
                      <span>Other Miscellaneous Fees</span>
                      <span>Rs {fmt(report.otherExpenses.otherFees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-text-main dark:text-text-main-dark mt-1">
                    <span>Total Non-Operating Expenses</span>
                    <span>Rs {fmt(report.otherExpenses.totalOther)}</span>
                  </div>
                </div>

                {/* 5. NET PROFIT FINAL ROW */}
                <div className={`p-4 ${report.netProfit >= 0 ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-rose-900 text-white"}`}>
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span>NET PROFIT / LOSS ({report.netProfitMargin.toFixed(1)}% Net Margin)</span>
                    <span className="text-base">Rs {fmt(report.netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !report && (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-12 text-center text-text-sub dark:text-slate-500">
            <IconMinus size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">Select a month range and click Filter to generate statement.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ProfitLossPage;
