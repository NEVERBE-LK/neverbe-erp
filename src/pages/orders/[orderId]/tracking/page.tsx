import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Select, Input, Button, DatePicker, Switch, Card, Row, Col, Modal, Timeline } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import OrderSubNav from "../components/OrderSubNav";
import { IconTruck, IconCamera, IconDeviceFloppy, IconBell, IconPackage, IconCalendar } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Html5Qrcode } from "html5-qrcode";
import { formatSLDateTime } from "@/utils/dateUtils";

const { Option } = Select;

export const OrderTrackingEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Barcode Camera Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      const data: Order = res.data;
      setOrder(data);

      form.setFieldsValue({
        status: data.status || "Pending",
        paymentStatus: data.paymentStatus || "Pending",
        courier: data.courier || "Domex",
        trackingNumber: data.trackingNumber || "",
        estimatedDelivery: data.estimatedDelivery 
          ? dayjs(typeof data.estimatedDelivery === "object" && data.estimatedDelivery !== null && "toDate" in data.estimatedDelivery ? (data.estimatedDelivery as any).toDate() : (data.estimatedDelivery as string)) 
          : null,
        restocked: data.restocked || false,
        sendNotification: true,
      });

      if (data.trackingNumber) {
        fetchLiveTracking(data.orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch order");
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

  const safeStopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === undefined) {
          await scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn("Scanner stop error", err);
      scannerRef.current = null;
    } finally {
      isStoppingRef.current = false;
      setScannerActive(false);
    }
  };

  const startScanner = () => {
    setScannerActive(true);
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode("tracking-scanner-container");
        scannerRef.current = html5Qrcode;
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 120 } },
          (decodedText) => {
            const cleanText = decodedText.trim().replace(/\s+/g, "");
            toast.success(`Scanned: ${cleanText}`);
            form.setFieldsValue({ trackingNumber: cleanText });
            safeStopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera scanner start failed", err);
        toast.error("Unable to access camera permissions.");
        setScannerActive(false);
      }
    }, 400);
  };

  const onFinish = async (values: any) => {
    try {
      // 🛑 Completion Validation Guard
      if (values.status === "Completed") {
        if (values.paymentStatus !== "Paid") {
          toast.error("Cannot mark order as Completed: Payment status must be 'Paid'.");
          return;
        }
        if (!values.trackingNumber?.trim()) {
          toast.error("Cannot mark order as Completed: Courier Waybill Tracking Number is required.");
          return;
        }
      }

      setSaving(true);
      const payload = {
        status: values.status,
        paymentStatus: values.paymentStatus,
        courier: values.courier,
        trackingNumber: values.trackingNumber,
        estimatedDelivery: values.estimatedDelivery ? values.estimatedDelivery.toISOString() : null,
        restocked: values.restocked,
        returnReason: values.returnReason,
        sendNotification: values.sendNotification,
      };

      await api.patch(`/api/v1/erp/orders/${orderId}/tracking`, payload);

      // Auto-Blacklist Spammer if COD Package Refused
      if (values.status === "Refused (RTO)" || values.returnReason === "REFUSED_COD_DELIVERY") {
        try {
          await api.post("/api/v1/erp/spammers", {
            name: order?.customer?.name || "",
            phone: order?.customer?.phone || "",
            email: order?.customer?.email || "",
            address: order?.customer?.address || "",
            city: order?.customer?.city || "",
            reason: "Refused COD Package at Door (RTO)",
            severity: "HIGH",
          });
          toast.success("Order status updated & Customer added to Spammer Blacklist!");
        } catch (spamErr) {
          console.warn("Spammer blacklist auto-sync note", spamErr);
        }
      } else {
        toast.success("Order status & tracking info updated successfully");
      }

      fetchOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update tracking info");
    } finally {
      setSaving(false);
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

  return (
    <PageContainer title={`Tracking & Delivery | Order #${orderId}`}>
      <div className="w-full space-y-6">
        <OrderSubNav orderId={orderId!} order={order} />

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Row gutter={[24, 24]}>
            {/* Left Column: Order Status & Shipping Coordinates */}
            <Col xs={24} lg={14}>
              <div className="space-y-6">
                {/* Fulfillment Status Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconPackage size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Order & Payment Status
                    </h3>
                  </div>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Fulfillment Status</span>} name="status" rules={[{ required: true }]}>
                        <Select className="h-10 rounded-xl overflow-hidden">
                          <Option value="Pending">Pending</Option>
                          <Option value="Processing">Processing</Option>
                          <Option value="Completed">Completed</Option>
                          <Option value="Returned">Returned</Option>
                          <Option value="Refused (RTO)">Refused (RTO - Uncollected COD)</Option>
                          <Option value="Exchanged">Exchanged</Option>
                          <Option value="Cancelled">Cancelled</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Payment Status</span>} name="paymentStatus" rules={[{ required: true }]}>
                        <Select className="h-10 rounded-xl overflow-hidden">
                          <Option value="Pending">Pending</Option>
                          <Option value="Paid">Paid</Option>
                          <Option value="Failed">Failed</Option>
                          <Option value="Refunded">Refunded</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item shouldUpdate={(prev, curr) => prev.status !== curr.status}>
                    {({ getFieldValue }) => {
                      const st = getFieldValue("status");
                      const isReturn = st === "Returned" || st === "Refused (RTO)" || st === "Exchanged";
                      if (!isReturn) return null;

                      return (
                        <Form.Item label={<span className="text-xs font-semibold text-text-sub">Return / Refusal Reason</span>} name="returnReason">
                          <Select placeholder="Select primary return reason" className="h-10 rounded-xl overflow-hidden">
                            <Option value="REFUSED_COD_DELIVERY">Refused COD Delivery / Uncollected at Door (Auto-Blacklist Spammer)</Option>
                            <Option value="SIZE_EXCHANGE">Size Swap / Fit Issue (Legitimate Exchange - 0 Penalty)</Option>
                            <Option value="DEFECTIVE_PRODUCT">Defective Product / Manufacturing Issue (0 Penalty)</Option>
                            <Option value="CUSTOMER_CHANGE_MIND">Customer Changed Mind</Option>
                            <Option value="OTHER">Other Return Reason</Option>
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </div>

                {/* Shipping & Tracking Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconTruck size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Shipping Courier & Waybill
                    </h3>
                  </div>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Shipping Courier Service</span>} name="courier">
                    <Select className="h-10 rounded-xl overflow-hidden">
                      <Option value="Domex">Domex</Option>
                      <Option value="Certis">Certis</Option>
                      <Option value="Prompt">Prompt</Option>
                      <Option value="Koombiyo">Koombiyo</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Waybill / Tracking Number</span>} name="trackingNumber">
                    <Input
                      placeholder="Waybill #"
                      className="h-10 rounded-xl font-mono"
                      suffix={
                        <button
                          type="button"
                          onClick={startScanner}
                          className="p-1 rounded text-text-sub hover:text-text-main transition-colors cursor-pointer border-none bg-transparent"
                          title="Scan via Camera"
                        >
                          <IconCamera size={18} />
                        </button>
                      }
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={14}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Estimated Delivery Date</span>} name="estimatedDelivery">
                        <DatePicker className="w-full h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Stock Restocked</span>} name="restocked" valuePropName="checked">
                        <Switch className="bg-slate-300" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl flex items-center justify-between border border-card-border dark:border-card-border-dark">
                    <div className="flex items-center gap-2">
                      <IconBell size={18} className="text-brand dark:text-brand-dark" />
                      <div>
                        <span className="text-xs font-bold text-text-main dark:text-text-main-dark block">Notify Customer</span>
                        <span className="text-[10px] text-text-sub block">Send SMS/Email update on status change</span>
                      </div>
                    </div>
                    <Form.Item name="sendNotification" valuePropName="checked" className="!mb-0">
                      <Switch defaultChecked className="bg-slate-300" />
                    </Form.Item>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={saving}
                  icon={<IconDeviceFloppy size={18} />}
                  className="h-11 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Tracking & Status
                </Button>
              </div>
            </Col>

            {/* Right Column: Live Courier History */}
            <Col xs={24} lg={10}>
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                  <IconCalendar size={18} className="text-brand dark:text-brand-dark" />
                  <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                    Live Courier History
                  </h3>
                </div>

                <Spinner spinning={loadingTracking}>
                  {trackingHistory.length > 0 ? (
                    <Timeline
                      className="mt-4"
                      items={[...trackingHistory].reverse().map((event) => ({
                        children: (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-main dark:text-text-main-dark">{event.status}</span>
                            <span className="text-[10px] text-text-sub font-mono">{event.date}</span>
                          </div>
                        ),
                        color: event.status.toLowerCase().includes("delivered") ? "green" : "blue",
                      }))}
                    />
                  ) : (
                    <div className="text-center py-8 text-text-sub text-xs font-semibold italic">
                      {order?.trackingNumber ? "No live tracking history available yet." : "No waybill number attached to order."}
                    </div>
                  )}
                </Spinner>
              </div>
            </Col>
          </Row>
        </Form>

        {/* Barcode Camera Scanner Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <IconCamera size={20} className="text-emerald-600" />
              <span className="font-bold text-xs uppercase tracking-wider font-mono">Scan Tracking Barcode</span>
            </div>
          }
          open={scannerActive}
          onCancel={safeStopScanner}
          footer={null}
          width={450}
          maskClosable={false}
        >
          <div className="flex flex-col items-center gap-4 py-2">
            <span className="text-xs text-text-sub text-center">Position the shipping label barcode within the viewfinder below.</span>
            <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-card-border flex items-center justify-center">
              <div id="tracking-scanner-container" className="w-full h-full" />
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse pointer-events-none" />
              <div className="absolute inset-x-12 inset-y-16 border-2 border-dashed border-emerald-500 rounded pointer-events-none" />
            </div>
            <Button onClick={safeStopScanner} block className="h-10 font-bold rounded-xl">Cancel Scan</Button>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default OrderTrackingEditPage;
