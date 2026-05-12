import {
  Card,
  Form,
  Spin,
  Table,
  Select,
  InputNumber,
  Button,
  Space,
  Tag,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconAlertTriangle,
  IconPackages,
  IconCoin,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { SL_TIMEZONE } from "@/utils/dateUtils";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const LowStockPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });
  const { currentUser } = useAppSelector((state) => state.authSlice);

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

  const fetchStock = async (values?: any) => {
    setLoading(true);
    const threshold = values?.threshold || 10;
    const stockId = values?.stockId || "all";
    try {
      const res = await api.get("/api/v1/erp/reports/stocks/low-stock", {
        params: { threshold, stockId },
      });
      const data = res.data.stock || [];
      setStock(data);
      setSummary({
        totalProducts: data.length,
        totalQuantity: data.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0,
        ),
        totalValuation: data.reduce(
          (sum: number, s: any) => sum + (s.buyingPrice || 0) * s.quantity,
          0,
        ),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load low stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStocksDropdown();
      form.setFieldsValue({ threshold: 10, stockId: "all" });
      fetchStock(form.getFieldsValue());
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
      Location: s.stockName,
      Quantity: s.quantity,
      Threshold: s.threshold,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Low Stock");
    XLSX.writeFile(wb, `low_stock.xlsx`);
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
        title: "Low Stock Alerts",
        subtitle: "Products and variants falling below critical limits",
        period: new Date().toLocaleString("en-LK", { timeZone: SL_TIMEZONE }),
        summaryItems: [
          {
            label: "Critical SKUs",
            value: Number(stock.length).toLocaleString(),
          },
        ],
        tables: [
          {
            title: "Items Below Threshold",
            columns: [
              "Product",
              "Variant",
              "Size",
              "Location",
              "Threshold",
              "Quantity",
            ],
            rows: stock.map((s) => [
              String(s.productName),
              String(s.variantName),
              String(s.size || "-"),
              String(s.stockName),
              String(s.threshold),
              String(s.quantity),
            ]),
            boldCols: [0],
            redCols: [5],
            greenCols: [],
          },
        ],
        filename: "low_stock_alerts",
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
      title: "Threshold",
      dataIndex: "threshold",
      key: "threshold",
      align: "center",
      render: (v) => <Tag className="font-mono text-xs m-0">{v}</Tag>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (v, r) => {
        const pct = r.threshold > 0 ? (v / r.threshold) * 100 : 0;
        return (
          <div className="flex flex-col items-end gap-1 w-24 ml-auto">
            <span className="font-bold text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">
              {v}
            </span>
            <Progress
              percent={pct}
              size="small"
              showInfo={false}
              strokeColor="#ef4444"
              trailColor="#fee2e2"
              className="m-0"
            />
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Low Stock Alerts">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-red-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Inventory Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Low Stock Alerts
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Products and variants falling below critical limits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card
              size="small"
              className="shadow-sm w-full xl:w-auto border-red-100"
            >
              <Form
                form={form}
                layout="inline"
                onFinish={fetchStock}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="threshold" className="mb-0!">
                  <InputNumber
                    min={0}
                    placeholder="Limit <"
                    className="w-[100px]"
                  />
                </Form.Item>
                <Form.Item name="stockId" className="mb-0! min-w-[150px]">
                  <Select
                    options={stocksDropdown.map((s) => ({
                      value: s.id,
                      label: s.label,
                    }))}
                    placeholder="Location"
                  />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Button
                    htmlType="submit"
                    type="primary"
                    danger
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
                disabled={!stock.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={exportPDF}
                disabled={!stock.length}
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
              <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5">
                  <IconAlertTriangle size={100} />
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-red-50 relative z-10">
                  <span className="text-red-600">
                    <IconAlertTriangle size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 relative z-10">
                  Low SKUs
                </p>
                <p className="text-2xl font-black tracking-tight text-red-600 leading-none relative z-10">
                  {summary.totalProducts.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50">
                  <span className="text-orange-600">
                    <IconPackages size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Items at Risk Count
                </p>
                <p className="text-2xl font-black tracking-tight text-orange-600 leading-none">
                  {summary.totalQuantity.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-gray-50">
                  <span className="text-gray-700">
                    <IconCoin size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Locked Value Estimate
                </p>
                <p className="text-2xl font-black tracking-tight text-gray-900 leading-none">
                  LKR {fmt(summary.totalValuation)}
                </p>
              </div>
            </div>

            {/* Table */}
            {stock.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-red-50 flex items-center justify-between bg-red-50/30">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                      Critical Items
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {stock.length} SKUs require attention
                    </p>
                  </div>
                </div>
                <Table
                  columns={columns}
                  dataSource={stock}
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

export default LowStockPage;
