import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconEye,
  IconFileInvoice,
  IconEdit,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "../components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { Order } from "@/model/Order";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Tooltip,
  Form,
  Card,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [form] = Form.useForm();

  // --- Pagination state ---
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stocks, setStocks] = useState<{ id: string; label: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // --- Fetch dropdown data ---
  const fetchDropdownData = async () => {
    try {
      const [stocksRes, pmRes] = await Promise.all([
        api.get("/api/v1/erp/master/stocks/dropdown"),
        api.get("/api/v1/erp/finance/payment-methods"),
      ]);
      setStocks(stocksRes.data);
      setPaymentMethods(pmRes.data);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // --- Fetch orders from API ---
  const fetchOrders = async (values?: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(pagination.current));
      params.append("size", String(pagination.pageSize));

      const filters = values || form.getFieldsValue();
      if (filters.payment && filters.payment !== "all")
        params.append("payment", filters.payment as string);
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status as string);
      if (filters.search)
        params.append("search", (filters.search as string).trim());
      if (filters.dateRange) {
        const range = filters.dateRange as [
          { format: (f: string) => string },
          { format: (f: string) => string },
        ];
        if (range[0]) params.append("from", range[0].format("YYYY-MM-DD"));
        if (range[1]) params.append("to", range[1].format("YYYY-MM-DD"));
      }
      if (filters.source && filters.source !== "all")
        params.append("source", filters.source as string);
      if (filters.stockId && filters.stockId !== "all")
        params.append("stockId", filters.stockId as string);
      if (filters.paymentMethod && filters.paymentMethod !== "all")
        params.append("paymentMethod", filters.paymentMethod as string);

      const { data } = await api.get(`/api/v1/erp/orders?${params.toString()}`);
      setOrders(data.dataList);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when pagination changes
  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [pagination.current, pagination.pageSize, currentUser]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleFilterSubmit = (values: any) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    // We need to wait for state update or pass values directly.
    // fetchOrders uses form.getFieldsValue() so verify if values are synced or pass explicitly.
    // Ideally, pass explicitly to fetchOrders or let useEffect trigger (but useEffect depends on pagination).
    // Best: Update pagination, then fetch. But fetch depends on pagination state.
    // We'll call fetchOrders directly with the new pagination (reset to 1) and values.
    // NOTE: fetchOrders uses 'pagination.current' from state. We must manually override in params or wait.
    // Simpler approach: Just reset page to 1, and let useEffect trigger? No, useEffect depends on [pagination.current].
    // If page is already 1, it won't trigger.
    // So we call fetchOrders manually passing the values, and override page param logic inside if needed, or just setPagination(1) and if it's already 1 call fetch.

    if (pagination.current === 1) {
      fetchOrders(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
      // useEffect will trigger fetchOrders
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  // Helper for Status Badges
  const getStatusTagColor = (
    status: string | undefined,
    type: "payment" | "order",
  ) => {
    if (!status) return "default";
    const s = status.toLowerCase();

    if (type === "payment") {
      if (s === "paid") return "success";
      if (s === "pending") return "default";
      if (s === "failed") return "error";
      if (s === "refunded") return "warning";
    } else {
      if (s === "completed") return "success";
      if (s === "processing") return "processing";
      if (s === "cancelled") return "error";
      if (s === "shipped") return "processing";
    }
    return "default";
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, order) => (
        <Space>
          <Tooltip title="Invoice">
            <Button
              type="text"
              icon={<IconFileInvoice size={18} />}
              onClick={() => navigate(`/orders/${order.orderId}/invoice`)}
            />
          </Tooltip>
          {/* View Button Removed/Redundant? The legacy code had view button. Keeping it. */}
          <Tooltip title="View">
            <Button
              type="text"
              icon={<IconEye size={18} />}
              onClick={() => navigate(`/orders/${order.orderId}/view`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<IconEdit size={16} />}
              size="small"
              onClick={() => navigate(`/orders/${order.orderId}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Order Details",
      key: "details",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>#{order.orderId}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {order.createdAt ? String(order.createdAt) : "-"}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            via {order.from}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>
            {order.customer?.name || "N/A"}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {order.items?.length || 0} Items
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      align: "center",
      render: (_, order) => (
        <div className="flex flex-col items-center">
          <Tag color={getStatusTagColor(order.paymentStatus, "payment")}>
            {order.paymentStatus || "N/A"}
          </Tag>
          <span className="text-xs text-gray-400 mt-1">
            {order.paymentMethod || "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_, order) => (
        <Typography.Text strong>
          LKR {order.total?.toLocaleString()}
        </Typography.Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      render: (_, order) => (
        <Tag color={getStatusTagColor(order.status, "order")}>
          {order.status}
        </Tag>
      ),
    },
    {
      title: "Check",
      key: "check",
      align: "center",
      render: (_, order) =>
        order.integrity ? (
          <IconCheck size={18} className="text-green-600 mx-auto" />
        ) : (
          <IconAlertCircle size={18} className="text-red-600 mx-auto" />
        ),
    },
  ];

  return (
    <PageContainer
      title="Orders | NEVERBE ERP"
      loading={isLoading}
      description="Manage Customer Orders"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Management
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Order Management
              </h2>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              payment: "all",
              status: "all",
              source: "all",
              stockId: "all",
              paymentMethod: "all",
            }}
            className="flex flex-wrap gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search orders..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="payment" className="!mb-0 w-40">
              <Select>
                <Option value="all">All Payment</Option>
                <Option value="Paid">Paid</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Failed">Failed</Option>
                <Option value="Refunded">Refunded</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-36">
              <Select>
                <Option value="all">All Status</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Processing">Processing</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
                <Option value="Shipped">Shipped</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" className="!mb-0 w-64">
              <RangePicker className="w-full" />
            </Form.Item>
            <Form.Item name="source" className="!mb-0 w-36">
              <Select>
                <Option value="all">All Sources</Option>
                <Option value="Store">Store</Option>
                <Option value="Website">Website</Option>
              </Select>
            </Form.Item>
            <Form.Item name="stockId" className="!mb-0 w-40">
              <Select dropdownMatchSelectWidth={false}>
                <Option value="all">All Stocks</Option>
                {stocks.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="paymentMethod" className="!mb-0 w-44">
              <Select dropdownMatchSelectWidth={false}>
                <Option value="all">All Methods</Option>
                {paymentMethods.map((pm) => (
                  <Option key={pm.id} value={pm.name}>
                    {pm.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                >
                  Filter
                </Button>
                <Button icon={<IconX size={15} />} onClick={handleClearFilters}>
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="orderId"
          pagination={{ ...pagination, position: ["bottomRight"] }}
          loading={isLoading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          bordered
        />
      </Space>
    </PageContainer>
  );
};

export default OrdersPage;
