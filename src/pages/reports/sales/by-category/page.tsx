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
import { IconFilter, IconFileTypePdf, IconShoppingCart, IconTrendingUp, IconPackages, IconCurrencyDollar, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#E5E7EB",
];

const SalesByCategoryPage = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const totalSales = categories.reduce(
    (sum, c) => sum + (c.totalSales || 0),
    0,
  );
  const totalNetSales = categories.reduce(
    (sum, c) => sum + (c.totalNetSales || 0),
    0,
  );
  const totalProfit = categories.reduce(
    (sum, c) => sum + (c.totalGrossProfit || 0),
    0,
  );
  const totalQuantity = categories.reduce(
    (sum, c) => sum + (c.totalQuantity || 0),
    0,
  );
  const totalOrders = categories.reduce(
    (sum, c) => sum + (c.totalOrders || 0),
    0,
  );

  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM-DD") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM-DD") || dateRange[1];
    const status = values?.status || "Paid";

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-category", {
        params: { from, to, status },
      });
      setCategories(res.data.categories || []);
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
        dateRange: [dayjs(dateRange[0]), dayjs(dateRange[1])],
        status: "Paid",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const exportExcel = () => {
    if (!categories.length) return;

    const exportData = categories.map((c) => ({
      Category: c.category,
      "Total Orders": c.totalOrders,
      "Total Quantity Sold": c.totalQuantity,
      "Total Sales (Rs)": c.totalSales.toFixed(2),
      "Total Net Sale": c.totalNetSales.toFixed(2),
      "Total COGS (Rs)": (c.totalCOGS || 0).toFixed(2),
      "Total Profit (Rs)": (c.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (c.grossProfitMargin || 0).toFixed(2),
      "Total Discount (Rs)": c.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales by Category");
    XLSX.writeFile(
      wb,
      `sales_by_category_${dateRange[0]}_${dateRange[1]}.xlsx`,
    );
  };

  const handleExportPDF = async () => {
    if (!categories.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Sales by Category",
        subtitle: "Sales performance breakdown by product category",
        period: `${dateRange[0]} – ${dateRange[1]}`,
        summaryItems: [
          { label: "Total Catégories", value: String(categories.length) },
          { label: "Total Quantity", value: totalQuantity.toLocaleString() },
          { label: "Total Sales", value: `LKR ${fmt(totalSales)}` },
          { label: "Total Profit", value: `LKR ${fmt(totalProfit)}` },
        ],
        chartSpecs: [
          { title: "Sales Comparison", elementId: "sales-comparison-chart" },
        ],
        tables: [
          {
            title: "Category Breakdown",
            columns: [
              "Category",
              "Orders",
              "Qty",
              "Net Sales",
              "Profit",
              "Margin",
            ],
            rows: categories.map((c: any) => [
              c.category,
              String(c.totalOrders),
              String(c.totalQuantity),
              fmt(c.totalNetSales),
              fmt(c.totalGrossProfit || 0),
              `${(c.grossProfitMargin || 0).toFixed(1)}%`,
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `sales_by_category_${dateRange[0]}_${dateRange[1]}`,
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
  const columns: ColumnsType<any> = [
    {
      title: "Category",
      key: "category",
      render: (_, c) => (
        <span className="font-semibold text-gray-900">{c.category}</span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, c) => (
        <Tag className="font-mono text-[10px] font-bold m-0">
          {c.totalOrders}
        </Tag>
      ),
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "right",
      render: (_, c) => (
        <span className="font-medium text-gray-900">{c.totalQuantity}</span>
      ),
    },
    {
      title: (
        <AntdTooltip title="Sum of product selling prices. Excludes order-level shipping fees.">
          <span>Sales</span>
        </AntdTooltip>
      ),
      key: "sales",
      align: "right",
      render: (_, c) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(c.totalSales || 0)}
        </span>
      ),
    },
    {
      title: (
        <AntdTooltip title="Product sales minus allocated item discounts and transaction fees. Excludes shipping fees.">
          <span>Net Sale</span>
        </AntdTooltip>
      ),
      key: "netSale",
      align: "right",
      render: (_, c) => (
        <span className="text-gray-700 font-mono text-xs">
          LKR {fmt(c.totalNetSales || 0)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, c) => (
        <span className="text-red-500 font-mono text-xs">
          (LKR {fmt(c.totalCOGS || 0)})
        </span>
      ),
    },
    {
      title: "Profit",
      key: "profit",
      align: "right",
      render: (_, c) => (
        <span
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${c.totalGrossProfit >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
        >
          {c.totalGrossProfit < 0 ? "(" : ""}LKR{" "}
          {fmt(Math.abs(c.totalGrossProfit || 0))}
          {c.totalGrossProfit < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, c) => (
        <span className="text-gray-600">
          {(c.grossProfitMargin || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, c) => (
        <span className="text-red-500">
          Rs {(c.totalDiscount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales by Category">
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
                  Sales by Category
                </h2>
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
              onClick={exportExcel} disabled={!categories.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={handleExportPDF} disabled={!categories.length}
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
        {!loading && categories.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Orders"
                value={totalOrders.toLocaleString()}
                icon={<IconShoppingCart size={20} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Sales"
                value={`LKR ${fmt(totalSales)}`}
                sub="Product sales only"
                icon={<IconTrendingUp size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(totalNetSales)}`}
                sub="Excl. shipping fees"
                icon={<IconTrendingUp size={20} />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Total Quantity"
                value={totalQuantity.toLocaleString()}
                icon={<IconPackages size={20} />}
                color="text-amber-600"
                bg="bg-amber-50"
              />
              <SummaryCard
                title="Gross Profit"
                value={`LKR ${fmt(totalProfit)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                id="sales-comparison-chart"
                className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Sales Comparison
                </p>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f3f4f6"
                      />
                      <XAxis
                        dataKey="category"
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
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                        cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#111827"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalNetSales"
                        name="Net Sale"
                        fill="#059669"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDiscount"
                        name="Discount"
                        fill="#DC2626"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-xl shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Quantity Distribution
                </p>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="totalQuantity"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Category Metrics Details
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {categories.length} entries
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
                dataSource={categories}
                rowKey={(r: any) => r.category}
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

export default SalesByCategoryPage;
