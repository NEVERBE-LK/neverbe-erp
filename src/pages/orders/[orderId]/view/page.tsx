import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Table, Image, Timeline, Divider } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import { OrderItem } from "@/model/OrderItem";
import toast from "react-hot-toast";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import {
  IconUser,
  IconMapPin,
  IconTruck,
  IconPackage,
  IconCoin,
  IconCalendar,
  IconExternalLink,
  IconEdit,
} from "@tabler/icons-react";
import type { ColumnsType } from "antd/es/table";
import { formatSLDateTime } from "@/utils/dateUtils";

const OrderViewPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      const data: Order = res.data;
      setOrder(data);

      if (data.items && data.items.length > 0) {
        fetchItemImages(data.items);
      }

      if (data.trackingNumber) {
        fetchLiveTracking(data.orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchItemImages = async (orderItems: OrderItem[]) => {
    try {
      const uniqueProductIds = Array.from(new Set(orderItems.map((item) => item.itemId).filter(Boolean)));
      const imageMap: Record<string, string> = {};

      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const res = await api.get(`/api/v1/erp/master/products/${productId}`);
            const product = res.data;
            if (product && product.variants) {
              product.variants.forEach((v: any) => {
                if (v.images && v.images.length > 0) {
                  imageMap[`${productId}_${v.variantId}`] = v.images[0].url;
                }
              });
              if (product.thumbnail?.url) {
                imageMap[`${productId}_fallback`] = product.thumbnail.url;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch product ${productId}`, err);
          }
        })
      );

      setItemImages(imageMap);
    } catch (error) {
      console.error("Failed to fetch item images", error);
    }
  };

  const fetchLiveTracking = async (id: string) => {
    try {
      setLoadingTracking(true);
      const res = await api.get(`/api/v1/erp/orders/${id}/tracking`);
      setTrackingHistory(res.data?.data?.history || []);
    } catch (err) {
      console.warn("Failed to fetch live tracking history", err);
    } finally {
      setLoadingTracking(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Order...">
        <div className="flex justify-center items-center py-24">
          <Spinner spinning={true} tip="Loading Order Details..." />
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Product Item",
      key: "name",
      render: (_, record) => {
        const imgKey = `${record.itemId}_${record.variantId}`;
        const imageUrl = itemImages[imgKey] || itemImages[`${record.itemId}_fallback`] || "";
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <Image src={imageUrl} width={40} height={40} className="object-cover rounded-lg border border-card-border" preview={false} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-sub">
                <IconPackage size={18} />
              </div>
            )}
            <div>
              <span className="font-semibold text-xs text-text-main dark:text-text-main-dark block">{record.name}</span>
              {record.variantName && (
                <span className="text-[10px] text-text-sub uppercase font-mono block">Variant: {record.variantName}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      render: (size) => (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-text-sub font-mono">
          {size || "—"}
        </span>
      ),
    },
    {
      title: "Unit Price (Rs)",
      key: "price",
      width: 140,
      render: (_, record) => (
        <span className="font-mono text-xs font-semibold text-text-main dark:text-text-main-dark">
          Rs {record.price?.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Qty",
      key: "quantity",
      width: 80,
      render: (_, record) => (
        <span className="font-mono text-xs font-semibold text-text-main dark:text-text-main-dark">
          {record.quantity}
        </span>
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      align: "right",
      width: 120,
      render: (_, record) => (
        <span className="font-mono text-xs font-bold text-text-main dark:text-text-main-dark">
          Rs {((record.price - (record.discount || 0)) * record.quantity).toLocaleString()}
        </span>
      ),
    },
  ];

  const subtotal = (order?.items || []).reduce((acc, item) => acc + (item.price - (item.discount || 0)) * item.quantity, 0);

  const getStatusBadge = (status?: string) => {
    const st = (status || "").toLowerCase();
    let bg = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    if (st === "completed") bg = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    else if (st === "shipped" || st === "processing") bg = "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    else if (st === "cancelled" || st === "returned" || st === "refused (rto)") bg = "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${bg}`}>
        {order?.status || "N/A"}
      </span>
    );
  };

  return (
    <PageContainer title={`Order #${orderId}`}>
      <div className="w-full flex flex-col gap-6">
        <div className="flex justify-between items-center bg-card dark:bg-card-dark p-4 rounded-2xl border border-card-border dark:border-card-border-dark shadow-xs">
          <h2 className="text-lg font-bold text-text-main dark:text-text-main-dark m-0 font-mono tracking-wider">
            Order #{orderId}
          </h2>
          <Button
            type="primary"
            icon={<IconEdit size={16} />}
            onClick={() => navigate(`/orders/${orderId}`)}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs px-6 h-10 rounded-xl"
          >
            Edit Order
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer & Shipping */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Customer Profile */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                <IconUser size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Customer Profile
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Name</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.customer?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Email</span>
                  <span className="font-medium text-text-main dark:text-text-main-dark">{order?.customer?.email || "N/A"}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Phone</span>
                  <span className="font-mono text-text-main dark:text-text-main-dark">{order?.customer?.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Shipping Destination */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                <IconMapPin size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Shipping Destination
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Recipient</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.customer?.shippingName || order?.customer?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Address</span>
                  <span className="font-medium text-text-main dark:text-text-main-dark">
                    {order?.customer?.shippingAddress || "N/A"}<br />
                    {order?.customer?.shippingCity || ""} {order?.customer?.shippingZip || ""}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-text-sub uppercase text-[10px]">Contact</span>
                  <span className="font-mono text-text-main dark:text-text-main-dark">{order?.customer?.shippingPhone || order?.customer?.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark justify-between">
                <div className="flex items-center gap-2">
                  <IconTruck size={18} className="text-brand dark:text-brand-dark" />
                  <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                    Tracking
                  </h3>
                </div>
                {getStatusBadge(order?.status)}
              </div>
              
              <div className="space-y-3 font-mono text-xs w-full">
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Courier:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.courier || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Waybill:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.trackingNumber || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Est. Delivery:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">
                    {formatSLDateTime(order?.estimatedDelivery) || "N/A"}
                  </span>
                </div>
                {order?.trackingNumber && (
                  <div className="pt-2">
                    <a
                      href={`https://www.domex.lk/tracking.php?wb_no=${order.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Open Courier Portal <IconExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
              
              {trackingHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-card-border dark:border-card-border-dark">
                  <h4 className="text-xs font-bold text-text-sub uppercase mb-3">Latest Updates</h4>
                  <Timeline
                    className="mt-2 text-xs"
                    items={[...trackingHistory].reverse().slice(0, 3).map((event) => ({
                      children: (
                        <div className="flex flex-col font-mono text-xs">
                          <span className="font-bold text-text-main dark:text-text-main-dark">{event.status}</span>
                          <span className="text-[10px] text-text-sub">{event.date}</span>
                        </div>
                      ),
                      color: event.status.toLowerCase().includes("delivered") ? "green" : "blue",
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Items & Financials */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            {/* Order Items */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-card-border dark:border-card-border-dark">
                <IconPackage size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Order Items ({(order?.items || []).length})
                </h3>
              </div>

              <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
                <Table
                  columns={columns}
                  dataSource={order?.items || []}
                  rowKey={(rec, idx) => `${rec.productId}_${idx}`}
                  pagination={false}
                  scroll={{ x: 500 }}
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark justify-between">
                <div className="flex items-center gap-2">
                  <IconCoin size={18} className="text-brand dark:text-brand-dark" />
                  <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                    Financial Summary
                  </h3>
                </div>
                <div>
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-text-sub px-2 py-1 rounded text-xs font-bold font-mono">
                    {order?.paymentMethod || "COD"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs w-full lg:w-1/2 ml-auto">
                <div className="flex justify-between items-center">
                  <span className="text-text-sub font-semibold uppercase">Subtotal</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">Rs {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-sub font-semibold uppercase font-sans">Discount</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    - Rs {(order?.discount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-sub font-semibold uppercase font-sans">Shipping Fee</span>
                  <span className="font-semibold text-text-main dark:text-text-main-dark">
                    Rs {(order?.shippingFee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-sub font-semibold uppercase font-sans">Handling Fee</span>
                  <span className="font-semibold text-text-main dark:text-text-main-dark">
                    Rs {(order?.fee || 0).toLocaleString()}
                  </span>
                </div>

                <Divider className="my-3 border-card-border dark:border-card-border-dark" />

                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-text-main dark:text-text-main-dark">Grand Total</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">Rs {(order?.total || 0).toLocaleString()}</span>
                </div>
                
                <div className="text-right mt-2 text-[10px] text-text-sub">
                  Payment Status: <span className="font-bold uppercase text-text-main dark:text-text-main-dark">{order?.paymentStatus || "Pending"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OrderViewPage;
