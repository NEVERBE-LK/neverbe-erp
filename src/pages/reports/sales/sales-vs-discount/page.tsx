import {
  Card,
  Form,
  Spin,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Tooltip as AntdTooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { IconFilter, IconFileTypePdf, IconTrendingUp, IconCurrencyDollar, IconDiscount2, IconCreditCard, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const SummaryCard = ({
  title,
  value,
  sub,
  icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) => (
  <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}
    >
      <span className={color}>{icon}</span>
    </div>
    <p className="text-[10px] uppercase font-black tracking-[0.1em] text-gray-400 mb-1">
      {title}
    </p>
    <p className={`text-xl font-black tracking-tight ${color} leading-none`}>
      {value}
    </p>
    {sub && <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>}
  </div>
);

const SalesVsDiscountPage = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [groupBy] = useState<"day" | "month">("day");

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        dateRange: [dayjs(from), dayjs(to)],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchReport = async (values?: any) => {
    let fromDate = from;
    let toDate = to;
    if (values?.dateRange) {
      fromDate = values.dateRange[0]?.format("YYYY-MM-DD");
      toDate = values.dateRange[1]?.format("YYYY-MM-DD");
      setFrom(fromDate);
      setTo(toDate);
    }

    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/sales-vs-discount", {
        params: { from: fromDate, to: toDate, groupBy },
      });
      const data = res.data.report || [];
      setReport(data);

      if (data.length > 0) {
        setSummary({
          totalSales: data.reduce(
            (sum: number, r: any) => sum + r.totalSales,
            0,
          ),
          totalNetSales: data.reduce(
            (sum: number, r: any) => sum + r.totalNetSales,
            0,
          ),
          totalDiscount: data.reduce(
            (sum: number, r: any) => sum + r.totalDiscount,
            0,
          ),
          totalFee: data.reduce(
            (sum: number, r: any) => sum + (r.totalTransactionFee || 0),
            0,
          ),
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!report.length) return;
    const exportData = report.map((r) => ({
      Period: r.period,
      "Total Revenue (LKR)": r.totalSales.toFixed(2),
      "Total Net Sale": r.totalNetSales.toFixed(2),
      "Total Discount (LKR)": r.totalDiscount.toFixed(2),
      "Total Transaction Fee (LKR)": (r.totalTransactionFee || 0).toFixed(2),
      "Total Orders": r.totalOrders,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales vs Discount");
    XLSX.writeFile(wb, `sales_vs_discount_${from}_${to}.xlsx`);
    toast.success("Excel exported!");
  };

  const handleExportPDF = async () => {
    if (!report.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Sales vs Discount Analysis",
        subtitle:
          "Comparison of total revenue, net sales and applied discounts",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Revenue", value: `LKR ${fmt(summary.totalSales)}` },
          { label: "Net Sales", value: `LKR ${fmt(summary.totalNetSales)}` },
          {
            label: "Total Discount",
            value: `LKR ${fmt(summary.totalDiscount)}`,
          },
          {
            label: "Avg Discount %",
            value: `${((summary.totalDiscount / summary.totalSales) * 100 || 0).toFixed(1)}%`,
          },
        ],
        tables: [
          {
            title: "Performance Data",
            columns: [
              "Period",
              "Total Revenue",
              "Net Sales",
              "Discount",
              "Fee",
            ],
            rows: report.map((r: any) => [
              r.period,
              fmt(r.totalSales),
              fmt(r.totalNetSales),
              fmt(r.totalDiscount),
              fmt(r.totalTransactionFee || 0),
            ]),
            boldCols: [0],
          },
        ],
        filename: `sales_vs_discount_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };
  const columns: ColumnsType<any> = [
    {
      title: "Period",
      key: "period",
      render: (_, r) => (
        <span className="font-medium text-gray-900">{r.period}</span>
      ),
    },
    {
      title: (
        <AntdTooltip title="Total cash received (including shipping fees)">
          <span>Total Revenue</span>
        </AntdTooltip>
      ),
      key: "sales",
      align: "right",
      render: (_, r) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(r.totalSales || 0)}
        </span>
      ),
    },
    {
      title: "Net Sale",
      key: "netSale",
      align: "right",
      render: (_, r) => (
        <span className="text-gray-700 font-mono text-xs">
          LKR {fmt(r.totalNetSales || 0)}
        </span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, r) => (
        <span className="text-red-500 font-mono text-xs">
          (LKR {fmt(r.totalDiscount || 0)})
        </span>
      ),
    },
    {
      title: "Trans. Fee",
      key: "transFee",
      align: "right",
      render: (_, r) => (
        <span className="text-orange-500 font-mono text-xs">
          (LKR {fmt(r.totalTransactionFee || 0)})
        </span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, r) => <span className="text-gray-600">{r.totalOrders}</span>,
    },
  ];

  return (
    <PageContainer title="Sales vs Discount">
      <div className="w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Sales Analysis
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Sales vs Discount
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
                  <DatePicker.RangePicker allowClear={false} />
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
              onClick={exportExcel}
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        )}

        {/* Content */}
        {!loading && report.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Revenue"
                value={`LKR ${fmt(summary?.totalSales || 0)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(summary?.totalNetSales || 0)}`}
                icon={<IconCurrencyDollar size={20} />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Applied Discounts"
                value={`LKR ${fmt(summary?.totalDiscount || 0)}`}
                icon={<IconDiscount2 size={20} />}
                color="text-red-500"
                bg="bg-red-50"
              />
              <SummaryCard
                title="Trans. Fees"
                value={`LKR ${fmt(summary?.totalFee || 0)}`}
                icon={<IconCreditCard size={20} />}
                color="text-orange-600"
                bg="bg-orange-50"
              />
            </div>

            {/* Chart */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                Sales vs Discount Trend
              </p>
              <div className="h-[350px] w-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      tickMargin={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "none",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                        fontSize: "12px",
                        fontWeight: "bold",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#F9FAFB" }}
                      cursor={{ stroke: "#f3f4f6", strokeWidth: 1 }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      name="Total Sales"
                      stroke="#111827"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalNetSales"
                      name="Net Sale"
                      stroke="#22C55E"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalDiscount"
                      name="Discount"
                      stroke="#EF4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalTransactionFee"
                      name="Transaction Fee"
                      stroke="#F59E0B"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Performance Data
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {report.length} entries recorded
                  </p>
                </div>
                <Tag
                  color="default"
                  className="text-[10px] font-bold uppercase"
                >
                  LKR
                </Tag>
              </div>
              <Table pagination={false} className="pnl-table"
                columns={columns}
                dataSource={report}
                rowKey={(r: any) => r.period}
                size="small"
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SalesVsDiscountPage;
