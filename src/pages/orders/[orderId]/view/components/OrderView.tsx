import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { useNavigate } from "react-router-dom";
import { Table, Timeline, Button as AntButton, Divider, Image } from "antd";
import Spinner from "@/pages/components/shared/Spinner";
import {
  IconEdit,
  IconPrinter,
  IconCoin,
  IconPackage,
  IconCreditCard,
  IconCalendar,
  IconTruck,
  IconMapPin,
  IconBuildingStore,
  IconShieldCheck,
  IconShieldX,
  IconLock,
  IconUser,
  IconMail,
  IconPhone,
  IconRotate,
  IconX,
  IconCircleX,
} from "@tabler/icons-react";

import { OrderExchangeHistory } from "../../components/OrderExchangeHistory";
import CommunicationHub from "../../components/CommunicationHub";
import { InvoicePreviewModal } from "../../components/InvoicePreviewModal";
import { formatSLDateTime } from "@/utils/dateUtils";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { ProcessOrderModal } from "@/pages/orders/components/ProcessOrderModal";
import { ProcessReturnModal } from "@/pages/orders/components/ProcessReturnModal";
import { ProcessCancelModal } from "@/pages/orders/components/ProcessCancelModal";

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [stocks, setStocks] = useState<Record<string, any>[]>([]);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSpammerBlacklisted, setIsSpammerBlacklisted] = useState(false);

  // Workflow Modals State
  const [isProcessOrderOpen, setIsProcessOrderOpen] = useState(false);
  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [isProcessCancelOpen, setIsProcessCancelOpen] = useState(false);

  const { currentUser } = useAppSelector((state: any) => state.authSlice);
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();

  const checkSpammerStatus = async (phone?: string, email?: string) => {
    try {
      const params = new URLSearchParams();
      if (phone) params.append("phone", phone);
      if (email) params.append("email", email);
      const res = await api.get(`/api/v1/erp/spammers/check?${params.toString()}`);
      if (res.data?.isBlacklisted) {
        setIsSpammerBlacklisted(true);
      } else {
        setIsSpammerBlacklisted(false);
      }
    } catch (err) {
      console.warn("Spammer status check error", err);
    }
  };

  const handleFlagAsSpammer = () => {
    if (!order?.customer?.phone && !order?.customer?.email) {
      toast.error("Customer contact info missing");
      return;
    }

    showConfirmation({
      title: "Flag Customer as Spammer?",
      message: `Are you sure you want to add ${order.customer?.name || "this customer"} (${order.customer?.phone || order.customer?.email}) to the internal Spammer Blacklist? Future COD orders from this customer will require prepaid delivery fees.`,
      confirmText: "Blacklist Customer",
      cancelText: "Cancel",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.post("/api/v1/erp/spammers", {
            name: order.customer?.name || "",
            phone: order.customer?.phone || "",
            email: order.customer?.email || "",
            address: order.customer?.address || "",
            city: order.customer?.city || "",
            reason: "Refused COD Package at Door",
            severity: "HIGH",
          });
          setIsSpammerBlacklisted(true);
          toast.success("Customer added to Spammer Blacklist!");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to flag customer as spammer");
        }
      },
    });
  };

  useEffect(() => {
    if (order && (order.customer?.phone || order.customer?.email)) {
      checkSpammerStatus(order.customer?.phone, order.customer?.email);
    }
  }, [order]);

  useEffect(() => {
    if (order && order.trackingNumber) {
      fetchTracking(order.orderId);
    }
  }, [order]);

  const fetchTracking = async (id: string) => {
    try {
      setLoadingTracking(true);
      const res = await api.get(`/api/v1/erp/orders/${id}/tracking`);
      setTrackingHistory(res.data.data.history || []);
    } catch (error) {
      console.error("Failed to fetch tracking history", error);
    } finally {
      setLoadingTracking(false);
    }
  };

  useEffect(() => {
    if (order && order.items && order.items.length > 0) {
      fetchItemImages();
    }
  }, [order]);

  const fetchItemImages = async () => {
    try {
      const uniqueProductIds = Array.from(
        new Set(order.items.map((item: any) => item.itemId).filter(Boolean))
      );

      const imageMap: Record<string, string> = {};

      await Promise.all(
        uniqueProductIds.map(async (productId: any) => {
          try {
            const res = await api.get(`/api/v1/erp/master/products/${productId}`);
            const product = res.data;
            if (product && product.variants) {
              product.variants.forEach((v: any) => {
                if (v.images && v.images.length > 0) {
                  const key = `${productId}_${v.variantId}`;
                  imageMap[key] = v.images[0].url;
                }
              });
              if (product.thumbnail && product.thumbnail.url) {
                imageMap[`${productId}_fallback`] = product.thumbnail.url;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch product ${productId} details`, err);
          }
        })
      );

      setItemImages(imageMap);
    } catch (error) {
      console.error("Failed to fetch item images", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrderAndStocks();
    }
  }, [currentUser]);

  const fetchOrderAndStocks = async () => {
    try {
      setLoadingOrder(true);
      const [orderRes, stocksRes] = await Promise.all([
        api.get(`/api/v1/erp/orders/${orderId}`),
        api.get("/api/v1/erp/master/stocks/dropdown").catch(() => ({ data: [] })),
      ]);
      setOrder(orderRes.data || null);
      setStocks(stocksRes.data || []);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error(err);
      toast.error(err.message || "Failed to fetch order");
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal =
    order?.items?.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0) || 0;

  const itemDiscountTotal =
    order?.items?.reduce((acc, item) => acc + (item.discount || 0) * (item.quantity || 1), 0) || 0;

  const couponDiscount = order?.couponDiscount || 0;
  const promotionDiscount = order?.promotionDiscount || 0;

  const manualDiscount = Math.max(
    0,
    (order?.discount || 0) - couponDiscount - promotionDiscount - itemDiscountTotal
  );

  const accountedDiscounts = itemDiscountTotal + couponDiscount + promotionDiscount + manualDiscount;
  const fallbackDiscount = Math.max(
    0,
    subtotal + (order?.shippingFee || 0) + (order?.fee || 0) - (order?.total || 0) - accountedDiscounts
  );

  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;
  const isPaidWebsiteOrder =
    order?.from?.toLowerCase() === "website" && order?.paymentStatus?.toLowerCase() === "paid";
  const totalPaid = isPaidWebsiteOrder
    ? order?.total || 0
    : order?.paymentReceived?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = isPaidWebsiteOrder ? 0 : (order?.total || 0) - totalPaid;

  if (loadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="large" tip="Loading Order Details..." />
      </div>
    );
  }

  const getPaymentStatusBadge = (status?: string) => {
    const st = status?.toLowerCase();
    switch (st) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PAID
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            PENDING
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            FAILED
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {status?.toUpperCase() || "UNKNOWN"}
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status?: string) => {
    const st = status?.toLowerCase();
    switch (st) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            COMPLETED
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            PROCESSING
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {status?.toUpperCase() || "PENDING"}
          </span>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "C";
    const parts = name.split(" ");
    return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  };

  const columns = [
    {
      title: "Product Item",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Record<string, any>) => {
        const key = `${record.itemId}_${record.variantId}`;
        const imageUrl = itemImages[key] || itemImages[`${record.itemId}_fallback`] || "";

        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-11 h-11 rounded-lg overflow-hidden border border-card-border dark:border-card-border-dark flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                <Image
                  src={imageUrl}
                  alt={text}
                  width={44}
                  height={44}
                  className="object-cover rounded-lg"
                  preview={{
                    mask: <span className="text-[9px] font-bold">View</span>,
                  }}
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-sub flex-shrink-0 border border-card-border dark:border-card-border-dark">
                <IconPackage size={18} />
              </div>
            )}
            <div>
              <span className="font-bold text-xs text-text-main dark:text-text-main-dark block">{text}</span>
              {record.isComboItem && (
                <span className="inline-block text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 rounded px-1.5 py-0.5 mt-1 uppercase font-mono">
                  BIN: {record.comboName}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Variant",
      dataIndex: "variantName",
      key: "variantName",
      render: (text: string) => {
        if (!text) return <span className="text-text-sub dark:text-slate-500 font-semibold">—</span>;
        const formatted = text.replace(/\b\w/g, (char) => char.toUpperCase());
        return <span className="text-xs font-semibold text-text-sub dark:text-slate-400">{formatted}</span>;
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center" as const,
      render: (size: string) => (
        <span className="inline-block text-[10px] font-bold text-text-sub bg-slate-100 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded px-2 py-0.5 uppercase font-mono">
          {size || "—"}
        </span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (qty: number) => (
        <span className="font-bold text-xs text-text-main dark:text-text-main-dark font-mono">{qty}</span>
      ),
    },
    {
      title: "Price Breakdown",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      width: 180,
      render: (price: number, record: Record<string, any>) => {
        const disc = record.discount || 0;
        const sold = price - disc;
        return (
          <div className="flex flex-col items-end gap-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-sub font-bold uppercase">Retail</span>
              <span className="line-through text-text-sub">Rs {price.toLocaleString()}</span>
            </div>
            {disc > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-rose-500 font-bold uppercase">Disc</span>
                <span className="text-rose-500 font-bold">-Rs {disc.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-0.5 border-t border-card-border dark:border-card-border-dark border-dashed w-full justify-end">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Sold</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rs {sold.toLocaleString()}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Line Total",
      key: "total",
      align: "right" as const,
      width: 130,
      render: (_: unknown, record: Record<string, any>) => (
        <span className="font-mono text-xs font-bold text-text-main dark:text-text-main-dark bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 rounded-lg border border-card-border dark:border-card-border-dark">
          Rs {((record.quantity || 0) * ((record.price || 0) - (record.discount || 0))).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 flex flex-col">
      {/* Single Column Vertical Stack Layout */}
      <div className="w-full flex flex-col gap-6">
        {/* CARD 1: Single Order Details & Customer Coordinates Card */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-6">
          {/* IPQS Anti-Spam Risk Meter Banner */}
          {(order?.riskStatus === "HIGH_RISK" || order?.ipqsFraudScore !== undefined) && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400 font-bold shrink-0">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      IPQS Phone Fraud Risk: {order.ipqsFraudScore ?? 85} / 100 ({order.ipqsRiskLevel || "HIGH"})
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                      High Risk Flagged
                    </span>
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    Line Type: <span className="font-bold">{order.ipqsLineType || "Prepaid Mobile"}</span>
                    {order.ipqsReasons && order.ipqsReasons.length > 0 && (
                      <span className="ml-2">({order.ipqsReasons.join(" • ")})</span>
                    )}
                  </p>
                </div>
              </div>
              {order.deliveryFeePrepaid && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono shrink-0">
                  ✓ Delivery Fee Prepaid (Rs. 450)
                </div>
              )}
            </div>
          )}

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-card-border dark:border-card-border-dark">
            <div className="flex items-center gap-2">
              <IconShieldCheck size={18} className="text-brand dark:text-brand-dark" />
              <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                Order Details & Customer Coordinates
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {(order?.from || "").toLowerCase() === "store" ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono border border-blue-200 dark:border-blue-800">
                  <IconBuildingStore size={16} className="text-blue-600 dark:text-blue-400" />
                  Store POS Order (Exchanges handled via POS)
                </div>
              ) : (
                <>
                  {/* Process Order Workflow Button (Website orders in Pending/Processing status) */}
                  {["pending", "processing"].includes((order?.status || "").toLowerCase()) && (
                    <AntButton
                      type="primary"
                      icon={<IconTruck size={16} />}
                      onClick={() => setIsProcessOrderOpen(true)}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm border-none cursor-pointer"
                    >
                      Process Order
                    </AntButton>
                  )}

                  {/* Process Return Workflow Button (Website orders in Completed/Shipped status) */}
                  {["completed", "shipped"].includes((order?.status || "").toLowerCase()) && (
                    <AntButton
                      type="default"
                      icon={<IconRotate size={16} />}
                      onClick={() => setIsProcessReturnOpen(true)}
                      className="h-10 rounded-xl border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      Process Return
                    </AntButton>
                  )}

                  {/* Process Cancel Workflow Button (Website orders) */}
                  {!["cancelled", "returned", "refused (rto)", "refused"].includes((order?.status || "").toLowerCase()) && (
                    <AntButton
                      type="default"
                      danger
                      icon={<IconCircleX size={16} />}
                      onClick={() => setIsProcessCancelOpen(true)}
                      className="h-10 rounded-xl border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      Process Cancellation
                    </AntButton>
                  )}

                  {/* Configure / Edit button (ONLY for Website orders in Processing/Pending status) */}
                  {["pending", "processing"].includes((order?.status || "").toLowerCase()) ? (
                    <AntButton
                      type="primary"
                      icon={<IconEdit size={16} />}
                      onClick={() => navigate(`/orders/${orderId}`)}
                      className="h-10 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      Configure / Edit
                    </AntButton>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold font-mono border border-slate-200 dark:border-slate-700">
                      <IconLock size={15} />
                      🔒 Order Frozen
                    </div>
                  )}
                </>
              )}

              <AntButton
                type="default"
                icon={<IconPrinter size={16} />}
                onClick={() => setIsInvoiceModalOpen(true)}
                className="h-10 rounded-xl border-card-border dark:border-card-border-dark text-text-sub dark:text-slate-300 hover:text-text-main dark:hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                Print PDF
              </AntButton>

              {isSpammerBlacklisted ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold font-mono border border-rose-200 dark:border-rose-800">
                  <IconShieldX size={16} className="text-rose-600 dark:text-rose-400" />
                  ✓ Blacklisted Spammer
                </div>
              ) : (
                <AntButton
                  type="default"
                  danger
                  icon={<IconShieldX size={16} />}
                  onClick={handleFlagAsSpammer}
                  className="h-10 rounded-xl border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  Flag Spammer
                </AntButton>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Fulfillment Status</span>
              <div>{getOrderStatusBadge(order?.status)}</div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Payment Status</span>
              <div>{getPaymentStatusBadge(order?.paymentStatus)}</div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Placement Date</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                {formatSLDateTime(order?.createdAt) || "N/A"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Last Updated</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                {formatSLDateTime(order?.updatedAt) || "N/A"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Order Source</span>
              <span className="font-bold text-text-main dark:text-text-main-dark uppercase">
                {order?.from || "Store"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Payment Method</span>
              <span className="font-bold text-text-main dark:text-text-main-dark uppercase">
                {order?.paymentMethod || "N/A"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Transaction ID</span>
              <span className="font-bold text-text-main dark:text-text-main-dark break-all">
                {order?.paymentId || "N/A"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Fulfillment Stock</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                {stocks.find((s) => s.id === order?.stockId)?.label || "Online Stock"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Shipping Courier</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                {order?.courier || "Not Dispatched"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Waybill / Tracking #</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                {order?.trackingNumber || "—"}
              </span>
            </div>

            {order?.estimatedDelivery && (
              <div>
                <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Estimated Delivery</span>
                <span className="font-bold text-text-main dark:text-text-main-dark">
                  {formatSLDateTime(order.estimatedDelivery)}
                </span>
              </div>
            )}
          </div>

          {/* Customer Profile & Address Info */}
          {order?.customer && (
            <div className="pt-6 border-t border-card-border dark:border-card-border-dark space-y-4">
              <div className="flex items-center gap-2">
                <IconUser size={16} className="text-brand dark:text-brand-dark" />
                <span className="text-xs font-bold text-text-main dark:text-text-main-dark uppercase font-mono tracking-wider">
                  Customer Profile & Delivery Info
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs font-mono">
                      {getInitials(order.customer.name)}
                    </div>
                    <div>
                      <span className="block font-bold text-text-main dark:text-text-main-dark">
                        {order.customer.name}
                      </span>
                      <span className="block text-[10px] text-text-sub font-bold uppercase font-mono">
                        User ID: {order.userId || "GUEST"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-text-sub pt-1">
                    {order.customer.email && (
                      <div className="flex items-center gap-2">
                        <IconMail size={14} />
                        <span>{order.customer.email}</span>
                      </div>
                    )}
                    {order.customer.phone && (
                      <div className="flex items-center gap-2 font-mono">
                        <IconPhone size={14} />
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase tracking-wider font-mono mb-1">
                    Billing Address
                  </span>
                  <p className="text-text-main dark:text-text-main-dark leading-relaxed">
                    {order.customer.address || "No address provided"}
                    {order.customer.city && `, ${order.customer.city}`}
                    {order.customer.zip && ` ${order.customer.zip}`}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase tracking-wider font-mono mb-1">
                    Shipping Destination
                  </span>
                  <p className="font-bold text-text-main dark:text-text-main-dark">
                    {order.customer.shippingName || order.customer.name}
                  </p>
                  <p className="text-text-sub leading-relaxed">
                    {order.customer.shippingAddress || "Same as billing address"}
                    {order.customer.shippingCity && `, ${order.customer.shippingCity}`}
                    {order.customer.shippingZip && ` ${order.customer.shippingZip}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: Order Items Table Card */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
            <div className="flex items-center gap-2">
              <IconPackage size={18} className="text-brand dark:text-brand-dark" />
              <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                Order Items ({order?.items?.length || 0})
              </h3>
            </div>
          </div>

          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 600 }}
              dataSource={order?.items || []}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => `${record.productId}_${index}`}
              size="small"
              className="rounded-xl overflow-hidden"
            />
          </div>
        </div>

        {/* CARD 3: Single Finance Summary Card */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
            <IconCoin size={18} className="text-brand dark:text-brand-dark" />
            <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
              Finance Summary
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-sub font-semibold uppercase">Subtotal</span>
              <span className="font-bold text-text-main dark:text-text-main-dark">
                Rs {subtotal.toLocaleString()}
              </span>
            </div>

            {itemDiscountTotal > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span className="font-semibold uppercase">Item Level Discounts</span>
                <span className="font-bold">-Rs {itemDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {promotionDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold uppercase">Promotion Discount</span>
                <span className="font-bold">-Rs {promotionDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold uppercase">
                  Coupon Discount {order?.couponCode ? `(${order.couponCode})` : ""}
                </span>
                <span className="font-bold">-Rs {couponDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {manualDiscount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span className="font-semibold uppercase">Manual Discount</span>
                <span className="font-bold">-Rs {manualDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {fallbackDiscount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span className="font-semibold uppercase">Discounts Applied</span>
                <span className="font-bold">-Rs {fallbackDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-text-sub font-semibold uppercase">Shipping Fee</span>
              <span className="font-semibold text-text-main dark:text-text-main-dark">
                Rs {shippingFee.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-sub font-semibold uppercase">Handling Fee</span>
              <span className="font-semibold text-text-main dark:text-text-main-dark">
                Rs {fee.toLocaleString()}
              </span>
            </div>

            <Divider className="my-2 border-card-border dark:border-card-border-dark" />

            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-4 rounded-xl flex justify-between items-center shadow-xs">
              <span className="text-xs font-bold uppercase">Grand Total</span>
              <span className="text-lg font-bold text-emerald-400 dark:text-emerald-700">
                Rs {order?.total?.toLocaleString()}
              </span>
            </div>

            {/* Payment Tally Summary */}
            {((order?.paymentReceived && order.paymentReceived.length > 0) || isPaidWebsiteOrder) && (
              <div className="pt-3 border-t border-dashed border-card-border dark:border-card-border-dark space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-sub uppercase">Total Paid</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Rs {totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-sub uppercase">Balance Due</span>
                  <span className={`font-bold ${balanceDue <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                    {balanceDue <= 0 ? "PAID" : `Rs ${balanceDue.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: Last Notifications, Live Courier & Interactions Section */}
        <div className="space-y-6">
          {/* Live Courier History Card */}
          {order?.trackingNumber && (
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
                <div className="flex items-center gap-2">
                  <IconTruck size={18} className="text-brand dark:text-brand-dark" />
                  <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                    Live Courier Notifications (Domex)
                  </h3>
                </div>
                <AntButton
                  href={`https://domex.lk/Order-Details.php?wbno=${order.trackingNumber}`}
                  target="_blank"
                  type="default"
                  size="small"
                  className="text-[10px] uppercase font-bold rounded-lg h-7 px-3 font-mono"
                >
                  Domex Site
                </AntButton>
              </div>

              <Spinner spinning={loadingTracking}>
                {trackingHistory.length > 0 ? (
                  <Timeline
                    className="mt-4"
                    items={[...trackingHistory].reverse().map((event) => ({
                      children: (
                        <div className="flex flex-col font-mono text-xs">
                          <span className="font-bold text-text-main dark:text-text-main-dark">{event.status}</span>
                          <span className="text-[10px] text-text-sub">{event.date}</span>
                        </div>
                      ),
                      color: event.status.toLowerCase().includes("delivered") ? "green" : "blue",
                    }))}
                  />
                ) : (
                  <div className="text-center py-6 text-text-sub text-xs font-semibold italic">
                    No live tracking notifications available for waybill #{order.trackingNumber} yet.
                  </div>
                )}
              </Spinner>
            </div>
          )}

          {/* Dynamic Interaction Sub-cards */}
          <CommunicationHub orderId={orderId} customerName={order?.customer?.name} />
          <OrderExchangeHistory orderId={orderId} />
        </div>
      </div>

      <InvoicePreviewModal
        open={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={order}
      />

      <ProcessOrderModal
        open={isProcessOrderOpen}
        order={order}
        onClose={() => setIsProcessOrderOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <ProcessReturnModal
        open={isProcessReturnOpen}
        order={order}
        onClose={() => setIsProcessReturnOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <ProcessCancelModal
        open={isProcessCancelOpen}
        order={order}
        onClose={() => setIsProcessCancelOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default OrderView;
