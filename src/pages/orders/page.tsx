import api from "@/lib/api";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  IconEye,
  IconFileInvoice,
  IconEdit,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconX,
  IconBellRinging,
  IconCreditCard,
  IconPackageExport,
  IconDeviceFloppy,
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
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [form] = Form.useForm();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // --- View Detection ---
  const isProcessingView = location.pathname.includes("/processing");
  const isPaymentPendingView = location.pathname.includes("/payment-pending");

  // --- Pagination state ---
  const [pagination, setPagination] = useState({
    current: initialPage,
    pageSize: 10,
    total: 0,
  });

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stocks, setStocks] = useState<{ id: string; label: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // --- Bulk Action State ---
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // --- Inline Edit State ---
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [courierEdits, setCourierEdits] = useState<Record<string, string>>({});

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

  // --- Initialize view-based filters ---
  useEffect(() => {
    const defaultFilters: any = {
      payment: isPaymentPendingView ? "Pending" : "all",
      status: isProcessingView ? "Processing" : "all",
      from: "all",
      stockId: "all",
      paymentMethod: "all",
    };
    form.setFieldsValue(defaultFilters);
    fetchOrders(defaultFilters);
  }, [location.pathname]);

  // --- Fetch orders from API ---
  const fetchOrders = async (values?: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(pagination.current));
      params.append("size", String(pagination.pageSize));

      const filters = values || form.getFieldsValue();
      
      // Enforce view-specific filters (even if form fields are hidden)
      const effectivePayment = isPaymentPendingView ? "Pending" : (filters.payment || "all");
      const effectiveStatus = isProcessingView ? "Processing" : (filters.status || "all");

      if (effectivePayment !== "all")
        params.append("payment", effectivePayment as string);
      if (effectiveStatus !== "all")
        params.append("status", effectiveStatus as string);
      if (filters.search)
        params.append("search", (filters.search as string).trim());
      if (filters.dateRange) {
        const range = filters.dateRange as [
          { format: (f: string) => string },
          { format: (f: string) => string },
        ];
        if (range[0]) params.append("startDate", range[0].format("YYYY-MM-DD"));
        if (range[1]) params.append("endDate", range[1].format("YYYY-MM-DD"));
      }
      if (filters.from && filters.from !== "all")
        params.append("from", filters.from as string);
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
    setSearchParams((prev) => {
      prev.set("page", String(newPagination.current));
      return prev;
    });
  };

  const handleFilterSubmit = (values: any) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    if (pagination.current === 1) {
      fetchOrders(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
      setSearchParams((prev) => {
        prev.set("page", "1");
        return prev;
      });
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  const handleInlineUpdate = async (orderId: string, field: "status" | "paymentStatus", value: string) => {
    try {
      setIsBulkLoading(true);
      const payload: any = { [field]: value };
      
      // If updating status, default notification logic applies
      if (field === "status") {
        payload.sendNotification = true;
      } else {
        payload.sendNotification = false; // No notification for payment updates
      }

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      await api.put(`/api/v1/erp/orders/${orderId}`, fd);
      
      toast.success(`${field.toUpperCase()} updated for #${orderId}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleSingleRowUpdate = async (orderId: string) => {
    try {
      setIsBulkLoading(true);
      const trackingNumber = trackingEdits[orderId];
      const courier = courierEdits[orderId] || "Domex";

      if (!trackingNumber) {
        toast.error("Please enter a tracking number");
        return;
      }

      const payload = {
        trackingNumber,
        courier,
        status: "Completed",
        sendNotification: true
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      await api.put(`/api/v1/erp/orders/${orderId}`, fd);
      
      toast.success(`Order #${orderId} updated to Completed`);
      
      // Clean up local edits
      const newTracking = { ...trackingEdits };
      delete newTracking[orderId];
      setTrackingEdits(newTracking);
      
      const newCourier = { ...courierEdits };
      delete newCourier[orderId];
      setCourierEdits(newCourier);

      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkUpdate = async (type: "STATUS" | "PAYMENT", targetValue: string) => {
    try {
      setIsBulkLoading(true);
      const ordersToUpdate = orders.filter(o => selectedRowKeys.includes(o.orderId));
      
      const promises = ordersToUpdate.map(async (o) => {
        const payload: any = {};
        if (type === "STATUS") {
          payload.status = targetValue;
          payload.sendNotification = true; // Multilingual notification triggered on backend
          
          // Use inline tracking/courier if available
          if (targetValue === "Completed") {
            payload.trackingNumber = trackingEdits[o.orderId] || o.trackingNumber;
            payload.courier = courierEdits[o.orderId] || o.courier || "Domex";
          }
        } else {
          payload.paymentStatus = targetValue;
          payload.sendNotification = false; // No notification for payment changes
        }

        const fd = new FormData();
        fd.append("data", JSON.stringify(payload));
        return api.put(`/api/v1/erp/orders/${o.orderId}`, fd);
      });

      await Promise.all(promises);
      toast.success(`Successfully updated ${selectedRowKeys.length} orders to ${targetValue}`);
      setSelectedRowKeys([]);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update some orders");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Helper for Date Formatting
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    if (typeof dateValue === "object") {
      if (dateValue._seconds !== undefined) return dayjs(dateValue._seconds * 1000).format("DD MMM YYYY, hh:mm A");
      if (dateValue.seconds !== undefined) return dayjs(dateValue.seconds * 1000).format("DD MMM YYYY, hh:mm A");
      if (dateValue.toDate) return dayjs(dateValue.toDate()).format("DD MMM YYYY, hh:mm A");
    }
    const parsed = dayjs(dateValue);
    return parsed.isValid() ? parsed.format("DD MMM YYYY, hh:mm A") : String(dateValue);
  };

  const getStatusTagColor = (status: string | undefined, type: "payment" | "order") => {
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
    // Delivery Column (Only for Processing View)
    ...(isProcessingView ? [{
      title: "Delivery Info",
      key: "delivery",
      width: 250,
      render: (_: any, order: Order) => (
        <Space.Compact className="w-full">
          <Select 
            defaultValue={order.courier || "Domex"} 
            className="w-24 rounded-l-xl"
            onChange={(val) => setCourierEdits(prev => ({ ...prev, [order.orderId]: val }))}
          >
            <Option value="Domex">Domex</Option>
            <Option value="Certis">Certis</Option>
            <Option value="Prompt">Prompt</Option>
            <Option value="Koombiyo">Koombiyo</Option>
          </Select>
          <Input 
            placeholder="Tracking #" 
            defaultValue={order.trackingNumber}
            className="flex-1"
            onChange={(e) => setTrackingEdits(prev => ({ ...prev, [order.orderId]: e.target.value }))}
          />
          <Tooltip title="Update to Completed">
            <Button 
              icon={<IconDeviceFloppy size={16} />} 
              type="primary"
              className="bg-emerald-600 border-none"
              onClick={() => handleSingleRowUpdate(order.orderId)}
            />
          </Tooltip>
        </Space.Compact>
      )
    }] : []),
    {
      title: "Order Details",
      key: "details",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>#{order.orderId}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">{formatDate(order.createdAt)}</Typography.Text>
          <Typography.Text type="secondary" className="text-[10px] uppercase font-bold text-gray-400">via {order.from}</Typography.Text>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>{order.customer?.name || "N/A"}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">{order.items?.length || 0} Items</Typography.Text>
        </div>
      ),
    },
    // Only show Payment column if not in Payment Pending view
    ...(!isPaymentPendingView ? [{
      title: "Payment",
      key: "payment",
      align: "center" as const,
      render: (_: any, order: Order) => (
        <div className="flex flex-col items-center">
          <Tag color={getStatusTagColor(order.paymentStatus, "payment")} className="rounded-full text-[10px] font-black uppercase text-center min-w-[80px]">{order.paymentStatus || "N/A"}</Tag>
          <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{order.paymentMethod || "—"}</span>
        </div>
      ),
    }] : []),
    // Show Read-only Payment column specifically for Payment Pending view
    ...(isPaymentPendingView ? [{
      title: "Payment",
      key: "payment_readonly",
      align: "center" as const,
      render: (_: any, order: Order) => (
        <div className="flex flex-col items-center">
          <Tag color={getStatusTagColor(order.paymentStatus, "payment")} className="rounded-full text-[10px] font-black uppercase text-center min-w-[80px]">{order.paymentStatus || "N/A"}</Tag>
          <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{order.paymentMethod || "—"}</span>
        </div>
      ),
    }] : []),
    {
      title: "Total",
      key: "total",
      align: "right" as const,
      render: (_: any, order: Order) => <Typography.Text strong className="text-emerald-700">LKR {order.total?.toLocaleString()}</Typography.Text>,
    },
    // Only show Status column if not in Processing view
    ...(!isProcessingView ? [{
      title: "Status",
      key: "status",
      align: "center" as const,
      render: (_: any, order: Order) => (
        <Tag color={getStatusTagColor(order.status, "order")} className="rounded-full text-[10px] font-black uppercase text-center min-w-[100px]">{order.status}</Tag>
      ),
    }] : []),
    // Show Read-only Status column specifically for Processing page
    ...(isProcessingView ? [{
      title: "Status",
      key: "status_readonly",
      align: "center" as const,
      render: (_: any, order: Order) => (
        <Tag color={getStatusTagColor(order.status, "order")} className="rounded-full text-[10px] font-black uppercase text-center min-w-[100px]">{order.status}</Tag>
      ),
    }] : []),
    {
      title: "Check",
      key: "check",
      align: "center" as const,
      render: (_: any, order: Order) => order.integrity ? <IconCheck size={18} className="text-green-600 mx-auto" /> : <IconAlertCircle size={18} className="text-red-600 mx-auto" />,
    },
  ];

  const viewTitle = isProcessingView ? "Processing Orders" : isPaymentPendingView ? "Pending Payments" : "All Orders";

  return (
    <PageContainer title={`${viewTitle} | NEVERBE ERP`} loading={isLoading} description={`Manage ${viewTitle}`}>
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-12 ${isProcessingView ? 'bg-orange-500' : isPaymentPendingView ? 'bg-blue-500' : 'bg-emerald-600'} rounded-full`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Order Management</span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{viewTitle}</h2>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card size="small" className="rounded-2xl shadow-sm border-gray-100">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            className="flex flex-wrap gap-2 w-full p-2"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input prefix={<IconSearch size={15} className="text-gray-400" />} placeholder="Search order, customer, phone..." allowClear className="rounded-xl h-10" />
            </Form.Item>
            {!isPaymentPendingView && (
              <Form.Item name="payment" className="!mb-0 w-40">
                <Select className="h-10 rounded-xl overflow-hidden">
                  <Option value="all">All Payment</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Failed">Failed</Option>
                  <Option value="Refunded">Refunded</Option>
                </Select>
              </Form.Item>
            )}
            {!isProcessingView && (
              <Form.Item name="status" className="!mb-0 w-36">
                <Select className="h-10 rounded-xl overflow-hidden">
                  <Option value="all">All Status</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Processing">Processing</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item name="dateRange" className="!mb-0 w-64">
              <RangePicker className="w-full h-10 rounded-xl" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space>
                <Button type="primary" htmlType="submit" icon={<IconFilter size={15} />} className="h-10 px-6 rounded-xl font-bold bg-emerald-600 border-emerald-600">Filter</Button>
                <Button icon={<IconX size={15} />} onClick={handleClearFilters} className="h-10 px-6 rounded-xl font-bold">Clear</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Table + Bulk UI */}
        <div className="relative">
          {selectedRowKeys.length > 0 && (
            <div className="absolute -top-16 left-0 right-0 z-10 animate-in slide-in-from-bottom-4 duration-300">
              <Card size="small" className={`${isProcessingView ? 'bg-orange-600' : 'bg-blue-600'} border-none shadow-2xl rounded-2xl`}>
                <div className="flex items-center justify-between px-6 py-2">
                  <div className="flex items-center gap-6">
                    <span className="text-white font-black text-xs uppercase tracking-widest">{selectedRowKeys.length} Selected</span>
                    <Divider type="vertical" className="bg-white/20 h-6" />
                    <Space size="middle">
                      {isProcessingView && (
                        <Button 
                          type="primary" 
                          size="middle" 
                          icon={<IconPackageExport size={16} />}
                          className="bg-white text-orange-600 hover:bg-orange-50 border-none font-bold rounded-xl h-10 px-6"
                          onClick={() => handleBulkUpdate("STATUS", "Completed")}
                          loading={isBulkLoading}
                        >
                          Mark as Completed & Notify
                        </Button>
                      )}
                      {isPaymentPendingView && (
                        <Button 
                          type="primary" 
                          size="middle" 
                          icon={<IconCreditCard size={16} />}
                          className="bg-white text-blue-600 hover:bg-blue-50 border-none font-bold rounded-xl h-10 px-6"
                          onClick={() => handleBulkUpdate("PAYMENT", "Paid")}
                          loading={isBulkLoading}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </Space>
                  </div>
                  <Button type="text" icon={<IconX size={18} />} className="text-white/60 hover:text-white" onClick={() => setSelectedRowKeys([])} />
                </div>
              </Card>
            </div>
          )}
          <Table
            rowSelection={ (isProcessingView || isPaymentPendingView) ? {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            } : undefined }
            columns={columns}
            dataSource={orders}
            rowKey="orderId"
            pagination={{ ...pagination, position: ["bottomRight"] }}
            loading={isLoading || isBulkLoading}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            className="custom-table border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
          />
        </div>
      </Space>
    </PageContainer>
  );
};

export default OrdersPage;
