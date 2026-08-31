import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import { Button, Card, DatePicker, Form, Space, Table, Tag } from "antd";
import Spinner from "@/pages/components/shared/Spinner";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconMinus,
  IconCashBanknote,
  IconArrowDownRight,
  IconArrowUpRight,
  IconTrendingUp,
IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";

interface DailyCashFlow {
  date: string;
  orders: number;
  cashIn: number;
  transactionFees: number;
  expenses: number;
  netCashFlow: number;
}

interface CashFlowSummary {
  totalOrders: number;
  totalCashIn: number;
  totalTransactionFees: number;
  totalExpenses: number;
  totalNetCashFlow: number;
  byMethod: { method: string; total: number; fee: number; orders: number }[];
  daily: DailyCashFlow[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "none",
    borderRadius: "8px",
    color: "#F9FAFB",
    fontSize: "12px",
  },
  itemStyle: { color: "#F9FAFB" },
};

const CashFlowPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyCashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);

  const fetchReport = async (values?: any) => {
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD");
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD");
    if (!fromDate || !toDate) return;
    setFrom(fromDate);
    setTo(toDate);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/cash/cashflow", {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data.summary?.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
      toast("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      toast("No data to export");
      return;
    }
    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Cash In (LKR)": d.cashIn.toFixed(2),
      "Transaction Fees (LKR)": d.transactionFees.toFixed(2),
      "Expenses (LKR)": d.expenses.toFixed(2),
      "Net Cash Flow (LKR)": d.netCashFlow.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
    XLSX.writeFile(wb, `cashflow_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.length) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Cashflow Report",
        subtitle: "Daily cash movements and balances",
        period: `${from} – ${to}`,
        summaryItems: [
          {
            label: "Total Cash In",
            value: `LKR ${fmt(summary?.totalCashIn ?? 0)}`,
          },
          {
            label: "Total Expenses",
            value: `LKR ${fmt(summary?.totalExpenses ?? 0)}`,
          },
          {
            label: "Transaction Fees",
            value: `LKR ${fmt(summary?.totalTransactionFees ?? 0)}`,
          },
          {
            label: "Net Cash Flow",
            value: `LKR ${fmt(summary?.totalNetCashFlow ?? 0)}`,
          },
        ],
        chartSpecs: [{ title: "Cash Flow Trend", elementId: "cashflow-chart-1" }],
        tables: [
          {
            title: "Daily Cashflow Summary",
            columns: [
              "Date",
              "Orders",
              "Cash In (LKR)",
              "Trans. Fees (LKR)",
              "Expenses (LKR)",
              "Net Cashflow (LKR)",
            ],
            rows: report.map((d) => [
              d.date,
              String(d.orders),
              fmt(d.cashIn),
              fmt(d.transactionFees),
              fmt(d.expenses),
              fmt(d.netCashFlow),
            ]),
            boldCols: [0],
            greenCols: [5],
            redCols: [3, 4],
          },
          {
            title: "Payment Method Breakdown",
            columns: ["Method", "Orders", "Fee (LKR)", "Total Received (LKR)"],
            rows: (summary?.byMethod || []).map((m) => [
              m.method,
              String(m.orders),
              fmt(m.fee),
              fmt(m.total),
            ]),
            boldCols: [0],
          },
        ],

        filename: `cashflow_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<DailyCashFlow> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">{v}</span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "right",
      render: (v) => <Tag className="font-mono text-[10px] font-bold">{v}</Tag>,
    },
    {
      title: "Cash In",
      dataIndex: "cashIn",
      key: "cashIn",
      align: "right",
      render: (v) => (
        <span className="font-mono font-semibold text-emerald-700">
          LKR {fmt(v)}
        </span>
      ),
    },
    {
      title: "Trans. Fee",
      dataIndex: "transactionFees",
      key: "transactionFees",
      align: "right",
      render: (v) => (
        <span className="font-mono text-red-500">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Expenses",
      dataIndex: "expenses",
      key: "expenses",
      align: "right",
      render: (v) => (
        <span className="font-mono text-red-600">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Net Cash Flow",
      dataIndex: "netCashFlow",
      key: "netCashFlow",
      align: "right",
      render: (v) => (
        <span
          className={`font-mono font-bold ${v >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {v < 0 && "("}LKR {fmt(Math.abs(v))}
          {v < 0 && ")"}
        </span>
      ),
    },
  ];

  const net = summary?.totalNetCashFlow ?? 0;

  return (
    <PageContainer title="Cashflow Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Financial Reports
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Cashflow
                </h2>
                {summary && (
                  <span className="whitespace-nowrap flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                    {from} to {to}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small"
                  className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <button
                    type="submit"
                    className="h-[38px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <IconFilter size={15} />
                    <span>Filter</span>
                  </button>
                </Form.Item>
              </Form>
            </Card>
            <Space>
              <button
                onClick={handleExportExcel} disabled={!report.length}
                className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <IconFileSpreadsheet size={15} />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF} disabled={!report.length}
                className="flex-1 sm:flex-none justify-center bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <IconFileTypePdf size={15} />
                <span>PDF</span>
              </button>
            </Space>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: summary.totalOrders.toLocaleString(),
                  icon: <IconTrendingUp size={20} />,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Total Cash In",
                  value: `LKR ${fmt(summary.totalCashIn)}`,
                  icon: <IconCashBanknote size={20} />,
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Transaction Fees",
                  value: `LKR ${fmt(summary.totalTransactionFees)}`,
                  icon: <IconArrowDownRight size={20} />,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  label: "Total Expenses",
                  value: `LKR ${fmt(summary.totalExpenses)}`,
                  icon: <IconArrowDownRight size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                },
                {
                  label: "Net Cash Flow",
                  value: `LKR ${fmt(Math.abs(net))}`,
                  icon:
                    net >= 0 ? (
                      <IconArrowUpRight size={20} />
                    ) : (
                      <IconArrowDownRight size={20} />
                    ),
                  color: net >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: net >= 0 ? "bg-emerald-50" : "bg-red-50",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}
                  >
                    <span className={c.color}>{c.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {c.label}
                  </p>
                  <p
                    className={`text-lg font-black tracking-tight ${c.color} leading-none`}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            {report.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                  id="cashflow-chart-1"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-5 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Cash Flow Trend
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={70}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cashIn"
                          name="Cash In"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netCashFlow"
                          name="Net Cash Flow"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  id="cashflow-chart-2"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-5 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Fees & Expenses Breakdown
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report} barCategoryGap="30%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={70}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="transactionFees"
                          name="Transaction Fees"
                          fill="#EF4444"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#F59E0B"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  id="cashflow-chart-3"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-5 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Payment Method Breakdown
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={summary.byMethod}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          type="category"
                          dataKey="method"
                          axisLine={false}
                          tickLine={false}
                          width={100}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Bar
                          dataKey="total"
                          name="Total Received"
                          fill="#3B82F6"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {false && report.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Daily Breakdown
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {report.length} days
                    </p>
                  </div>
                  <Tag
                    color="default"
                    className="text-[10px] font-bold uppercase"
                  >
                    LKR
                  </Tag>
                </div>
                <Table
                  pagination={false}
                  columns={columns}
                  dataSource={report}
                  rowKey={(r) => r.date || Math.random().toString()}
                  size="small"
                  scroll={{ x: "max-content" }}
                  className="pnl-table"
                />
              </div>
            )}
          </div>
        )}

        {!loading && !summary && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range and click Filter.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CashFlowPage;
