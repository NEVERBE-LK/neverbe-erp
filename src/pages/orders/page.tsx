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
  IconCreditCard,
  IconPackageExport,
  IconDeviceFloppy,
  IconCoin,
  IconHourglassHigh,
  IconTruckDelivery,
  IconShoppingCart,
  IconCalendar,
  IconBuildingStore,
  IconWorld,
  IconUser,
  IconShield,
  IconCamera,
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
  Modal,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatSLDateTime } from "@/utils/dateUtils";
import { Html5Qrcode } from "html5-qrcode";

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

  // --- Barcode Camera Scanner State ---
  const [scannerActive, setScannerActive] = useState(false);
  const [scanningOrderId, setScanningOrderId] = useState<string | null>(null);
  const scannerRef = React.useRef<any>(null);
  const isStoppingRef = React.useRef(false);

  const startScanner = (orderId: string) => {
    setScanningOrderId(orderId);
    setScannerActive(true);
  };

  const safeStopScanner = async () => {
    if (isStoppingRef.current) return; // Already stopping — skip
    isStoppingRef.current = true;
    try {
      const instance = scannerRef.current;
      if (instance) {
        const state = instance.getState?.();
        // Only call stop if actually scanning (state 2 = SCANNING)
        if (state === 2 || state === undefined) {
          await instance.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn("Scanner stop error (safe):", err);
      scannerRef.current = null;
    } finally {
      isStoppingRef.current = false;
      setScannerActive(false);
      setScanningOrderId(null);
    }
  };

  useEffect(() => {
    if (!scannerActive || !scanningOrderId) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const html5Qrcode = new Html5Qrcode("scanner-container");
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 120 } },
          (decodedText) => {
            const cleanText = decodedText.trim().replace(/\s+/g, "");
            toast.success(`Scanned: ${cleanText}`);
            setTrackingEdits(prev => ({ ...prev, [scanningOrderId!]: cleanText }));
            safeStopScanner();
          },
          () => {} // Silence per-frame scan misses
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Camera scan failed to start", err);
          toast.error("Unable to access camera. Please check media permissions.");
          setScannerActive(false);
          setScanningOrderId(null);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      // Cleanup: stop if still running (e.g. effect re-fires)
      const instance = scannerRef.current;
      if (instance) {
        instance.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scannerActive, scanningOrderId]);

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
      
      for (const o of ordersToUpdate) {
        const payload: any = {};
        if (type === "STATUS") {
          payload.status = targetValue;
          payload.sendNotification = true;
          
          if (targetValue === "Completed") {
            const track = trackingEdits[o.orderId] || o.trackingNumber;
            if (!track) {
              toast.error(`Please enter tracking number for order #${o.orderId}`);
              setIsBulkLoading(false);
              return;
            }
            payload.trackingNumber = track;
            payload.courier = courierEdits[o.orderId] || o.courier || "Domex";
          }
        } else {
          payload.paymentStatus = targetValue;
          payload.sendNotification = false;
        }

        const fd = new FormData();
        fd.append("data", JSON.stringify(payload));
        await api.put(`/api/v1/erp/orders/${o.orderId}`, fd);
      }

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
    return dateValue || "-";
  };

  // Dynamic Metrics Calculation for current view
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pendingPaymentsCount = 0;
    let activeFulfillmentsCount = 0;

    orders.forEach((o) => {
      totalRevenue += o.total || 0;
      if (o.paymentStatus?.toLowerCase() === "pending") {
        pendingPaymentsCount++;
      }
      if (o.status?.toLowerCase() === "processing" || o.status?.toLowerCase() === "pending") {
        activeFulfillmentsCount++;
      }
    });

    return {
      totalRevenue,
      pendingPaymentsCount,
      activeFulfillmentsCount,
    };
  }, [orders]);

  const getSourceBadge = (source: string | undefined) => {
    if (!source) return null;
    const src = source.toLowerCase();
    if (src === "website") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 uppercase">
          <IconWorld size={10} /> Website
        </span>
      );
    }
    if (src === "store") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5 uppercase">
          <IconBuildingStore size={10} /> Store
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 uppercase">
        <IconUser size={10} /> Admin
      </span>
    );
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, order) => (
        <Space size="small">
          <Tooltip title="View Invoice">
            <Button
              type="text"
              icon={<IconFileInvoice size={18} className="text-gray-500 hover:text-black" />}
              onClick={() => navigate(`/orders/${order.orderId}/invoice`)}
              className="hover:bg-gray-100 rounded-lg"
            />
          </Tooltip>
          <Tooltip title="View Summary">
            <Button
              type="text"
              icon={<IconEye size={18} className="text-gray-500 hover:text-black" />}
              onClick={() => navigate(`/orders/${order.orderId}/view`)}
              className="hover:bg-gray-100 rounded-lg"
            />
          </Tooltip>
          <Tooltip title="Configure/Edit">
            <Button
              type="text"
              icon={<IconEdit size={18} className="text-green-600 hover:text-green-700" />}
              onClick={() => navigate(`/orders/${order.orderId}`)}
              className="hover:bg-green-50 rounded-lg"
            />
          </Tooltip>
        </Space>
      ),
    },
    // Delivery Column (Only for Processing View)
    ...(isProcessingView ? [{
      title: "Delivery Info",
      key: "delivery",
      width: 350,
      render: (_: any, order: Order) => (
        <Space.Compact className="w-full">
          <Select 
            defaultValue={order.courier || "Domex"} 
            style={{ width: 110, height: 38 }}
            onChange={(val) => setCourierEdits(prev => ({ ...prev, [order.orderId]: val }))}
          >
            <Option value="Domex">Domex</Option>
            <Option value="Certis">Certis</Option>
            <Option value="Prompt">Prompt</Option>
            <Option value="Koombiyo">Koombiyo</Option>
          </Select>
          <Input 
            placeholder="Tracking #" 
            value={trackingEdits[order.orderId] !== undefined ? trackingEdits[order.orderId] : (order.trackingNumber || "")}
            style={{ height: 38 }}
            className="flex-1"
            onChange={(e) => setTrackingEdits(prev => ({ ...prev, [order.orderId]: e.target.value }))}
          />
          <Tooltip title="Scan Code via Camera">
            <Button 
              icon={<IconCamera size={16} />} 
              style={{ height: 38, width: 42 }}
              className="bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center md:!hidden"
              onClick={() => startScanner(order.orderId)}
            />
          </Tooltip>
          <Tooltip title="Update to Completed">
            <Button 
              icon={<IconDeviceFloppy size={16} />} 
              type="primary"
              style={{ height: 38, width: 42 }}
              className="bg-emerald-600 border-none flex items-center justify-center"
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
        <div className="flex flex-col gap-1 py-1">
          <span className="font-mono font-bold text-gray-900 text-xs">#{order.orderId}</span>
          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
            <IconCalendar size={12} /> {formatDate(order.createdAt)}
          </span>
          <div>{getSourceBadge(order.from)}</div>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-xs text-gray-800">{order.customer?.name || "N/A"}</span>
          <span className="text-[10px] text-gray-400 font-bold">
            {order.items?.length || 0} items ordered
          </span>
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      align: "center" as const,
      render: (_: any, order: Order) => {
        const status = (order.paymentStatus || "Pending").toLowerCase();
        let color = "bg-gray-100 text-gray-700 border-gray-200";
        let dotColor = "bg-gray-400";
        if (status === "paid") {
          color = "bg-emerald-50 text-emerald-700 border-emerald-200";
          dotColor = "bg-emerald-500";
        } else if (status === "pending") {
          color = "bg-blue-50 text-blue-700 border-blue-200";
          dotColor = "bg-blue-500";
        } else if (status === "failed") {
          color = "bg-rose-50 text-rose-700 border-rose-200";
          dotColor = "bg-rose-500";
        } else if (status === "refunded") {
          color = "bg-amber-50 text-amber-700 border-amber-200";
          dotColor = "bg-amber-500";
        }

        return (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {order.paymentStatus || "PENDING"}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {order.paymentMethod || "—"}
            </span>
          </div>
        );
      },
    },
    {
      title: "Order Total",
      key: "total",
      align: "right" as const,
      render: (_: any, order: Order) => (
        <span className="font-black text-xs text-emerald-700 font-mono">
          Rs {(order.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Fullfilment Status",
      key: "status",
      align: "center" as const,
      render: (_: any, order: Order) => {
        const state = (order.status || "Pending").toLowerCase();
        let color = "bg-gray-50 text-gray-700 border-gray-200";
        let dotColor = "bg-gray-400";
        if (state === "completed") {
          color = "bg-green-50 text-green-700 border-green-200";
          dotColor = "bg-green-500";
        } else if (state === "processing") {
          color = "bg-amber-50 text-amber-700 border-amber-200";
          dotColor = "bg-amber-500";
        } else if (state === "pending") {
          color = "bg-blue-50 text-blue-700 border-blue-200";
          dotColor = "bg-blue-500";
        } else if (state === "cancelled") {
          color = "bg-red-50 text-red-700 border-red-200";
          dotColor = "bg-red-500";
        }

        return (
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {order.status}
          </span>
        );
      },
    },
    {
      title: "System Integrity",
      key: "check",
      align: "center" as const,
      render: (_: any, order: Order) =>
        order.integrity ? (
          <Tooltip title="Security Integrity Verified">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <IconCheck size={12} /> SECURE
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Integrity Check Failed! Check records immediately.">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5 animate-pulse">
              <IconAlertCircle size={12} /> FLAGGED
            </span>
          </Tooltip>
        ),
    },
  ];

  const viewTitle = isProcessingView ? "Processing Orders" : isPaymentPendingView ? "Pending Payments" : "All Orders";

  return (
    <PageContainer title={`${viewTitle} | NEVERBE ERP`} loading={isLoading} description={`Manage ${viewTitle}`}>
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-12 ${isProcessingView ? 'bg-orange-500' : isPaymentPendingView ? 'bg-blue-500' : 'bg-emerald-600'} rounded-full`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Order Management</span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{viewTitle}</h2>
            </div>
          </div>
        </div>


        {/* Filters */}
        <Card size="small" className="rounded-2xl shadow-sm border-gray-100 bg-gray-50/50">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            className="flex flex-wrap gap-3 w-full p-2"
          >
            <Form.Item name="search" className="!mb-0 flex-grow min-w-[240px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search order number, customer name, email..."
                allowClear
                className="rounded-xl h-10 border-gray-200"
              />
            </Form.Item>
            {!isPaymentPendingView && (
              <Form.Item name="payment" className="!mb-0 w-40">
                <Select className="h-10 rounded-xl overflow-hidden border-gray-200">
                  <Option value="all">All Payments</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Failed">Failed</Option>
                  <Option value="Refunded">Refunded</Option>
                </Select>
              </Form.Item>
            )}
            {!isProcessingView && (
              <Form.Item name="status" className="!mb-0 w-36">
                <Select className="h-10 rounded-xl overflow-hidden border-gray-200">
                  <Option value="all">All Statuses</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Processing">Processing</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item name="from" className="!mb-0 w-32">
              <Select className="h-10 rounded-xl overflow-hidden border-gray-200" placeholder="Source">
                <Option value="all">All Sources</Option>
                <Option value="website">Website</Option>
                <Option value="store">Store</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" className="!mb-0 w-64">
              <RangePicker className="w-full h-10 rounded-xl border-gray-200" />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="h-10 px-6 rounded-xl font-bold bg-black border-none hover:bg-gray-800 shadow-none"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleClearFilters}
                  className="h-10 px-6 rounded-xl font-bold border-gray-200"
                >
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Bulk Action Alert Panel */}
        {selectedRowKeys.length > 0 && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className={`bg-gradient-to-r ${isProcessingView ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} text-white px-6 py-3 rounded-2xl shadow-md flex items-center justify-between border border-transparent`}>
              <div className="flex items-center gap-6">
                <span className="text-white font-black text-xs uppercase tracking-widest">
                  {selectedRowKeys.length} Order{selectedRowKeys.length > 1 ? 's' : ''} Selected
                </span>
                <div className="bg-white/20 w-[1px] h-6" />
                <Space size="middle">
                  {isProcessingView && (
                    <Button 
                      type="primary" 
                      size="middle" 
                      icon={<IconPackageExport size={16} />}
                      className="bg-white text-orange-600 hover:bg-orange-50 border-none font-bold rounded-xl h-9 flex items-center"
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
                      className="bg-white text-blue-600 hover:bg-blue-50 border-none font-bold rounded-xl h-9 flex items-center"
                      onClick={() => handleBulkUpdate("PAYMENT", "Paid")}
                      loading={isBulkLoading}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </Space>
              </div>
              <Button 
                type="text" 
                icon={<IconX size={18} />} 
                className="text-white/80 hover:text-white" 
                onClick={() => setSelectedRowKeys([])} 
              />
            </div>
          </div>
        )}

        {/* Table UI */}
        <Table
            rowSelection={ (isProcessingView || isPaymentPendingView) ? {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            } : undefined }
            columns={columns}
            dataSource={orders}
            rowKey="orderId"
            pagination={{ ...pagination, position: ["bottomRight"], showTotal: (total) => `Total ${total} records` }}
            loading={isLoading || isBulkLoading}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            className="custom-table border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
          />
      </Space>

      {/* Barcode Camera Scanner Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <IconCamera className="text-emerald-600" size={20} />
            <span className="font-black text-xs text-gray-800 uppercase tracking-wider">
              Scan Tracking Barcode
            </span>
          </div>
        }
        open={scannerActive}
        onCancel={() => safeStopScanner()}
        footer={null}
        width={450}
        styles={{ body: { padding: "20px" } }}
        className="rounded-2xl"
        maskClosable={false}
      >
        <div className="flex flex-col gap-4 items-center">
          <div className="text-xs text-gray-500 font-semibold text-center mb-1">
            Position the shipping label barcode within the viewfinder below.
          </div>
          
          <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center">
            <div id="scanner-container" className="w-full h-full object-cover" />
            
            {/* Red scanning laser simulation line */}
            <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse pointer-events-none" />
            
            {/* viewbox targeting overlay */}
            <div className="absolute inset-x-12 inset-y-16 border-2 border-dashed border-emerald-500 rounded pointer-events-none" />
          </div>
          
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wide">
            Supports standard 1D Barcodes (Code 128, Code 39) & QR Codes.
          </div>

          <Button 
            onClick={() => safeStopScanner()} 
            block 
            className="mt-2 h-10 font-bold rounded-xl"
          >
            Cancel Scan
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default OrdersPage;
