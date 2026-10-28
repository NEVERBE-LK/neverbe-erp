import api from "@/lib/api";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  IconEye,
  IconFileInvoice,
  IconEdit,
  IconSearch,
  IconFilter,
  IconAdjustmentsHorizontal,
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
  IconShieldCheck,
  IconCamera,
  IconDotsVertical,
  IconPrinter,
  IconPackage,
  IconTruck,
  IconRotate,
  IconCircleX,
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
  Dropdown,
  MenuProps,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatSLDateTime } from "@/utils/dateUtils";
import { Html5Qrcode } from "html5-qrcode";
import Spinner from "@/pages/components/shared/Spinner";
import { InvoicePreviewModal } from "./[orderId]/components/InvoicePreviewModal";
import { ProcessOrderModal } from "./components/ProcessOrderModal";
import { ProcessPaymentModal } from "./components/ProcessPaymentModal";
import { ProcessReturnModal } from "./components/ProcessReturnModal";
import { ProcessCancelModal } from "./components/ProcessCancelModal";
import { EditCustomerModal } from "./components/EditCustomerModal";
import { EditOrderItemsModal } from "./components/EditOrderItemsModal";

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

  // --- Date filter period preset state (Default to Current Month for general order list) ---
  const isGeneralOrderList = !isPaymentPendingView && !isProcessingView;
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month" | "last_month" | "all" | "custom"
  >(isGeneralOrderList ? "month" : "all");

  const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = useMemo(
    () => [
      { label: "Today", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
      { label: "This Week", value: [dayjs().startOf("week"), dayjs().endOf("day")] },
      { label: "This Month", value: [dayjs().startOf("month"), dayjs().endOf("day")] },
      {
        label: "Last Month",
        value: [
          dayjs().subtract(1, "month").startOf("month"),
          dayjs().subtract(1, "month").endOf("month"),
        ],
      },
      {
        label: "Last 90 Days",
        value: [dayjs().subtract(90, "day").startOf("day"), dayjs().endOf("day")],
      },
    ],
    []
  );

  // --- Active Filter Watchers ---
  const searchVal = Form.useWatch("search", form);
  const paymentVal = Form.useWatch("payment", form);
  const statusVal = Form.useWatch("status", form);
  const fromVal = Form.useWatch("from", form);

  const isSearchActive = Boolean(searchVal && String(searchVal).trim());
  const isPaymentActive = !isPaymentPendingView && paymentVal && paymentVal !== "all";
  const isStatusActive = !isProcessingView && statusVal && statusVal !== "all";
  const isFromActive = fromVal && fromVal !== "all";
  const isDateCustom = selectedPeriod !== (isGeneralOrderList ? "month" : "all");

  const activeFiltersCount = [
    isSearchActive,
    isPaymentActive,
    isStatusActive,
    isFromActive,
    isDateCustom,
  ].filter(Boolean).length;

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

  // --- Invoice Preview Modal State ---
  const [previewOrderForInvoice, setPreviewOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // --- Workflow Action Modals State ---
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [isProcessPaymentOpen, setIsProcessPaymentOpen] = useState(false);
  const [isProcessOrderOpen, setIsProcessOrderOpen] = useState(false);
  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [isProcessCancelOpen, setIsProcessCancelOpen] = useState(false);
  const [selectedOrderForEditCustomer, setSelectedOrderForEditCustomer] = useState<Order | null>(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [selectedOrderForEditItems, setSelectedOrderForEditItems] = useState<Order | null>(null);
  const [isEditItemsOpen, setIsEditItemsOpen] = useState(false);

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
    const isGeneral = !isPaymentPendingView && !isProcessingView;
    const initialPeriod = isGeneral ? "month" : "all";
    setSelectedPeriod(initialPeriod);

    const defaultFilters: any = {
      payment: isPaymentPendingView ? "Pending" : "all",
      status: isProcessingView ? "Processing" : "all",
      from: "all",
      stockId: "all",
      paymentMethod: "all",
      dateRange: isGeneral
        ? [dayjs().startOf("month"), dayjs().endOf("day")]
        : undefined,
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

      const formValues = form.getFieldsValue();
      const filters = values ? { ...formValues, ...values } : formValues;
      
      // Enforce view-specific filters (even if form fields are hidden)
      const effectivePayment = isPaymentPendingView ? "Pending" : (filters.payment || "all");
      const effectiveStatus = isProcessingView ? "Processing" : (filters.status || "all");

      if (effectivePayment !== "all")
        params.append("payment", effectivePayment as string);
      if (effectiveStatus !== "all")
        params.append("status", effectiveStatus as string);

      const hasSearch = Boolean(filters.search && (filters.search as string).trim());
      if (hasSearch)
        params.append("search", (filters.search as string).trim());

      // Smart ERP search: if searching by Order ID / customer, search across all time.
      // Otherwise apply active date range filter.
      if (filters.dateRange && !hasSearch) {
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

  const handleQuickDateFilter = (
    period: "today" | "week" | "month" | "last_month" | "all",
    range?: [dayjs.Dayjs, dayjs.Dayjs]
  ) => {
    setSelectedPeriod(period);
    form.setFieldsValue({ dateRange: range });
    handleFilterSubmit({ ...form.getFieldsValue(), dateRange: range });
  };

  const handleClearFilters = () => {
    form.resetFields();
    const defaultPeriod = isGeneralOrderList ? "month" : "all";
    const defaultRange = isGeneralOrderList
      ? [dayjs().startOf("month"), dayjs().endOf("day")]
      : undefined;
    setSelectedPeriod(defaultPeriod);
    const cleared = {
      payment: isPaymentPendingView ? "Pending" : "all",
      status: isProcessingView ? "Processing" : "all",
      from: "all",
      stockId: "all",
      paymentMethod: "all",
      dateRange: defaultRange,
      search: undefined,
    };
    form.setFieldsValue(cleared);
    handleFilterSubmit(cleared);
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
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-gray-900 text-xs">#{order.orderId}</span>
            {(() => {
              const isCOD =
                (order.paymentMethod || "").toLowerCase().includes("cod") ||
                (order.paymentMethod || "").toLowerCase().includes("cash on delivery");
              if (!isCOD || order.riskStatus !== "HIGH_RISK") return null;
              const shippingFee = order.shippingFee || 450;
              return (
                <span className={`inline-flex items-center gap-1 text-[9px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider border ${
                  order.deliveryFeePrepaid 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                    : "text-rose-700 bg-rose-50 border-rose-200/80"
                }`}>
                  ⚠️ HIGH RISK {order.deliveryFeePrepaid ? `• PREPAID FEE PAID (LKR ${shippingFee})` : `• PREPAID FEE PENDING (LKR ${shippingFee})`}
                </span>
              );
            })()}
          </div>
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
      render: (_: any, order: Order) => {
        const isCOD =
          (order.paymentMethod || "").toLowerCase().includes("cod") ||
          (order.paymentMethod || "").toLowerCase().includes("cash on delivery");
        const isFeePrepaid = isCOD && order.deliveryFeePrepaid;
        const shippingFee = order.shippingFee || 450;
        const codBalance = Math.max(0, (order.total || 0) - shippingFee);

        return (
          <div className="flex flex-col items-end py-1">
            <span className="font-black text-xs text-emerald-700 font-mono">
              Rs {(order.total || 0).toLocaleString()}
            </span>
            {isFeePrepaid && (
              <span className="text-[10px] font-extrabold text-amber-700 font-mono">
                COD Due: Rs {codBalance.toLocaleString()}
              </span>
            )}
          </div>
        );
      },
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
      title: "Actions",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, order) => {
        const statusLower = (order.status || "").toLowerCase();
        const isEditable = ["pending", "processing"].includes(statusLower);

        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View Details",
            onClick: () => navigate(`/orders/${order.orderId}/view`),
          },
          {
            key: "invoice",
            icon: <IconPrinter size={14} />,
            label: "Print PDF",
            onClick: () => {
              setPreviewOrderForInvoice(order);
              setIsInvoiceModalOpen(true);
            },
          },
          ...(order.riskStatus === "HIGH_RISK" &&
          !order.deliveryFeePrepaid &&
          ((order.paymentMethod || "").toLowerCase().includes("cod") ||
            (order.paymentMethod || "").toLowerCase().includes("cash on delivery"))
            ? [
                {
                  key: "mark-fee-paid",
                  icon: <IconShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />,
                  label: <span className="font-bold text-blue-600 dark:text-blue-400">Mark Prepaid Fee Paid</span>,
                  onClick: async () => {
                    try {
                      await api.put(`/api/v1/erp/orders/${order.orderId}`, {
                        deliveryFeePrepaid: true,
                        prepaidDeliveryFeeStatus: "PAID",
                      });
                      toast.success(`Prepaid Delivery Fee marked as PAID for #${order.orderId}`);
                      fetchOrders();
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || "Failed to mark prepaid fee as paid");
                    }
                  },
                },
              ]
            : []),
          ...(statusLower === "pending" || statusLower === "processing"
            ? [
                {
                  key: "process-order",
                  icon: <IconTruck size={14} className="text-emerald-600 dark:text-emerald-400" />,
                  label: <span className="font-bold text-emerald-600 dark:text-emerald-400">Process Order</span>,
                  onClick: () => {
                    setSelectedOrderForAction(order);
                    setIsProcessOrderOpen(true);
                  },
                },
              ]
            : []),
          ...((order.paymentStatus || "").toLowerCase() !== "paid" &&
            !["cancelled", "returned", "refused (rto)", "refused"].includes(statusLower)
            ? [
                {
                  key: "process-payment",
                  icon: <IconCreditCard size={14} className="text-blue-600 dark:text-blue-400" />,
                  label: <span className="font-bold text-blue-600 dark:text-blue-400">Process Payment</span>,
                  onClick: () => {
                    setSelectedOrderForPayment(order);
                    setIsProcessPaymentOpen(true);
                  },
                },
              ]
            : []),
          ...(statusLower === "completed" || statusLower === "shipped"
            ? [
                {
                  key: "process-return",
                  icon: <IconRotate size={14} className="text-amber-600 dark:text-amber-400" />,
                  label: <span className="font-bold text-amber-600 dark:text-amber-400">Process Return</span>,
                  onClick: () => {
                    setSelectedOrderForAction(order);
                    setIsProcessReturnOpen(true);
                  },
                },
              ]
            : []),
          ...(!["cancelled", "returned", "refused (rto)", "refused"].includes(statusLower)
            ? [
                {
                  key: "process-cancel",
                  icon: <IconCircleX size={14} className="text-rose-600 dark:text-rose-400" />,
                  label: <span className="font-bold text-rose-600 dark:text-rose-400">Process Cancel</span>,
                  onClick: () => {
                    setSelectedOrderForAction(order);
                    setIsProcessCancelOpen(true);
                  },
                },
              ]
            : []),
          ...(isEditable
            ? [
                { type: "divider" as const },
                {
                  key: "edit-customer",
                  icon: <IconUser size={14} className="text-blue-600 dark:text-blue-400" />,
                  label: <span className="font-semibold text-slate-700 dark:text-slate-200">Edit Customer</span>,
                  onClick: () => {
                    setSelectedOrderForEditCustomer(order);
                    setIsEditCustomerOpen(true);
                  },
                },
                {
                  key: "edit-items",
                  icon: <IconPackage size={14} className="text-indigo-600 dark:text-indigo-400" />,
                  label: <span className="font-semibold text-slate-700 dark:text-slate-200">Edit Items</span>,
                  onClick: () => {
                    setSelectedOrderForEditItems(order);
                    setIsEditItemsOpen(true);
                  },
                },
              ]
            : []),
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const viewTitle = isProcessingView ? "Processing Orders" : isPaymentPendingView ? "Pending Payments" : "Order List";

  return (
    <PageContainer title="Order List" description={`Manage ${viewTitle}`}>
      <div className="w-full space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-card-border dark:border-card-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  {viewTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                  {pagination.total} Orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs space-y-3.5">
          <Form
            form={form}
            onFinish={handleFilterSubmit}
            className="w-full space-y-3.5"
          >
            {/* Tier 1: Search & Date Range Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex-1 min-w-[260px] max-w-2xl">
                <Form.Item name="search" className="!mb-0">
                  <Input
                    prefix={<IconSearch size={16} className="text-text-sub shrink-0" />}
                    placeholder="Search order number, customer name, email, phone..."
                    allowClear
                    onPressEnter={() => handleFilterSubmit(form.getFieldsValue())}
                    onChange={(e) => {
                      if (!e.target.value) {
                        handleFilterSubmit({ ...form.getFieldsValue(), search: "" });
                      }
                    }}
                    className="rounded-xl h-10 border-card-border dark:border-card-border-dark bg-background dark:bg-background-dark text-xs"
                  />
                </Form.Item>
              </div>

              {/* Unified Date Controls: Quick Period Segment + Custom RangePicker */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-card-border/60 dark:border-card-border-dark/60 gap-0.5">
                  {([
                    {
                      key: "today",
                      label: "Today",
                      getRange: () => [dayjs().startOf("day"), dayjs().endOf("day")] as [dayjs.Dayjs, dayjs.Dayjs],
                    },
                    {
                      key: "week",
                      label: "This Week",
                      getRange: () => [dayjs().startOf("week"), dayjs().endOf("day")] as [dayjs.Dayjs, dayjs.Dayjs],
                    },
                    {
                      key: "month",
                      label: "This Month",
                      getRange: () => [dayjs().startOf("month"), dayjs().endOf("day")] as [dayjs.Dayjs, dayjs.Dayjs],
                    },
                    {
                      key: "last_month",
                      label: "Last Month",
                      getRange: () => [
                        dayjs().subtract(1, "month").startOf("month"),
                        dayjs().subtract(1, "month").endOf("month"),
                      ] as [dayjs.Dayjs, dayjs.Dayjs],
                    },
                    {
                      key: "all",
                      label: "All Time",
                      getRange: () => undefined,
                    },
                  ] as const).map((p) => {
                    const isActive = selectedPeriod === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleQuickDateFilter(p.key, p.getRange())}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                            : "text-text-sub hover:text-text-main dark:hover:text-text-main-dark hover:bg-slate-200/60 dark:hover:bg-slate-700/60 bg-transparent"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range Picker */}
                <Form.Item name="dateRange" className="!mb-0">
                  <RangePicker
                    presets={rangePresets}
                    placeholder={["Start Date", "End Date"]}
                    onChange={(val) => {
                      if (!val) {
                        setSelectedPeriod("all");
                        handleQuickDateFilter("all", undefined);
                      } else {
                        setSelectedPeriod("custom");
                        handleFilterSubmit({ ...form.getFieldsValue(), dateRange: val });
                      }
                    }}
                    className="h-10 w-56 sm:w-60 rounded-xl border-card-border dark:border-card-border-dark text-xs"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Tier 2: Attribute Filters & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-card-border/60 dark:border-card-border-dark/60">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-text-sub text-[11px] font-bold uppercase tracking-wider mr-1">
                  <IconAdjustmentsHorizontal size={15} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                {!isPaymentPendingView && (
                  <Form.Item name="payment" className="!mb-0">
                    <Select
                      className="h-9 min-w-[145px] rounded-xl text-xs"
                      onChange={() => handleFilterSubmit(form.getFieldsValue())}
                      popupMatchSelectWidth={false}
                    >
                      <Option value="all">Payment: All</Option>
                      <Option value="Paid">Payment: Paid</Option>
                      <Option value="Pending">Payment: Pending</Option>
                      <Option value="Failed">Payment: Failed</Option>
                      <Option value="Refunded">Payment: Refunded</Option>
                    </Select>
                  </Form.Item>
                )}

                {!isProcessingView && (
                  <Form.Item name="status" className="!mb-0">
                    <Select
                      className="h-9 min-w-[145px] rounded-xl text-xs"
                      onChange={() => handleFilterSubmit(form.getFieldsValue())}
                      popupMatchSelectWidth={false}
                    >
                      <Option value="all">Status: All</Option>
                      <Option value="Pending">Status: Pending</Option>
                      <Option value="Processing">Status: Processing</Option>
                      <Option value="Completed">Status: Completed</Option>
                      <Option value="Cancelled">Status: Cancelled</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item name="from" className="!mb-0">
                  <Select
                    className="h-9 min-w-[135px] rounded-xl text-xs"
                    onChange={() => handleFilterSubmit(form.getFieldsValue())}
                    popupMatchSelectWidth={false}
                  >
                    <Option value="all">Channel: All</Option>
                    <Option value="website">Channel: Website</Option>
                    <Option value="store">Channel: Store</Option>
                    <Option value="admin">Channel: Admin</Option>
                  </Select>
                </Form.Item>

                <Space size={8}>
                  <Button
                    type="default"
                    htmlType="submit"
                    icon={<IconFilter size={14} />}
                    className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none text-white text-xs font-bold h-9 px-3.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Apply
                  </Button>

                  {activeFiltersCount > 0 && (
                    <Button
                      icon={<IconX size={14} />}
                      onClick={handleClearFilters}
                      className="border border-card-border dark:border-card-border-dark text-text-sub hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold h-9 px-3 rounded-xl cursor-pointer inline-flex items-center gap-1 bg-transparent"
                    >
                      Reset
                    </Button>
                  )}
                </Space>
              </div>

              <div className="text-[11px] text-text-sub/70 italic hidden md:flex items-center gap-1">
                Tip: Order ID search searches across all lifetime records
              </div>
            </div>
          </Form>
        </div>

        {/* Bulk Action Alert Panel */}
        {selectedRowKeys.length > 0 && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {selectedRowKeys.length} Order{selectedRowKeys.length > 1 ? "s" : ""} Selected
                </span>
                <div className="bg-slate-700 dark:bg-slate-300 w-[1px] h-5" />
                <Space size="middle">
                  {isProcessingView && (
                    <Button 
                      type="primary" 
                      size="middle" 
                      icon={<IconPackageExport size={16} />}
                      className="bg-emerald-600 hover:bg-emerald-700 border-none font-bold rounded-xl h-9 text-xs flex items-center cursor-pointer"
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
                      className="bg-emerald-600 hover:bg-emerald-700 border-none font-bold rounded-xl h-9 text-xs flex items-center cursor-pointer"
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
                className="text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer" 
                onClick={() => setSelectedRowKeys([])} 
              />
            </div>
          </div>
        )}

        {/* Table UI */}
        <Spinner spinning={isLoading || isBulkLoading}>
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              rowSelection={(isProcessingView || isPaymentPendingView) ? {
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              } : undefined}
              columns={columns}
              dataSource={orders}
              rowKey="orderId"
              pagination={{ ...pagination, position: ["bottomRight"], showTotal: (total) => `Total ${total} records` }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              className="ant-table-fluid"
            />
          </div>
        </Spinner>
      </div>

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

      <InvoicePreviewModal
        open={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={previewOrderForInvoice}
      />

      <ProcessOrderModal
        open={isProcessOrderOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessOrderOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />

      <ProcessPaymentModal
        open={isProcessPaymentOpen}
        order={selectedOrderForPayment}
        onClose={() => {
          setIsProcessPaymentOpen(false);
          setSelectedOrderForPayment(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />

      <ProcessReturnModal
        open={isProcessReturnOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessReturnOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />

      <ProcessCancelModal
        open={isProcessCancelOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessCancelOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />

      <EditCustomerModal
        open={isEditCustomerOpen}
        order={selectedOrderForEditCustomer}
        onClose={() => {
          setIsEditCustomerOpen(false);
          setSelectedOrderForEditCustomer(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />

      <EditOrderItemsModal
        open={isEditItemsOpen}
        order={selectedOrderForEditItems}
        onClose={() => {
          setIsEditItemsOpen(false);
          setSelectedOrderForEditItems(null);
        }}
        onSuccess={() => {
          fetchOrders({ page: pagination.current });
        }}
      />
    </PageContainer>
  );
};

export default OrdersPage;
