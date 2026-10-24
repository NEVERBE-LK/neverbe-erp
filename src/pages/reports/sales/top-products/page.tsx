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
  Progress,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { IconFilter, IconFileTypePdf, IconShoppingCart, IconTrendingUp, IconPackages, IconCurrencyDollar, IconFileSpreadsheet } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
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

const TopSellingProductsPage = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [threshold] = useState("");

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
      const res = await api.get("/api/v1/erp/reports/sales/top-products", {
        params: { from, to, threshold, status },
      });

      const fetchedProducts: any[] = res.data.topProducts || [];
      setProducts(fetchedProducts);

      if (fetchedProducts.length > 0) {
        setSummary({
          totalQuantity: fetchedProducts.reduce(
            (sum, p) => sum + p.totalQuantity,
            0,
          ),
          totalSales: fetchedProducts.reduce((sum, p) => sum + p.totalSales, 0),
          totalProfit: fetchedProducts.reduce(
            (sum, p) => sum + (p.totalGrossProfit || 0),
            0,
          ),
          totalNetSales: fetchedProducts.reduce(
            (sum, p) => sum + (p.totalNetSales || 0),
            0,
          ),
        });
      } else {
        setSummary(null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.error || e.message || "Failed to fetch top products",
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

  const handleExportPDF = async () => {
    if (!products.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Top Selling Products",
        subtitle: "Best performing products by quantity and sales",
        period: `${dateRange[0]} – ${dateRange[1]}`,
        summaryItems: [
          { label: "Items Listed", value: String(products.length) },
          { label: "Total Qty Sold", value: String(summary.totalQuantity) },
          { label: "Total Sale", value: `LKR ${fmt(summary.totalSales)}` },
          { label: "Total Profit", value: `LKR ${fmt(summary.totalProfit)}` },
        ],
        tables: [
          {
            title: "Product Breakdown",
            columns: ["Product", "Qty", "Net Sales", "Profit", "Margin"],
            rows: products.map((p: any) => [
              `${p.name}\n${p.variantName || ""}`,
              String(p.totalQuantity),
              fmt(p.totalNetSales),
              fmt(p.totalGrossProfit || 0),
              `${(p.grossProfitMargin || 0).toFixed(1)}%`,
            ]),
            boldCols: [0],
            greenCols: [3],
          },
        ],
        filename: `top_selling_products_${dateRange[0]}_${dateRange[1]}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const exportExcel = () => {
    if (!products.length) return;

    const exportData = products.map((p) => ({
      "Product ID": p.productId,
      Name: p.name,
      "Variant Name": p.variantName,
      "Total Quantity Sold": p.totalQuantity,
      "Total Sales (LKR)": p.totalSales.toFixed(2),
      "Total Net Sale": p.totalNetSales.toFixed(2),
      "Total COGS (LKR)": (p.totalCOGS || 0).toFixed(2),
      "Total Profit (LKR)": (p.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (p.grossProfitMargin || 0).toFixed(2),
      "Total Discount (LKR)": p.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Selling Products");
    XLSX.writeFile(
      wb,
      `top_selling_products_${dateRange[0]}_${dateRange[1]}.xlsx`,
    );
    toast.success("Excel exported!");
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
      title: "Product ID",
      key: "productID",
      render: (_, p) => (
        <span className="text-gray-400 font-medium">
          {p.productId.toUpperCase()}
        </span>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_, p) => (
        <div>
          <p className="text-gray-900 font-semibold leading-tight">{p.name}</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            {p.variantName}
          </p>
        </div>
      ),
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "right",
      render: (_, p) => (
        <Tag className="font-mono text-[10px] font-bold m-0">
          {p.totalQuantity}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="Sum of product selling prices. Excludes order-level shipping fees.">
          <span>Sales</span>
        </Tooltip>
      ),
      key: "sales",
      align: "right",
      render: (_, p) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(p.totalSales || 0)}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="Product sales minus allocated item discounts and transaction fees. Excludes shipping fees.">
          <span>Net Sales</span>
        </Tooltip>
      ),
      key: "netSales",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-700 font-mono text-xs">
          LKR {fmt(p.totalNetSales || 0)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, p) => (
        <span className="text-red-500 font-mono text-xs">
          (LKR {fmt(p.totalCOGS || 0)})
        </span>
      ),
    },
    {
      title: "Profit",
      key: "profit",
      align: "right",
      render: (_, p) => (
        <span
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${p.totalGrossProfit >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
        >
          {p.totalGrossProfit < 0 ? "(" : ""}LKR{" "}
          {fmt(Math.abs(p.totalGrossProfit || 0))}
          {p.totalGrossProfit < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, p) => (
        <Tag
          color={(p.grossProfitMargin || 0) >= 0 ? "success" : "error"}
          className="font-mono text-[10px] font-bold m-0"
        >
          {(p.grossProfitMargin || 0).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer title="Top Selling Products">
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
                  Top Selling Products
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
              onClick={handleExportPDF} disabled={!products.length}
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
        {!loading && products.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Sold Qty"
                value={summary?.totalQuantity.toLocaleString() || 0}
                icon={<IconPackages size={20} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Sales"
                value={`LKR ${fmt(summary?.totalSales || 0)}`}
                sub="Product sales only"
                icon={<IconTrendingUp size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(summary?.totalNetSales || 0)}`}
                sub="Excl. shipping fees"
                icon={<IconCurrencyDollar size={20} />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Gross Profit"
                value={`LKR ${fmt(summary?.totalProfit || 0)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
              />
            </div>

            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Product Performance
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {products.length} products found
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
                dataSource={products}
                rowKey={(r: any) => r.productId + r.variantName}
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

export default TopSellingProductsPage;
