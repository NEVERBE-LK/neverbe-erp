import {
  Card,
  Form,
  Spin,
  Table,
  Tag,
  DatePicker,
  Button,
  Space,
  Progress,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { IconFilter, IconFileTypePdf, IconTrendingUp, IconBusinessplan, IconPackages, IconReceipt2, IconFileSpreadsheet } from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const COLORS = [
  "#111827",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
];

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const SalesByBrandPage = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

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
    if (!fromDate || !toDate) {
      toast("Please select a date range");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from: fromDate, to: toDate },
      });
      const data = res.data.brands || [];
      setBrands(data);

      if (data.length > 0) {
        setSummary({
          totalSales: data.reduce(
            (sum: number, b: any) => sum + (b.totalSales || 0),
            0,
          ),
          totalNetSales: data.reduce(
            (sum: number, b: any) => sum + (b.totalNetSales || 0),
            0,
          ),
          totalProfit: data.reduce(
            (sum: number, b: any) => sum + (b.totalGrossProfit || 0),
            0,
          ),
          totalQuantity: data.reduce(
            (sum: number, b: any) => sum + (b.totalQuantity || 0),
            0,
          ),
          totalOrders: data.reduce(
            (sum: number, b: any) => sum + (b.totalOrders || 0),
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

  const exportExcel = async () => {
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from, to, page: 1, size: 1000 },
      });
      const allBrands = res.data.brands || [];
      if (!allBrands.length) {
        toast("No data to export");
        return;
      }

      const exportData = allBrands.map((b: any) => ({
        Brand: b.brand,
        "Quantity Sold": b.totalQuantity,
        "Total Sales (LKR)": b.totalSales.toFixed(2),
        "Net Sales (LKR)": b.totalNetSales.toFixed(2),
        "COGS (LKR)": (b.totalCOGS || 0).toFixed(2),
        "Gross Profit (LKR)": (b.totalGrossProfit || 0).toFixed(2),
        "Margin (%)": (b.grossProfitMargin || 0).toFixed(2),
        "Discount (LKR)": b.totalDiscount.toFixed(2),
        Orders: b.totalOrders,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales by Brand");
      XLSX.writeFile(wb, `sales_by_brand_${from}_${to}.xlsx`);
      toast.success("Excel exported!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  };

  const handleExportPDF = async () => {
    if (!brands.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Sales by Brand",
        subtitle: "Sales performance breakdown by brand",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Brands", value: String(brands.length) },
          {
            label: "Total Quantity",
            value: summary.totalQuantity.toLocaleString(),
          },
          { label: "Total Sales", value: `LKR ${fmt(summary.totalSales)}` },
          { label: "Total Profit", value: `LKR ${fmt(summary.totalProfit)}` },
        ],
        chartSpecs: [
          {
            title: "Sales & Profit by Brand",
            elementId: "brand-sales-profit-chart",
          },
        ],
        tables: [
          {
            title: "Brand Breakdown",
            columns: [
              "Brand",
              "Orders",
              "Qty",
              "Net Sales",
              "Profit",
              "Margin",
            ],
            rows: brands.map((b: any) => [
              b.brand || "Unknown",
              String(b.totalOrders),
              String(b.totalQuantity),
              fmt(b.totalNetSales),
              fmt(b.totalGrossProfit || 0),
              `${(b.grossProfitMargin || 0).toFixed(1)}%`,
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `sales_by_brand_${from}_${to}`,
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
    progress,
  }: {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    progress?: {
      percent: number;
      label: string;
      value: string;
    };
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
      title: "Brand",
      key: "brand",
      render: (_, b) => (
        <span className="font-bold text-gray-900">{b.brand || "Unknown"}</span>
      ),
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "center",
      render: (_, b) => (
        <Tag className="font-mono text-[10px] font-bold m-0">
          {b.totalQuantity}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="Sum of product selling prices. Excludes order-level shipping fees.">
          <span>Total Sales</span>
        </Tooltip>
      ),
      key: "sales",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-blue-700">
          LKR {fmt(b.totalSales || 0)}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="Product sales minus transaction fees. Excludes shipping fees.">
          <span>Net Sales</span>
        </Tooltip>
      ),
      key: "netSale",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-gray-700">
          LKR {fmt(b.totalNetSales || 0)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-red-500">
          (LKR {fmt(b.totalCOGS || 0)})
        </span>
      ),
    },
    {
      title: "Gross Profit",
      key: "profit",
      align: "right",
      render: (_, b) => (
        <span
          className={`font-mono font-semibold ${b.totalGrossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {b.totalGrossProfit < 0 ? "(" : ""}LKR{" "}
          {fmt(Math.abs(b.totalGrossProfit || 0))}
          {b.totalGrossProfit < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, b) => (
        <Tag
          color={b.grossProfitMargin >= 0 ? "success" : "error"}
          className="font-mono text-[10px] m-0 font-bold"
        >
          {(b.grossProfitMargin || 0).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-red-500 text-xs">
          LKR {fmt(b.totalDiscount || 0)}
        </span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "center",
      render: (_, b) => (
        <span className="font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded text-[10px]">
          {b.totalOrders}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales by Brand">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Sales Analysis
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Sales by Brand
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
                  <DatePicker.RangePicker />
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
              onClick={exportExcel} disabled={!brands.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={handleExportPDF} disabled={!brands.length}
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

        {!loading && summary && brands.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Brand Sales"
                value={`LKR ${fmt(summary.totalSales)}`}
                sub="Product sales only"
                icon={<IconTrendingUp size={20} />}
                color="text-blue-700"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Brand Profit"
                value={`LKR ${fmt(summary.totalProfit)}`}
                sub="Excl. shipping fees"
                icon={<IconBusinessplan size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
                progress={{
                  percent:
                    (summary.totalProfit / summary.totalSales) * 100 || 0,
                  label: "Avg Margin",
                  value: `${((summary.totalProfit / summary.totalSales) * 100 || 0).toFixed(1)}%`,
                }}
              />
              <SummaryCard
                title="Total Qty Sold"
                value={summary.totalQuantity.toLocaleString()}
                icon={<IconPackages size={20} />}
                color="text-indigo-700"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Total Orders"
                value={summary.totalOrders.toLocaleString()}
                icon={<IconReceipt2 size={20} />}
                color="text-gray-900"
                bg="bg-gray-50"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                id="brand-sales-profit-chart"
                className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Sales & Profit by Brand
                </p>
                <div className="h-[320px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brands.slice(0, 10)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis
                        dataKey="brand"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        tickMargin={10}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        width={60}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        width={40}
                      />
                      <RechartTooltip
                        {...TOOLTIP_STYLE}
                        formatter={(v: number, name: string) => [
                          name.includes("Margin")
                            ? `${v.toFixed(1)}%`
                            : `LKR ${fmt(v)}`,
                          name,
                        ]}
                        cursor={{ fill: "#F9FAFB" }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalGrossProfit"
                        name="Gross Profit"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Quantity Distribution (Top 10)
                </p>
                <div className="h-[320px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brands.slice(0, 10)}
                        dataKey="totalQuantity"
                        nameKey="brand"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {brands.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartTooltip {...TOOLTIP_STYLE} />
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
                    Brand Performance
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {brands.length} Brands found
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
                dataSource={brands}
                rowKey={(r: any) => r.brand || Math.random()}
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

export default SalesByBrandPage;
