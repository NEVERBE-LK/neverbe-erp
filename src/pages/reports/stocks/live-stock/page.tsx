import { Card, Form, Spin, Table, Select, Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { IconFilter, IconFileTypePdf, IconPackages, IconBox, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { SL_TIMEZONE } from "@/utils/dateUtils";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";

export interface LiveStockItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string;
  stockId: string;
  stockName: string;
  quantity: number;
}

const LiveStockPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<LiveStockItem[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
  });

  const fetchStocksDropdown = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/stocks/dropdown");
      setStocksDropdown([
        { id: "all", label: "All Stocks" },
        ...(res.data || []),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStock = async (values?: { stockId: string }) => {
    setLoading(true);
    const stockId = values?.stockId || "all";
    try {
      const res = await api.get("/api/v1/erp/reports/stocks/live-stock", {
        params: { stockId },
      });
      const allStock: LiveStockItem[] = res.data.stock || [];
      setStock(allStock);
      setSummary(
        res.data.summary || {
          totalProducts: allStock.length,
          totalQuantity: allStock.reduce((acc, s) => acc + s.quantity, 0),
        },
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load live stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStocksDropdown();
      form.setFieldsValue({ stockId: "all" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const exportExcel = () => {
    if (!stock.length) {
      toast("No data to export");
      return;
    }
    const data = stock.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock Location": s.stockName,
      Quantity: s.quantity,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Live Stock");
    XLSX.writeFile(wb, `live_stock.xlsx`);
    toast.success("Excel exported!");
  };

  const exportPDF = async () => {
    if (!stock.length) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Live Stock Report",
        subtitle: "Current inventory levels across all locations",
        period: new Date().toLocaleString("en-LK", { timeZone: SL_TIMEZONE }),
        summaryItems: [
          {
            label: "Total Products",
            value: summary.totalProducts.toLocaleString(),
          },
          {
            label: "Total Units in Stock",
            value: summary.totalQuantity.toLocaleString(),
          },
        ],
        tables: [
          {
            title: "Inventory Stock Levels",
            columns: ["Product", "Variant", "Size", "Location", "Quantity"],
            rows: stock.map((s) => [
              s.productName,
              s.variantName,
              s.size || "-",
              s.stockName,
              String(s.quantity),
            ]),
            boldCols: [0],
            greenCols: [],
          },
        ],
        filename: "live_stock",
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<LiveStockItem> = [
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
      align: "right",
      render: (v) => (
        <span className="font-bold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
          {v}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Live Stock Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Inventory Reports
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Live Stock
                </h2>
                
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchStock}
                className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto"
              >
                <Form.Item name="stockId" className="mb-0! min-w-[200px]">
                  <Select
                    options={stocksDropdown.map((s) => ({
                      value: s.id,
                      label: s.label,
                    }))}
                    placeholder="Select Location"
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
              <button
              onClick={exportExcel} disabled={!stock.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={exportPDF} disabled={!stock.length}
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

        {!loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-teal-50">
                  <span className="text-teal-700">
                    <IconPackages size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total SKUs
                </p>
                <p className="text-2xl font-black tracking-tight text-teal-700 leading-none">
                  {summary.totalProducts.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50">
                  <span className="text-blue-700">
                    <IconBox size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Quantity
                </p>
                <p className="text-2xl font-black tracking-tight text-blue-700 leading-none">
                  {summary.totalQuantity.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Table */}
            {stock.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Inventory Items
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {stock.length} SKUs found
                    </p>
                  </div>
                </div>
                <Table pagination={false}
                  columns={columns}
                  dataSource={stock}
                  rowKey={(r) =>
                    r.productId + r.variantId + r.stockId + Math.random()
                  }
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

export default LiveStockPage;
