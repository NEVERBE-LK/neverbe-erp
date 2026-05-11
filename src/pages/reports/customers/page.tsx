import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Space,
  Spin,
  Table,
  Tag,
  Progress,
} from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconMinus,
  IconUsers,
  IconUserPlus,
  IconRepeat,
  IconCurrencyDollar,
  IconShoppingCart,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
interface CustomerAnalytics {
  period: { from: string; to: string };
  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    ordersPerCustomer: number;
  };
  topCustomers: {
    name: string;
    email?: string;
    phone?: string;
    totalOrders: number;
    totalSpent: number;
  }[];
  acquisitionBySource: { source: string; count: number; percentage: number }[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

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

const CustomerAnalyticsPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CustomerAnalytics | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    setLoading(true);
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }
    try {
      const res = await api.get<CustomerAnalytics>(
        "/api/v1/erp/reports/customers",
        { params: { from: fromDate, to: toDate } },
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customer analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs().startOf("month"), dayjs()] });
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report) {
      toast("No data to export");
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Metric: "Total Customers", Value: report.overview.totalCustomers },
        { Metric: "New Customers", Value: report.overview.newCustomers },
        {
          Metric: "Returning Customers",
          Value: report.overview.returningCustomers,
        },
        {
          Metric: "Average Order Value",
          Value: report.overview.averageOrderValue,
        },
        {
          Metric: "Orders Per Customer",
          Value: report.overview.ordersPerCustomer,
        },
      ]),
      "Overview",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.topCustomers.map((c) => ({
          Name: c.name,
          Email: c.email || "",
          Phone: c.phone || "",
          Orders: c.totalOrders,
          "Total Spent (LKR)": c.totalSpent,
        })),
      ),
      "Top Customers",
    );
    XLSX.writeFile(wb, `customer_analytics_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Customer Analytics Report",
        subtitle: "Key trends, retention, and top spender performance",
        period: `${report.period.from} – ${report.period.to}`,
        summaryItems: [
          {
            label: "Total Customers",
            value: report.overview.totalCustomers.toLocaleString(),
          },
          {
            label: "Returning Customers",
            value: report.overview.returningCustomers.toLocaleString(),
            sub: `${((report.overview.returningCustomers / report.overview.totalCustomers) * 100).toFixed(1)}% retention rate`,
          },
          {
            label: "Average Order Value",
            value: `LKR ${fmt(report.overview.averageOrderValue)}`,
          },
        ],
        tables: [
          {
            title: "Top Spending Customers",
            columns: ["Name", "Contact", "Orders", "Total Spent (LKR)"],
            rows: report.topCustomers.map((c) => [
              c.name,
              c.email || c.phone || "-",
              String(c.totalOrders),
              fmt(c.totalSpent),
            ]),
            boldCols: [0],
            greenCols: [3],
          },
        ],
        filename: `customer_analytics_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<CustomerAnalytics["topCustomers"][0]> = [
    {
      title: "Rank",
      key: "rank",
      width: 48,
      render: (_, __, i) => (
        <span className="text-[10px] font-black text-gray-400 font-mono">
          {i + 1}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "name",
      render: (_, c) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
          <p className="text-[10px] text-gray-400 font-mono">
            {c.email || c.phone || "—"}
          </p>
        </div>
      ),
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "center",
      render: (v) => <Tag className="font-mono font-bold text-[10px]">{v}</Tag>,
    },
    {
      title: "Total Spent",
      dataIndex: "totalSpent",
      key: "totalSpent",
      align: "right",
      render: (v) => (
        <span className="font-mono font-bold text-blue-700">LKR {fmt(v)}</span>
      ),
    },
  ];

  const retentionPct = report
    ? report.overview.totalCustomers > 0
      ? (report.overview.returningCustomers / report.overview.totalCustomers) *
        100
      : 0
    : 0;

  return (
    <PageContainer title="Customer Analytics">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Analytics Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Customer Analytics
            </h2>
            {report && (
              <p className="text-xs text-gray-400 mt-1.5 font-mono">
                {report.period.from} &nbsp;–&nbsp; {report.period.to}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
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
                onClick={handleExportExcel}
                disabled={!report}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!report}
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

        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  label: "Total Customers",
                  value: report.overview.totalCustomers.toLocaleString(),
                  icon: <IconUsers size={20} />,
                  color: "text-indigo-700",
                  bg: "bg-indigo-50",
                  bar: null,
                },
                {
                  label: "New Customers",
                  value: report.overview.newCustomers.toLocaleString(),
                  icon: <IconUserPlus size={20} />,
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                  bar: null,
                },
                {
                  label: "Returning",
                  value: report.overview.returningCustomers.toLocaleString(),
                  icon: <IconRepeat size={20} />,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  bar: retentionPct,
                  barLabel: "retention rate",
                  barColor: "#1d4ed8",
                },
                {
                  label: "Avg. Order Value",
                  value: `LKR ${fmt(report.overview.averageOrderValue)}`,
                  icon: <IconCurrencyDollar size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                  bar: null,
                },
                {
                  label: "Orders / Customer",
                  value: String(report.overview.ordersPerCustomer),
                  icon: <IconShoppingCart size={20} />,
                  color: "text-gray-900",
                  bg: "bg-gray-100",
                  bar: null,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}
                  >
                    <span className={c.color}>{c.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {c.label}
                  </p>
                  <p
                    className={`text-lg font-black tracking-tight ${c.color} leading-none`}
                  >
                    {c.value}
                  </p>
                  {c.bar !== null && c.bar !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-bold">
                          {c.barLabel}
                        </span>
                        <span className={`text-[10px] font-black ${c.color}`}>
                          {(c.bar as number).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(c.bar as number, 100)}
                        showInfo={false}
                        strokeColor={c.barColor}
                        trailColor="#f3f4f6"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                id="customer-trend-chart"
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  New vs Returning
                </p>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "New", value: report.overview.newCustomers },
                          {
                            name: "Returning",
                            value: report.overview.returningCustomers,
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#2563EB" />
                      </Pie>
                      <RechartTooltip {...TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Orders by Channel
                </p>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.acquisitionBySource}
                      layout="vertical"
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      />
                      <YAxis
                        dataKey="source"
                        type="category"
                        width={90}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                      />
                      <RechartTooltip {...TOOLTIP_STYLE} />
                      <Bar
                        dataKey="count"
                        fill="#111827"
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Customers Table */}
            {report.topCustomers.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Top Customers
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      Ranked by total spent
                    </p>
                  </div>
                  <Tag
                    color="default"
                    className="text-[10px] font-bold uppercase"
                  >
                    LKR
                  </Tag>
                </div>
                <Table
                  columns={columns}
                  dataSource={report.topCustomers}
                  rowKey={(r) => r.name || Math.random().toString()}
                  pagination={{ pageSize: 10, position: ["bottomRight"] }}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !report && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range and click Filter to load the report.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CustomerAnalyticsPage;
