import api from "@/lib/api";
import {
  Form,
  Table,
  DatePicker,
  Select,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { IconFilter, IconFileTypePdf, IconShoppingCart, IconTrendingUp, IconPackages, IconPercentage, IconCurrencyDollar, IconTruckDelivery, IconFileSpreadsheet } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const DailySummaryPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM-DD") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM-DD") || dateRange[1];
    const status = values?.status || "Paid";

    const start = new Date(from);
    const end = new Date(to);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      toast.error("'To' date must be after 'From' date");
      return;
    }

    if (diffDays > 62) {
      toast.error(`Max allowed range is 62 days for daily summary`);
      return;
    }

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/daily-summary", {
        params: { from, to, status },
      });
      setSummary(res.data.summary || null);
    } catch (e: any) {
      console.log(e);
      toast.error(
        e.response?.data?.error || e.message || "Failed to fetch report",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        dateRange: [dayjs(dateRange[0]), dayjs(dateRange[1])],
        status: "Paid",
      });
    }
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!summary?.daily || summary.daily.length === 0) return;

    const exportData = summary.daily.map((d: any) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Total Revenue (Rs)": d.sales.toFixed(2),
      "Total Net Sales": d.netSales.toFixed(2),
      "Total COGS (Rs)": (d.cogs || 0).toFixed(2),
      "Total Gross Profit (Rs)": (d.grossProfit || 0).toFixed(2),
      "Gross Profit Margin (%)": (d.grossProfitMargin || 0).toFixed(2),
      "Avg Order Value (Rs)": (d.averageOrderValue || 0).toFixed(2),
      "Shipping (Rs)": d.shipping.toFixed(2),
      "Discount (Rs)": d.discount.toFixed(2),
      "Transaction Fee (Rs)": d.transactionFee.toFixed(2),
      "Items Sold": d.itemsSold,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Summary");
    XLSX.writeFile(wb, `daily_summary_${dateRange[0]}_${dateRange[1]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!summary?.daily?.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Daily Sales Summary",
        subtitle: "Comprehensive daily sales and profit breakdown",
        period: `${dateRange[0]} – ${dateRange[1]}`,
        summaryItems: [
          { label: "Total Orders", value: String(summary.totalOrders) },
          { label: "Total Revenue", value: `LKR ${fmt(summary.totalSales)}` },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(summary.totalGrossProfit || 0)}`,
            sub: `${(summary.totalGrossProfitMargin || 0).toFixed(1)}% margin`,
          },
          {
            label: "Avg Order Value",
            value: `LKR ${fmt(summary.averageOrderValue || 0)}`,
          },
        ],
        chartSpecs: [
          { title: "Daily Sales Trend", elementId: "daily-sales-trend-chart" },
        ],
        tables: [
          {
            title: "Daily Breakdown",
            columns: [
              "Date",
              "Orders",
              "Net Sales",
              "COGS",
              "Profit",
              "Shipping",
            ],
            rows: summary.daily.map((d: any) => [
              d.date,
              String(d.orders),
              fmt(d.netSales),
              fmt(d.cogs || 0),
              fmt(d.grossProfit || 0),
              fmt(d.shipping),
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `daily_sales_summary_${dateRange[0]}_${dateRange[1]}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const SummaryCard = ({
    title,
    value,
    sub,
    icon,
  }: {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
  }) => (
    <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-xl shadow-xs flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-sub">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-xl font-bold text-text-main dark:text-text-main-dark tracking-tight">
          {value}
        </span>
        {sub && (
          <span className="text-[10px] text-text-sub dark:text-slate-400 block mt-0.5">
            {sub}
          </span>
        )}
      </div>
    </div>
  );

  const columns: ColumnsType<any> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => (
        <span className="font-semibold text-xs text-text-main dark:text-text-main-dark font-mono">
          {text}
        </span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "center",
      render: (text) => (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub border border-card-border dark:border-card-border-dark">
          {text}
        </span>
      ),
    },
    {
      title: "Total Revenue",
      dataIndex: "sales",
      key: "sales",
      align: "right",
      render: (val) => (
        <span className="font-bold text-xs text-text-main dark:text-text-main-dark font-mono">
          LKR {fmt(val)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "netSales",
      key: "netSales",
      align: "right",
      render: (val) => (
        <span className="text-xs text-text-sub dark:text-slate-400 font-mono">
          LKR {fmt(val)}
        </span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      key: "cogs",
      align: "right",
      render: (val) => (
        <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">
          (LKR {fmt(val || 0)})
        </span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (val) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ${
            val >= 0
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
          }`}
        >
          {val < 0 ? "(" : ""}LKR {fmt(Math.abs(val || 0))}
          {val < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "itemsSold",
      key: "itemsSold",
      align: "center",
      render: (text) => (
        <span className="text-xs text-text-sub font-mono">{text}</span>
      ),
    },
    {
      title: "Shipping",
      dataIndex: "shipping",
      key: "shipping",
      align: "right",
      render: (val) => (
        <span className="text-xs text-text-sub dark:text-slate-400 font-mono">
          LKR {fmt(val)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Daily Sales Summary">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Sales Intelligence
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Daily Sales Summary
                </h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto w-full xl:w-auto">
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-2 flex items-center">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto"
              >
                <Form.Item name="dateRange" className="!mb-0">
                  <DatePicker.RangePicker allowClear={false} className="h-10 rounded-xl" />
                </Form.Item>
                <Form.Item name="status" className="!mb-0 w-32">
                  <Select className="h-10">
                    <Select.Option value="Paid">Paid</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Refunded">Refunded</Select.Option>
                    <Select.Option value="all">All Status</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item className="!mb-0">
                  <Button
                    htmlType="submit"
                    type="primary"
                    icon={<IconFilter size={15} />}
                    className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    Filter
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <button
              onClick={handleExportExcel} disabled={!summary?.daily?.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF} disabled={!summary?.daily?.length}
              className="flex-1 sm:flex-none justify-center bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileTypePdf size={15} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {/* Content */}
        {summary && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Orders"
                value={summary.totalOrders.toLocaleString()}
                icon={<IconShoppingCart size={18} />}
              />
              <SummaryCard
                title="Total Revenue"
                value={`LKR ${fmt(summary.totalSales)}`}
                icon={<IconTrendingUp size={18} />}
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(summary.totalNetSales)}`}
                icon={<IconTrendingUp size={18} />}
              />
              <SummaryCard
                title="Items Sold"
                value={summary.totalItemsSold.toLocaleString()}
                icon={<IconPackages size={18} />}
              />
              <SummaryCard
                title="Gross Profit"
                value={`LKR ${fmt(summary.totalGrossProfit || 0)}`}
                icon={<IconTrendingUp size={18} />}
                sub={`${(summary.totalGrossProfitMargin || 0).toFixed(1)}% margin`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`LKR ${fmt(summary.averageOrderValue || 0)}`}
                icon={<IconCurrencyDollar size={18} />}
              />
              <SummaryCard
                title="Shipping Total"
                value={`LKR ${fmt(summary.totalShipping)}`}
                icon={<IconTruckDelivery size={18} />}
              />
              <SummaryCard
                title="Total Discount"
                value={`LKR ${fmt(summary.totalDiscount)}`}
                icon={<IconPercentage size={18} />}
              />
            </div>

            {/* Charts Section */}
            {summary.daily && summary.daily.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  id="daily-sales-trend-chart"
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-xs space-y-4"
                >
                  <span className="text-[10px] uppercase font-bold tracking-widest text-text-sub font-mono block">
                    Daily Revenue Trend
                  </span>
                  <div className="h-[280px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.daily}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} width={60} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#1e293b",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                        />
                        <Line dataKey="sales" name="Total Revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-xs space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-text-sub font-mono block">
                    Daily Volume (Items Sold)
                  </span>
                  <div className="h-[280px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.daily}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} width={40} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#1e293b",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="itemsSold" name="Items" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table Container */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
                <Table loading={loading} pagination={false} className="pnl-table"
                  columns={columns}
                  dataSource={summary.daily || []}
                  rowKey={(record, index) => index as number}
                  scroll={{ x: 800 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DailySummaryPage;
