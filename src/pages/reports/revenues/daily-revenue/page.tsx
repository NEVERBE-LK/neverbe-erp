import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Space,
  Spin,
  Table,
  Tag,
  Progress,
  Tooltip,
} from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { IconFilter, IconFileTypePdf, IconMinus, IconTrendingUp, IconTrendingDown, IconShoppingCart, IconFileSpreadsheet } from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
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
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface DailyRevenue {
  date: string;
  totalSales: number;
  totalNetSales: number;
  totalCOGS: number;
  totalOrders: number;
  totalDiscount: number;
  totalTransactionFee: number;
  totalExpenses: number;
  totalOtherIncome: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
}

interface RevenueReport {
  daily: DailyRevenue[];
  summary: Omit<DailyRevenue, "date">;
}

const MAX_RANGE_DAYS = 31;

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

const DailyRevenuePage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(new Date().toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueReport["summary"] | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    const diffDays = dayjs(toDate).diff(dayjs(fromDate), "day") + 1;
    if (diffDays > MAX_RANGE_DAYS) {
      const { message } = await import("antd");
      message.error(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
      return;
    }
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }
    setLoading(true);
    try {
      const res = await api.get<RevenueReport>(
        "/api/v1/erp/reports/revenues/daily-revenue",
        { params: { from: fromDate, to: toDate } },
      );
      setReport(res.data.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
      toast("Failed to fetch revenue report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs(), dayjs()] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      toast("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      report.map((d) => ({
        Date: d.date,
        Orders: d.totalOrders,
        "Total Revenue (LKR)": d.totalSales.toFixed(2),
        "Net Sales (LKR)": d.totalNetSales.toFixed(2),
        "COGS (LKR)": d.totalCOGS.toFixed(2),
        "Discount (LKR)": d.totalDiscount.toFixed(2),
        "Trans. Fee (LKR)": d.totalTransactionFee.toFixed(2),
        "Expenses (LKR)": d.totalExpenses.toFixed(2),
        "Other Income (LKR)": d.totalOtherIncome.toFixed(2),
        "Gross Profit (LKR)": d.grossProfit.toFixed(2),
        "Gross Margin (%)": d.grossProfitMargin.toFixed(2),
        "Net Profit (LKR)": d.netProfit.toFixed(2),
        "Net Margin (%)": d.netProfitMargin.toFixed(2),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Revenue");
    XLSX.writeFile(wb, `daily_revenue_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.length) {
      toast("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      const s = summary ?? ({} as RevenueReport["summary"]);
      await exportReportPDF({
        title: "Daily Revenue Report",
        subtitle: "Daily sales, revenue, profit & cost breakdown",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Orders", value: String(s.totalOrders ?? 0) },
          { label: "Total Revenue", value: `LKR ${fmt(s.totalSales ?? 0)}` },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(s.grossProfit ?? 0)}`,
            sub: `${(s.grossProfitMargin ?? 0).toFixed(1)}% margin`,
          },
          {
            label: "Net Profit",
            value: `LKR ${fmt(s.netProfit ?? 0)}`,
            sub: `${(s.netProfitMargin ?? 0).toFixed(1)}% margin`,
          },
        ],
        chartSpecs: [
          {
            title: "Revenue vs Profit Trend",
            elementId: "daily-revenue-chart-1",
          },
          { title: "Cost Breakdown", elementId: "daily-revenue-chart-2" },
        ],
        tables: [
          {
            title: "Daily Revenue Breakdown",
            columns: [
              "Date",
              "Orders",
              "Total Revenue",
              "Net Sales",
              "Gross Profit",
              "Net Profit",
            ],
            rows: report.map((d) => [
              d.date,
              d.totalOrders,
              `LKR ${fmt(d.totalSales)}`,
              `LKR ${fmt(d.totalNetSales)}`,
              `LKR ${fmt(d.grossProfit)}`,
              `LKR ${fmt(d.netProfit)}`,
            ]),
            greenCols: [4, 5],
          },
        ],
        filename: `daily_revenue_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<DailyRevenue> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      fixed: "left",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">{v}</span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "center",
      render: (v) => <Tag className="font-mono font-bold text-[10px]">{v}</Tag>,
    },
    {
      title: (
        <Tooltip title="Total cash received from orders (including shipping charges)">
          <span>Total Revenue</span>
        </Tooltip>
      ),
      dataIndex: "totalSales",
      key: "totalSales",
      align: "right",
      render: (v) => (
        <span className="font-mono text-blue-700">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "totalNetSales",
      key: "totalNetSales",
      align: "right",
      render: (v) => (
        <span className="font-mono text-gray-700">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "totalCOGS",
      key: "totalCOGS",
      align: "right",
      render: (v) => (
        <span className="font-mono text-red-500">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Gross Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (v) => (
        <span
          className={`font-mono font-semibold ${v >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {v < 0 && "("}LKR {fmt(Math.abs(v))}
          {v < 0 && ")"}
        </span>
      ),
    },
    {
      title: "Gro. Margin",
      dataIndex: "grossProfitMargin",
      key: "grossProfitMargin",
      align: "right",
      render: (v) => (
        <Tag
          color={v >= 0 ? "success" : "error"}
          className="font-mono text-[10px] font-bold"
        >
          {v.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: "Net Profit",
      dataIndex: "netProfit",
      key: "netProfit",
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
    {
      title: "Net Margin",
      dataIndex: "netProfitMargin",
      key: "netProfitMargin",
      align: "right",
      render: (v) => (
        <Tag
          color={v >= 0 ? "success" : "error"}
          className="font-mono text-[10px] font-bold"
        >
          {v.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer title="Daily Revenue Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Revenue Reports
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Daily Revenue
                </h2>
                {typeof from !== 'undefined' && typeof to !== 'undefined' && from && to && (
                  <span className="whitespace-nowrap flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                    {from} to {to}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Button
                    htmlType="submit"
                    type="primary"
                    icon={<IconFilter size={15} />}
                  >
                    Filter
                  </Button>
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
            <Spin size="large" />
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Revenue KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: summary.totalOrders.toLocaleString(),
                  icon: <IconShoppingCart size={20} />,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  bar: null,
                },
                {
                  label: "Total Revenue",
                  value: `LKR ${fmt(summary.totalSales)}`,
                  icon: <IconTrendingUp size={20} />,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  bar: null,
                },
                {
                  label: "Net Sales",
                  value: `LKR ${fmt(summary.totalNetSales)}`,
                  icon: <IconTrendingUp size={20} />,
                  color: "text-indigo-700",
                  bg: "bg-indigo-50",
                  bar: null,
                },
                {
                  label: "Total COGS",
                  value: `LKR ${fmt(summary.totalCOGS)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-red-600",
                  bg: "bg-red-50",
                  bar: null,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
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

            {/* Profit KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Gross Profit",
                  value: `LKR ${fmt(Math.abs(summary.grossProfit))}`,
                  icon:
                    summary.grossProfit >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color:
                    summary.grossProfit >= 0
                      ? "text-emerald-700"
                      : "text-red-600",
                  bg: summary.grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.grossProfitMargin,
                  barLabel: "gross margin",
                  barColor: "#059669",
                },
                {
                  label: "Net Profit",
                  value: `LKR ${fmt(Math.abs(summary.netProfit))}`,
                  icon:
                    summary.netProfit >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color:
                    summary.netProfit >= 0
                      ? "text-emerald-700"
                      : "text-red-600",
                  bg: summary.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.netProfitMargin,
                  barLabel: "net margin",
                  barColor: "#111827",
                },
                {
                  label: "Total Expenses",
                  value: `LKR ${fmt(summary.totalExpenses)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                  bar: null,
                  barLabel: "",
                  barColor: "",
                },
                {
                  label: "Trans. Fees",
                  value: `LKR ${fmt(summary.totalTransactionFee)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  bar: null,
                  barLabel: "",
                  barColor: "",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
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
                  {c.bar !== null && c.bar !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-bold">
                          {c.barLabel}
                        </span>
                        <span className={`text-[10px] font-black ${c.color}`}>
                          {c.bar.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(Math.abs(c.bar), 100)}
                        showInfo={false}
                        strokeColor={c.barColor}
                        trailColor="#f3f4f6"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            {report.length > 0 && (
              <div className="space-y-6">
                <div
                  id="daily-revenue-chart-1"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Revenue vs Profit
                  </p>
                  <div className="h-[320px]">
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
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={75}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalSales"
                          name="Total Revenue"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#7C3AED"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  id="daily-revenue-chart-2"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Cost Breakdown
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report} barCategoryGap="25%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={75}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                          cursor={{ fill: "#F9FAFB" }}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalDiscount"
                          name="Discount"
                          stackId="a"
                          fill="#EF4444"
                        />
                        <Bar
                          dataKey="totalTransactionFee"
                          name="Trans. Fee"
                          stackId="a"
                          fill="#F59E0B"
                        />
                        <Bar
                          dataKey="totalExpenses"
                          name="Expenses"
                          stackId="a"
                          fill="#6B7280"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {report.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
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
                <Table pagination={false}
                  columns={columns}
                  dataSource={report}
                  rowKey={(r) => r.date || Math.random().toString()}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !summary && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range (max {MAX_RANGE_DAYS} days) and click Filter.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DailyRevenuePage;
