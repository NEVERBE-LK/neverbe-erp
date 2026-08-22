import api from "@/lib/api";
import {
  Card,
  Form,
  Spin,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
  Tooltip as AntdTooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { IconFilter, IconFileTypePdf, IconShoppingCart, IconTrendingUp, IconPackages, IconPercentage, IconCurrencyDollar, IconTruckDelivery, IconFileSpreadsheet } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
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

const Page = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  // Initialize with last 5 years
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(4, "year").format("YYYY"),
    dayjs().format("YYYY"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY") || dateRange[1];
    const status = values?.status || "Paid";

    if (!from || !to) return;
    setDateRange([from, to]);
    setLoading(true);
    try {
      // Convert to full date strings for the API
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await api.get("/api/v1/erp/reports/sales/yearly-summary", {
        params: { from: fromDate, to: toDate, status },
      });
      setSummary(res.data.summary || null);
    } catch (e: any) {
      console.error(e);
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
        dateRange: [dayjs(dateRange[0], "YYYY"), dayjs(dateRange[1], "YYYY")],
        status: "Paid",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!summary?.yearly || summary.yearly.length === 0) return;

    const exportData: any[] = [];
    summary.yearly.forEach((y: any) => {
      exportData.push({
        Year: y.year,
        "Total Orders": y.orders,
        "Total Revenue (Rs)": y.sales.toFixed(2),
        "Total Net Sales": y.netSales.toFixed(2),
        "Total COGS (Rs)": (y.cogs || 0).toFixed(2),
        "Total Gross Profit (Rs)": (y.grossProfit || 0).toFixed(2),
        "Gross Profit Margin (%)": (y.grossProfitMargin || 0).toFixed(2),
        "Avg Order Value (Rs)": (y.averageOrderValue || 0).toFixed(2),
        "Shipping (Rs)": y.shipping.toFixed(2),
        "Discount (Rs)": y.discount.toFixed(2),
        "Transaction Fee (Rs)": y.transactionFee.toFixed(2),
        "Items Sold": y.itemsSold,
      });
      y.monthly.forEach((m: any) => {
        exportData.push({
          Year: y.year,
          Month: m.month,
          "Total Orders": m.orders,
          "Total Revenue (Rs)": m.sales.toFixed(2),
          "Total Net Sales": m.netSales.toFixed(2),
          "Total COGS (Rs)": (m.cogs || 0).toFixed(2),
          "Total Gross Profit (Rs)": (m.grossProfit || 0).toFixed(2),
          "Gross Profit Margin (%)": (m.grossProfitMargin || 0).toFixed(2),
          "Avg Order Value (Rs)": (m.averageOrderValue || 0).toFixed(2),
          "Shipping (Rs)": m.shipping.toFixed(2),
          "Discount (Rs)": m.discount.toFixed(2),
          "Transaction Fee (Rs)": m.transactionFee.toFixed(2),
          "Items Sold": m.itemsSold,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Summary");
    XLSX.writeFile(wb, `yearly_summary_${dateRange[0]}_${dateRange[1]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!summary?.yearly?.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      const rows: any[] = [];
      summary.yearly.forEach((y: any) => {
        rows.push([
          `Year: ${y.year}`,
          String(y.orders),
          fmt(y.netSales),
          fmt(y.cogs || 0),
          fmt(y.grossProfit || 0),
          String(y.itemsSold),
        ]);
        if (y.monthly) {
          y.monthly.forEach((m: any) => {
            rows.push([
              `  ${m.month}`,
              String(m.orders),
              fmt(m.netSales),
              fmt(m.cogs || 0),
              fmt(m.grossProfit || 0),
              String(m.itemsSold),
            ]);
          });
        }
      });

      await exportReportPDF({
        title: "Yearly Sales Summary",
        subtitle: "Multi-year revenue and performance breakdown",
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
          {
            title: "Yearly Sales Trend",
            elementId: "yearly-sales-trend-chart",
          },
        ],
        tables: [
          {
            title: "Performance Breakdown",
            columns: [
              "Period",
              "Orders",
              "Net Sales",
              "COGS",
              "Profit",
              "Items",
            ],
            rows: rows,
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `yearly_sales_summary_${dateRange[0]}_${dateRange[1]}`,
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
    <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-sub dark:text-slate-400">
          {title}
        </span>
        <span className={`p-1.5 rounded-lg ${bg || "bg-gray-100"} ${color}`}>
          {icon}
        </span>
      </div>
      <p className={`text-lg font-mono font-bold ${color} leading-none mb-1`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-text-sub dark:text-slate-500 mt-1 font-mono">{sub}</p>
      )}
    </div>
  );

  const dataSource = (summary?.yearly || []).map((y: any) => ({
    ...y,
    key: `year-${y.year}`,
    isYear: true,
    children: y.monthly
      ? y.monthly.map((m: any) => ({
          ...m,
          key: `month-${y.year}-${m.month}`,
          isYear: false,
        }))
      : undefined,
  }));

  const columns: ColumnsType<any> = [
    {
      title: "Year/Month",
      dataIndex: "period",
      key: "period",
      render: (_, record) => (
        <span
          className={`font-medium ${record.isYear ? "text-gray-900" : "text-gray-600 pl-4"}`}
        >
          {record.isYear ? `${record.year} (Total)` : record.month}
        </span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "right",
      render: (text) => (
        <Tag className="font-mono text-[10px] font-bold m-0">{text}</Tag>
      ),
    },
    {
      title: (
        <AntdTooltip title="Total cash received from orders (including shipping charges)">
          <span>Total Revenue</span>
        </AntdTooltip>
      ),
      dataIndex: "sales",
      key: "sales",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(val || 0)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "netSales",
      key: "netSales",
      align: "right",
      render: (val) => (
        <span className="text-gray-700 font-mono text-xs">
          LKR {fmt(val || 0)}
        </span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      key: "cogs",
      align: "right",
      render: (val) => (
        <span className="text-red-500 font-mono text-xs">
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
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${val >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
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
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Shipping",
      dataIndex: "shipping",
      key: "shipping",
      align: "right",
      render: (val) => (
        <span className="text-gray-500 font-mono text-xs">
          LKR {fmt(val || 0)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Yearly Sales Report"
      description="Yearly Sales Summary"
    >
      <div className="w-full space-y-8">
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
                  Yearly Summary
                </h2>
                {dateRange?.[0] && dateRange?.[1] && (
                  <span className="whitespace-nowrap flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                    {dateRange[0]} to {dateRange[1]}
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
                  <DatePicker.RangePicker allowClear={false} picker="year" />
                </Form.Item>
                <Form.Item name="status" className="mb-0! w-32">
                  <Select>
                    <Select.Option value="Paid">Paid</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Refunded">Refunded</Select.Option>
                    <Select.Option value="all">All</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Space>
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<IconFilter size={15} />}
                    >
                      Filter
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Space>
              <button
              onClick={handleExportExcel} disabled={!summary?.yearly?.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={handleExportPDF} disabled={!summary?.yearly?.length}
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
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && summary && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Orders"
                value={summary.totalOrders.toLocaleString()}
                icon={<IconShoppingCart size={20} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Revenue"
                value={`LKR ${fmt(summary.totalSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(summary.totalNetSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Items Sold"
                value={summary.totalItemsSold.toLocaleString()}
                icon={<IconPackages size={20} />}
                color="text-amber-600"
                bg="bg-amber-50"
              />
              <SummaryCard
                title="Gross Profit"
                value={`LKR ${fmt(summary.totalGrossProfit || 0)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
                sub={`${(summary.totalGrossProfitMargin || 0).toFixed(1)}% margin`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`LKR ${fmt(summary.averageOrderValue || 0)}`}
                icon={<IconCurrencyDollar size={20} />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <SummaryCard
                title="Shipping Total"
                value={`LKR ${fmt(summary.totalShipping)}`}
                icon={<IconTruckDelivery size={20} />}
                color="text-gray-500"
                bg="bg-gray-50"
              />
              <SummaryCard
                title="Total Discount"
                value={`LKR ${fmt(summary.totalDiscount)}`}
                icon={<IconPercentage size={20} />}
                color="text-red-500"
                bg="bg-red-50"
              />
            </div>

            {/* Charts Section */}
            {summary.yearly && summary.yearly.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div
                    id="yearly-sales-trend-chart"
                    className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm"
                  >
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                      Yearly Sales Trend
                    </p>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="year"
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
                          <Line
                            type="monotone"
                            dataKey="sales"
                            name="Total Revenue"
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#1976d2", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#1976d2" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                      Yearly Net Sales
                    </p>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="year"
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
                          <Line
                            type="monotone"
                            dataKey="netSales"
                            name="Net Sales"
                            stroke="#FF5722"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#FF5722", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#FF5722" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                    Items Sold Per Year
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          allowDecimals={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "none",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                        />
                        <Bar
                          dataKey="itemsSold"
                          name="Items"
                          fill="#1976d2"
                          radius={[2, 2, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Yearly & Monthly Table */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Yearly Subtotals
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {summary.yearly?.length} entries
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
                dataSource={dataSource}
                scroll={{ x: "max-content" }}
                expandable={{
                  defaultExpandAllRows: true, // You may choose false for better initial UX if there's a lot of data
                }}
                size="small"
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Page;
