import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { SL_TIMEZONE } from "@/utils/dateUtils";
import { Card, Form, Spin, Table, Select, Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useEffect, useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconCoin,
  IconPackages,
  IconBusinessplan,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const StockValuationPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stockList, setStockList] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });

  const fetchStocksDropdown = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/stocks/dropdown");
      setStocksDropdown(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockValuation = async (values?: any) => {
    setLoading(true);
    const stockId = values?.stockId || "all";
    try {
      const res = await api.get("/api/v1/erp/reports/stocks/valuation", {
        params: { stockId },
      });
      setStockList(res.data.stock || []);
      setSummary(
        res.data.summary || {
          totalProducts: 0,
          totalQuantity: 0,
          totalValuation: 0,
        },
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load valuation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStocksDropdown();
      form.setFieldsValue({ stockId: "all" });
      fetchStockValuation(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const exportExcel = () => {
    if (!stockList.length) {
      toast("No data to export");
      return;
    }
    const data = stockList.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      Location: s.stockName,
      Quantity: s.quantity,
      "Buying Price (LKR)": s.buyingPrice.toFixed(2),
      "Valuation (LKR)": s.valuation.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Valuation");
    XLSX.writeFile(wb, `stock_valuation.xlsx`);
    toast.success("Excel exported!");
  };

  const exportPDF = async () => {
    if (!stockList.length) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Stock Valuation Report",
        subtitle: "Locked asset value based on latest cost prices",
        period: new Date().toLocaleString("en-LK", { timeZone: SL_TIMEZONE }),
        summaryItems: [
          {
            label: "Total Unique Products",
            value: summary.totalProducts.toLocaleString(),
          },
          {
            label: "Total Units",
            value: summary.totalQuantity.toLocaleString(),
          },
          {
            label: "Total Valuation",
            value: `LKR ${fmt(summary.totalValuation)}`,
          },
        ],
        tables: [
          {
            title: "Inventory Valuation Details",
            columns: [
              "Product",
              "Variant",
              "Size",
              "Location",
              "Qty",
              "Buying Price (LKR)",
              "Valuation (LKR)",
            ],
            rows: stockList.map((s) => [
              String(s.productName),
              String(s.variantName),
              String(s.size || "-"),
              String(s.stockName),
              String(s.quantity),
              fmt(s.buyingPrice),
              fmt(s.valuation),
            ]),
            boldCols: [0],
            greenCols: [6],
          },
        ],
        filename: "stock_valuation",
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Product",
      key: "product",
      render: (_, r) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{r.productName}</p>
          <p className="text-[10px] text-gray-400 font-mono">{r.productId}</p>
        </div>
      ),
    },
    {
      title: "Variant",
      key: "variant",
      render: (_, r) => (
        <div>
          <p className="font-medium text-gray-700 text-sm">{r.variantName}</p>
          <p className="text-[10px] text-gray-400 font-mono">{r.variantId}</p>
        </div>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (v) => (
        <Tag className="font-mono text-xs text-gray-600 m-0">{v || "—"}</Tag>
      ),
    },
    {
      title: "Location",
      key: "stockName",
      render: (_, r) => (
        <span className="text-gray-600 text-sm font-medium">{r.stockName}</span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (v) => (
        <Tag className="font-mono text-[10px] font-bold m-0">{v}</Tag>
      ),
    },
    {
      title: "Cost Price",
      dataIndex: "buyingPrice",
      key: "buyingPrice",
      align: "right",
      render: (v) => (
        <span className="font-mono text-red-500">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Valuation",
      dataIndex: "valuation",
      key: "valuation",
      align: "right",
      render: (v) => (
        <span className="font-bold font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          LKR {fmt(v)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Stock Valuation Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Inventory Analysis
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Stock Valuation
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Locked asset value based on latest cost prices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchStockValuation}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="stockId" className="mb-0! min-w-[200px]">
                  <Select
                    options={[
                      { value: "all", label: "All Stocks" },
                      ...stocksDropdown.map((s) => ({
                        value: s.id,
                        label: s.label,
                      })),
                    ]}
                  />
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
              <Button
                onClick={exportExcel}
                disabled={!stockList.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={exportPDF}
                disabled={!stockList.length}
                icon={<IconFileTypePdf size={16} />}
                danger
              >
                PDF
              </Button>
            </Space>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-indigo-50">
                  <span className="text-indigo-700">
                    <IconPackages size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Assets (SKUs)
                </p>
                <p className="text-2xl font-black tracking-tight text-indigo-700 leading-none">
                  {summary.totalProducts.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50">
                  <span className="text-blue-700">
                    <IconBusinessplan size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Unit Volume
                </p>
                <p className="text-2xl font-black tracking-tight text-blue-700 leading-none">
                  {summary.totalQuantity.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border flex flex-col justify-end border-emerald-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                  <IconCoin size={150} />
                </div>
                <p className="text-[12px] font-black uppercase tracking-wider text-emerald-600 mb-2 relative z-10">
                  Total Inventory Valuation
                </p>
                <p className="text-4xl font-black tracking-tight text-emerald-800 leading-none relative z-10">
                  LKR {fmt(summary.totalValuation)}
                </p>
              </div>
            </div>

            {/* Table */}
            {stockList.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Valuation Breakdown
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      Asset cost distribution by variant
                    </p>
                  </div>
                  <Tag
                    color="success"
                    className="text-[10px] font-bold uppercase border-0 bg-emerald-100 text-emerald-700"
                  >
                    LKR BASE
                  </Tag>
                </div>
                <Table
                  columns={columns}
                  dataSource={stockList}
                  rowKey={(r) =>
                    r.productId + r.variantId + r.stockId + Math.random()
                  }
                  pagination={{
                    pageSize: 15,
                    position: ["bottomRight"],
                    showSizeChanger: true,
                  }}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default StockValuationPage;
