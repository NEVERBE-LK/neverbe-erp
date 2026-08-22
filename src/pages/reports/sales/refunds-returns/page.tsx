import { Card, Form, Spin, Table, Space, Button, Tag, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { IconFilter, IconFileTypePdf, IconReceiptRefund, IconPackages, IconHistory, IconTrendingUp, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

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

const RefundsReturnsReport = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    totalOrders: number;
    totalRefundAmount: number;
    totalRestockedItems: number;
    items: any[];
  } | null>(null);

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
      const res = await api.get("/api/v1/erp/reports/sales/refunds-returns", {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!report?.items?.length) return;

    const formatted = report.items.map((o: any) => ({
      "Order ID": o.orderId,
      Status: o.status,
      "Refund Amount (LKR)": o.refundAmount.toFixed(2),
      Restocked: o.restocked ? "Yes" : "No",
      "Restocked At": o.restockedAt || "-",
      "Created At": o.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refunds & Returns");
    XLSX.writeFile(wb, `refunds_returns_${from}_${to}.xlsx`);
    toast.success("Excel exported!");
  };

  const handleExportPDF = async () => {
    if (!report?.items?.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Refunds & Returns Report",
        subtitle: "Detailed breakdown of refund orders and restocking",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Orders", value: String(report.totalOrders) },
          {
            label: "Total Refund",
            value: `LKR ${fmt(report.totalRefundAmount)}`,
          },
          {
            label: "Restocked Items",
            value: String(report.totalRestockedItems),
          },
        ],
        tables: [
          {
            title: "Refund Entries",
            columns: ["Order ID", "Status", "Refund", "Restocked", "Date"],
            rows: report.items.map((o: any) => [
              o.orderId,
              o.status,
              fmt(o.refundAmount),
              o.restocked ? "Yes" : "No",
              o.createdAt,
            ]),
            boldCols: [0],
          },
        ],
        filename: `refunds_returns_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 text-xs font-bold  rounded-lg ${
            status === "Refunded"
              ? "bg-red-50 text-red-700"
              : status === "Returned"
                ? "bg-orange-50 text-orange-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Refund Amount",
      dataIndex: "refundAmount",
      key: "refundAmount",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-red-500 font-mono text-xs">
          (LKR {fmt(val || 0)})
        </span>
      ),
    },
    {
      title: "Restocked",
      dataIndex: "restocked",
      key: "restocked",
      render: (val) => (
        <span className="text-gray-600">{val ? "Yes" : "No"}</span>
      ),
    },
    {
      title: "Restocked At",
      dataIndex: "restockedAt",
      key: "restockedAt",
      render: (val) => <span className="text-gray-600">{val || "-"}</span>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
  ];

  return (
    <PageContainer title="Refunds & Returns">
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
                  Refunds & Returns
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
              onClick={exportExcel} disabled={!report?.items?.length}
              className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconFileSpreadsheet size={15} />
              <span>Excel</span>
            </button>
              <button
              onClick={handleExportPDF} disabled={!report?.items?.length}
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
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <SummaryCard
                title="Returned Orders"
                value={report.totalOrders}
                icon={<IconHistory size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Refund Amount"
                value={`LKR ${fmt(report.totalRefundAmount)}`}
                icon={<IconReceiptRefund size={20} />}
                color="text-red-600"
                bg="bg-red-50"
              />
              <SummaryCard
                title="Restocked Items"
                value={report.totalRestockedItems}
                icon={<IconPackages size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
              />
            </div>

            {/* Table */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Order Details
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {report.items?.length} entries found
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
                dataSource={report.items || []}
                rowKey={(record, index) => index as number}
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

export default RefundsReturnsReport;
