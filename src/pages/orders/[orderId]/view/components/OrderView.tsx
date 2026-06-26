import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Typography,
  Alert,
  Spin,
  Timeline,
  Button as AntButton,
  Divider,
  Image,
} from "antd";
import {
  IconArrowLeft,
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
  IconUser,
  IconMail,
  IconPhone,
  IconAlertCircle,
} from "@tabler/icons-react";

import { OrderExchangeHistory } from "../../components/OrderExchangeHistory";
import CommunicationHub from "../../components/CommunicationHub";
import { formatSLDateTime } from "@/utils/dateUtils";

const { Text } = Typography;

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [stocks, setStocks] = useState<Record<string, any>[]>([]);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});

  const { currentUser } = useAppSelector((state: any) => state.authSlice);
  const navigate = useNavigate();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchOrderAndStocks = async () => {
    try {
      setLoadingOrder(true);
      const [orderRes, stocksRes] = await Promise.all([
        api.get(`/api/v1/erp/orders/${orderId}`),
        api
          .get("/api/v1/erp/master/stocks/dropdown")
          .catch(() => ({ data: [] })),
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

  const subtotal = order?.items?.reduce(
    (acc, item) => acc + ((item.price || 0) * (item.quantity || 1)),
    0
  ) || 0;

  const itemDiscounts = order?.items?.reduce(
    (acc, item) => acc + ((item.discount || 0) * (item.quantity || 1)),
    0
  ) || 0;

  const manualOrItemDiscount = Math.max(
    0,
    (order?.discount || 0) - (order?.couponDiscount || 0) - (order?.promotionDiscount || 0)
  );

  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;
  const isPaidWebsiteOrder =
    order?.from?.toLowerCase() === "website" &&
    order?.paymentStatus?.toLowerCase() === "paid";
  const totalPaid = isPaidWebsiteOrder
    ? (order?.total || 0)
    : (order?.paymentReceived?.reduce((sum, p) => sum + p.amount, 0) || 0);
  const balanceDue = isPaidWebsiteOrder ? 0 : (order?.total || 0) - totalPaid;

  if (loadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  // --- Helpers for Status Colors ---
  const getPaymentStatusBadge = (status?: string) => {
    const st = status?.toLowerCase();
    switch (st) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PAID
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            PENDING
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            FAILED
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            COMPLETED
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            PROCESSING
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
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

  // --- Table Columns ---
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
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 flex items-center justify-center bg-gray-50 cursor-pointer">
                <Image
                  src={imageUrl}
                  alt={text}
                  width={48}
                  height={48}
                  className="object-cover rounded-lg"
                  preview={{
                    mask: <span className="text-[9px] font-bold">Preview</span>
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 border border-gray-100">
                <IconPackage size={20} />
              </div>
            )}
            <div>
              <span className="font-bold text-xs text-gray-800 block">{text}</span>
              {record.isComboItem && (
                <span className="inline-block text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5 mt-1 uppercase">
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
        if (!text) return <span className="text-gray-400 font-semibold">-</span>;
        const formatted = text.replace(/\b\w/g, (char) => char.toUpperCase());
        return (
          <span className="text-xs font-semibold text-gray-600">
            {formatted}
          </span>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center" as const,
      render: (size: string) => (
        <span className="inline-block text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 uppercase">
          {size}
        </span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (qty: number) => (
        <span className="font-bold text-xs text-gray-800">{qty}</span>
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
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase">Retail</span>
              <span className="text-xs line-through text-gray-400">
                Rs {price.toLocaleString()}
              </span>
            </div>
            {disc > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-red-400 font-bold uppercase">Disc</span>
                <span className="text-xs text-red-500 font-bold">
                  -Rs {disc.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5 pt-0.5 border-t border-gray-100 border-dashed w-full justify-end">
              <span className="text-[9px] text-emerald-600 font-bold uppercase">Sold</span>
              <span className="text-xs text-emerald-700 font-black">
                Rs {sold.toLocaleString()}
              </span>
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
        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
          Rs {(
            (record.quantity || 0) *
            ((record.price || 0) - (record.discount || 0))
          ).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ⚠️ Security Alert */}
      {order && order.integrity === false && (
        <Alert
          message="Security Integrity Check Failed"
          description="This order has failed system integrity checks. Please exercise extreme caution before proceeding."
          type="error"
          showIcon
          className="rounded-2xl border-none shadow-sm"
        />
      )}

      {/* Modern Header Action Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer text-gray-600 transition" onClick={() => navigate("/orders")}>
            <IconArrowLeft size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                Order Log
              </span>
              <span className="text-[9px] font-bold text-gray-400">
                Created {formatSLDateTime(order?.createdAt)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
              Order #{order?.orderId}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <AntButton
            icon={<IconPrinter size={16} />}
            onClick={() => navigate(`/orders/${orderId}/invoice`)}
            className="flex-1 sm:flex-initial h-10 rounded-xl border-gray-200 text-gray-600 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-none"
          >
            Invoice
          </AntButton>
          <AntButton
            type="primary"
            icon={<IconEdit size={16} />}
            onClick={() => navigate(`/orders/${orderId}`)}
            className="flex-1 sm:flex-initial h-10 rounded-xl bg-black border-none text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-none"
          >
            Edit Order
          </AntButton>
        </div>
      </div>

      {/* KPI Stats Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grand Total</span>
            <h3 className="text-xl font-black text-gray-900">
              Rs {order?.total?.toLocaleString()}
            </h3>
            <span className="block text-[10px] text-gray-400 font-bold">
              Paid: Rs {totalPaid.toLocaleString()} | Due: Rs {balanceDue.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <IconCoin size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fulfillment Status</span>
            <div className="block">{getOrderStatusBadge(order?.status)}</div>
            <span className="block text-[10px] text-gray-400 font-bold">
              Source: <span className="uppercase text-gray-500">{order?.from || "Store"}</span>
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <IconPackage size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Status</span>
            <div className="block">{getPaymentStatusBadge(order?.paymentStatus)}</div>
            <span className="block text-[10px] text-gray-400 font-bold">
              Method: <span className="uppercase text-gray-500">{order?.paymentMethod || "N/A"}</span>
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <IconCreditCard size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order Items Table Card */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <IconPackage size={18} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Order Items ({order?.items?.length || 0})
                </span>
              </div>
            }
            className="shadow-sm border-gray-100 rounded-2xl overflow-hidden bg-white"
          >
            <Table
              scroll={{ x: 600 }}
              dataSource={order?.items || []}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => `${record.productId}_${index}`}
              size="small"
              className="border border-gray-100 rounded-xl overflow-hidden"
            />
          </Card>

          {/* Order Overview Card */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <IconShieldCheck size={18} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Order Overview
                </span>
              </div>
            }
            className="shadow-sm border-gray-100 rounded-2xl bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconCalendar size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Placement Date</span>
                  <span className="text-xs font-bold text-gray-800">
                    {formatSLDateTime(order?.createdAt) || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconCalendar size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Last Updated</span>
                  <span className="text-xs font-bold text-gray-800">
                    {formatSLDateTime(order?.updatedAt) || "N/A"}
                  </span>
                </div>
              </div>



              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconCreditCard size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Transaction ID</span>
                  <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 break-all">
                    {order?.paymentId || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconBuildingStore size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Fulfillment Stock</span>
                  <span className="text-xs font-bold text-gray-800">
                    {stocks.find((s) => s.id === order?.stockId)?.label || "Website/Online Stock"}
                    <span className="block text-[10px] text-gray-400 font-medium">
                      Location ID: {order?.stockId || "Online"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconTruck size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Shipping Courier</span>
                  <span className="text-xs font-bold text-gray-800">
                    {order?.courier || "Not Dispatched"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                  <IconMapPin size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Tracking Number</span>
                  <span className="text-xs font-bold text-gray-800">
                    {order?.trackingNumber || "No tracking linked"}
                  </span>
                </div>
              </div>

              {order?.estimatedDelivery && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                    <IconCalendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Estimated Delivery</span>
                    <span className="text-xs font-bold text-gray-800">
                      {formatSLDateTime(order.estimatedDelivery)}
                    </span>
                  </div>
                </div>
              )}

              {order?.transactionFeeCharge !== undefined && order?.transactionFeeCharge > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <IconCoin size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-rose-500 uppercase">IPG Transaction Cost</span>
                    <span className="text-xs font-bold text-rose-800 font-mono">
                      Rs {order.transactionFeeCharge.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {order?.restocked && (
                <div className="flex items-start gap-3 col-span-2 border-t border-gray-100 pt-3 mt-1">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <IconPackage size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">Stock Returned / Restocked</span>
                    <span className="text-xs font-bold text-emerald-800">
                      Restocked {order.restockedAt ? `on ${formatSLDateTime(order.restockedAt)}` : "Yes"}
                    </span>
                  </div>
                </div>
              )}

              {order?.couponCode && (
                <div className="flex items-start gap-3 col-span-2 border-t border-gray-100 pt-3 mt-1">
                  <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                    <IconShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-green-600 uppercase">Applied Coupon Code</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100 mt-0.5">
                      {order.couponCode}
                    </span>
                    {order.appliedCouponId && (
                      <span className="block text-[8px] text-gray-400 font-bold uppercase mt-0.5">ID: {order.appliedCouponId}</span>
                    )}
                  </div>
                </div>
              )}

              {order?.appliedPromotionIds && order.appliedPromotionIds.length > 0 && (
                <div className="flex items-start gap-3 col-span-2 border-t border-gray-100 pt-3 mt-1">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <IconPackage size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-blue-600 uppercase">Applied Campaign Promotions</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {order.appliedPromotionIds.map((promoId) => (
                        <span key={promoId} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          {promoId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Internal Order History */}
          {order?.statusHistory && order.statusHistory.length > 0 && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconCalendar size={18} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Internal Order History
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl bg-white"
            >
              <Timeline
                className="mt-4"
                items={order.statusHistory.map((historyItem) => ({
                  children: (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 uppercase">
                        {historyItem.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {formatSLDateTime(historyItem.date)}
                      </span>
                    </div>
                  ),
                  color: historyItem.status.toLowerCase() === "completed"
                    ? "green"
                    : historyItem.status.toLowerCase() === "cancelled"
                      ? "gray"
                      : "blue",
                }))}
              />
            </Card>
          )}

          {/* Tracking History Timeline */}
          {order?.trackingNumber && (
            <Card
              loading={loadingTracking}
              title={
                <div className="flex items-center gap-2">
                  <IconTruck size={18} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Live Courier History (Domex)
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl bg-white"
            >
              {trackingHistory.length > 0 ? (
                <Timeline
                  className="mt-4"
                  items={[...trackingHistory].reverse().map((event) => ({
                    children: (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">
                          {event.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {event.date}
                        </span>
                      </div>
                    ),
                    color: event.status.toLowerCase().includes("delivered")
                      ? "green"
                      : "blue",
                  }))}
                />
              ) : (
                <div className="text-center py-6 flex flex-col items-center gap-3">
                  <span className="text-gray-400 text-xs font-semibold italic">
                    No live tracking history available for waybill #{order.trackingNumber} yet.
                  </span>
                  <AntButton
                    href={`https://domex.lk/Order-Details.php?wbno=${order.trackingNumber}`}
                    target="_blank"
                    type="dashed"
                    size="small"
                    className="text-[10px] uppercase font-bold rounded-lg h-8 px-4"
                  >
                    View on Domex Website
                  </AntButton>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Financials & Customer Profile */}
        <div className="flex flex-col gap-6">
          {/* Financial Summary Card */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <IconCoin size={18} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Finance Overview
                </span>
              </div>
            }
            className="shadow-sm border-gray-100 rounded-2xl bg-white"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold uppercase">Subtotal</span>
                <span className="font-bold font-mono text-gray-800">
                  Rs {subtotal.toLocaleString()}
                </span>
              </div>

              {manualOrItemDiscount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-500 font-semibold uppercase">Discounts Applied</span>
                  <span className="font-bold font-mono text-red-500">
                    -Rs {manualOrItemDiscount.toLocaleString()}
                  </span>
                </div>
              )}

              {order?.couponCode && (order?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-semibold uppercase">Coupon ({order.couponCode})</span>
                  <span className="font-bold font-mono text-green-600">
                    -Rs {(order.couponDiscount || 0).toLocaleString()}
                  </span>
                </div>
              )}

              {(order?.promotionDiscount || 0) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-semibold uppercase">Auto Promotion</span>
                  <span className="font-bold font-mono text-green-600">
                    -Rs {(order.promotionDiscount || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold uppercase">Shipping</span>
                <span className="font-semibold text-gray-700 font-mono">
                  Rs {shippingFee.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold uppercase">Processing Fee</span>
                <span className="font-semibold text-gray-700 font-mono">
                  Rs {fee.toLocaleString()}
                </span>
              </div>

              <Divider className="my-2" />

              <div className="bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-emerald-950">Grand Total</span>
                <span className="font-mono font-black text-base text-emerald-700">
                  Rs {order?.total?.toLocaleString()}
                </span>
              </div>

              {/* Payment Tally Summary */}
              {((order?.paymentReceived && order.paymentReceived.length > 0) || isPaidWebsiteOrder) && (
                <div className="pt-4 border-t border-dashed border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-500 uppercase">Total Paid</span>
                    <span className="font-bold font-mono text-blue-600">
                      Rs {totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-500 uppercase">Balance Due</span>
                    <span className={`font-mono font-black ${balanceDue <= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                      {balanceDue <= 0 ? "PAID" : `Rs ${balanceDue.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Customer Profile Card */}
          {order?.customer && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconUser size={18} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Customer Profile
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl bg-white"
            >
              <div className="space-y-5">
                {/* Profile Header Avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xs">
                    {getInitials(order.customer.name)}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800 leading-tight">
                      {order.customer.name}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Client ID: {order.userId || "GUEST"}
                    </span>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs">
                    <IconMail size={14} className="text-gray-400" />
                    <span className="text-gray-600">{order.customer.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <IconPhone size={14} className="text-gray-400" />
                    <span className="text-gray-600 font-mono">{order.customer.phone || "No phone provided"}</span>
                  </div>
                </div>

                {/* Billing Address */}
                {(order.customer.address || order.customer.city) && (
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Billing Address
                    </span>
                    <span className="block text-xs text-gray-600 leading-relaxed">
                      {order.customer.address}
                      <br />
                      {order.customer.city} {order.customer.zip}
                    </span>
                  </div>
                )}

                {/* Shipping Address */}
                {order.customer.shippingAddress && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Shipping Details
                    </span>
                    <span className="block text-xs text-gray-800 font-bold leading-normal mb-1">
                      {order.customer.shippingName || order.customer.name}
                    </span>
                    <span className="block text-xs text-gray-600 leading-relaxed">
                      {order.customer.shippingAddress}
                      <br />
                      {order.customer.shippingCity} {order.customer.shippingZip}
                    </span>
                    {(order.customer.shippingPhone || order.customer.phone) && (
                      <span className="block text-[11px] text-gray-500 font-bold font-mono mt-1.5">
                        Tel: {order.customer.shippingPhone || order.customer.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Dynamic Interaction Sub-cards */}
      <CommunicationHub orderId={orderId} customerName={order?.customer?.name} />
      <OrderExchangeHistory orderId={orderId} />
    </div>
  );
};

export default OrderView;
