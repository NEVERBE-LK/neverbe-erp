import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Card, Row, Col, Timeline, Tag, Button } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import OrderSubNav from "../components/OrderSubNav";
import {
  IconTruck,
  IconPackage,
  IconCalendar,
  IconCreditCard,
  IconInfoCircle,
  IconExternalLink,
  IconLock,
  IconArrowLeft,
} from "@tabler/icons-react";
import { formatSLDateTime } from "@/utils/dateUtils";

export const OrderTrackingEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      const data: Order = res.data;
      setOrder(data);

      if (data.trackingNumber) {
        fetchLiveTracking(data.orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
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
      <PageContainer title="Loading Order Tracking...">
        <div className="flex justify-center items-center py-24">
          <Spinner spinning={true} tip="Loading Order Tracking Details..." />
        </div>
      </PageContainer>
    );
  }

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
    <PageContainer title={`Status & Tracking View | Order #${orderId}`}>
      <div className="w-full space-y-6">
        <OrderSubNav orderId={orderId!} order={order} />

        <div className="w-full flex flex-col gap-6">
          {/* Card 1: Order Status & Logistics Information (Full Width) */}
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
              <div className="flex items-center gap-2">
                <IconTruck size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Order Status & Logistics Information
                </h3>
              </div>
              {getStatusBadge(order?.status)}
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-card-border dark:border-card-border-dark">
                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Payment Status</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.paymentStatus || "Pending"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Order Source</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark uppercase">{order?.from || "Website"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Order Total</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">
                    Rs. {(order?.total || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-text-sub uppercase mb-1">Inventory Restocked</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">
                    {order?.restocked ? "Yes (Restocked)" : "No"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 w-full">
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Courier Partner:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.courier || "Domex"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Waybill Tracking Number:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">{order?.trackingNumber || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                  <span className="text-text-sub font-semibold">Estimated Delivery Date:</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">
                    {formatSLDateTime(order?.estimatedDelivery) || "N/A"}
                  </span>
                </div>
                {order?.returnReason && (
                  <div className="flex justify-between py-1 border-b border-card-border dark:border-card-border-dark">
                    <span className="text-text-sub font-semibold">Return / Cancel Reason:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{order.returnReason}</span>
                  </div>
                )}
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
          </div>

          {/* Card 2: Live Courier Tracking Timeline (Full Width) */}
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
              <div className="flex items-center gap-2">
                <IconCalendar size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Live Tracking Updates Timeline
                </h3>
              </div>
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
                <div className="text-center py-12 text-text-sub text-xs font-semibold italic">
                  {order?.trackingNumber
                    ? `No status updates fetched from courier network for waybill #${order.trackingNumber} yet.`
                    : "No waybill number has been assigned to this order yet."}
                </div>
              )}
            </Spinner>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OrderTrackingEditPage;
