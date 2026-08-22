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
import dayjs from "dayjs";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { IconFilter, IconFileTypePdf, IconMinus, IconTrendingUp, IconTrendingDown, IconShoppingCart, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface MonthlyRow {
  month?: string;
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

interface SummaryType {
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

const MAX_MONTH_RANGE = 12;

const fmt = (v?: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v ?? 0);

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

export default function MonthlyRevenuePage() {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [summary, setSummary] = useState<SummaryType | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const getMonthStart = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    return `${y}-${m}-01`;
  };

  const getMonthEnd = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return `${y}-${m}-${lastDay}`;
  };

  const validateRange = () => {
    if (!from || !to) return "Please select From & To months.";
    const start = new Date(getMonthStart(from));
    const end = new Date(getMonthEnd(to));
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Invalid date range.";
    if (start > end) return "From month cannot be after To month.";
    const diffMonths =
      end.getFullYear() * 12 +
      end.getMonth() -
      (start.getFullYear() * 12 + start.getMonth());
    if (diffMonths > MAX_MONTH_RANGE)
      return `Maximum range is ${MAX_MONTH_RANGE} months.`;
    return null;
  };

  const fetchReport = async (values?: any) => {
    let fromMonth = from;
    let toMonth = to;
    if (values?.monthRange) {
      fromMonth = values.monthRange[0]?.format("YYYY-MM") || from;
      toMonth = values.monthRange[1]?.format("YYYY-MM") || to;
      setFrom(fromMonth);
      setTo(toMonth);
    }
    const err = validateRange();
    if (err) {
      toast(err);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(
        "/api/v1/erp/reports/revenues/monthly-revenue",
        {
          params: { from: getMonthStart(fromMonth), to: getMonthEnd(toMonth) },
        },
      );
      setRows(Array.isArray(res.data?.monthly) ? res.data.monthly : []);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ monthRange: [dayjs(), dayjs()] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportPDF = async () => {
    if (!rows.length || !summary) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF…");
    try {
      await exportReportPDF({
        title: "Monthly Revenue Report",
        subtitle: "Monthly breakdown of sales, costs, and profit figures",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Revenue", value: `LKR ${fmt(summary.totalSales)}` },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(summary.grossProfit)}`,
            sub: `${summary.grossProfitMargin?.toFixed(1)}% margin`,
          },
          {
            label: "Net Profit",
            value: `LKR ${fmt(summary.netProfit)}`,
            sub: `${summary.netProfitMargin?.toFixed(1)}% margin`,
          },
        ],
        chartSpecs: [
          {
            title: "Net Revenue & Profit Trends",
            elementId: "revenue-trend-chart",
          },
        ],
        tables: [
          {
            title: "Monthly Breakdown",
            columns: [
              "Month",
              "Orders",
              "Net Sales",
              "COGS",
              "Gross Profit",
              "Net Margin",
            ],
            rows: rows.map((r) => [
              String(r.month),
              String(r.totalOrders),
              `LKR ${fmt(r.totalNetSales)}`,
              `LKR ${fmt(r.totalCOGS)}`,
              `LKR ${fmt(r.grossProfit)}`,
              `${r.netProfitMargin?.toFixed(1)}%`,
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `monthly_revenue_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const handleExportExcel = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const data = rows.map((r) => ({
      Month: r.month,
      Orders: r.totalOrders,
      "Total Revenue": r.totalSales,
      "Net Sales": r.totalNetSales,
      COGS: r.totalCOGS,
      "Gross Profit": r.grossProfit,
      "Gross Margin %": r.grossProfitMargin,
      "Net Profit": r.netProfit,
      "Net Margin %": r.netProfitMargin,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Revenue");
    XLSX.writeFile(wb, `monthly_revenue_${from}_${to}.xlsx`);
    toast.success("Excel exported!");
  };

  const columns: ColumnsType<MonthlyRow> = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      fixed: "left",
      render: (v) => (
        <span className="font-mono text-xs font-bold text-gray-500">
          {v ?? "—"}
        </span>
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
          className={`font-mono font-semibold ${Number(v) >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {Number(v) < 0 && "("}LKR {fmt(Math.abs(Number(v)))}
          {Number(v) < 0 && ")"}
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
          color={Number(v) >= 0 ? "success" : "error"}
          className="font-mono text-[10px] font-bold"
        >
          {Number(v).toFixed(1)}%
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
          className={`font-mono font-bold ${Number(v) >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {Number(v) < 0 && "("}LKR {fmt(Math.abs(Number(v)))}
          {Number(v) < 0 && ")"}
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
          color={Number(v) >= 0 ? "success" : "error"}
          className="font-mono text-[10px] font-bold"
        >
          {Number(v).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const gp = summary?.grossProfit ?? 0;
  const np = summary?.netProfit ?? 0;

  return (
    <PageContainer title="Monthly Revenue Report">
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
                  Monthly Revenue
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
                <Form.Item name="monthRange" className="mb-0!">
                  <DatePicker.RangePicker picker="month" size="middle" />
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
              onClick={handleExportExcel} disabled={!rows.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={handleExportPDF} disabled={!rows.length}
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
                  value: (summary.totalOrders ?? 0).toLocaleString(),
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
                  value: `LKR ${fmt(Math.abs(gp))}`,
                  icon:
                    gp >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color: gp >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: gp >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.grossProfitMargin ?? 0,
                  barLabel: "gross margin",
                  barColor: "#059669",
                },
                {
                  label: "Net Profit",
                  value: `LKR ${fmt(Math.abs(np))}`,
                  icon:
                    np >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color: np >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: np >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.netProfitMargin ?? 0,
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
            {rows.length > 0 && (
              <div className="space-y-6">
                <div
                  id="monthly-revenue-chart-1"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Revenue vs Profit
                  </p>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="month"
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
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#7C3AED"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  id="monthly-revenue-chart-2"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Cost Breakdown
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rows} barCategoryGap="25%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="month"
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
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {rows.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Monthly Breakdown
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {rows.length} months
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
                  dataSource={rows}
                  rowKey={(r) => r.month || Math.random().toString()}
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
              Select a month range (max {MAX_MONTH_RANGE} months) and click
              Filter.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
