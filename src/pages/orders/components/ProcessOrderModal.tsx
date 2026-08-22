import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Checkbox, Tag, Divider, Row, Col } from "antd";
import { IconTruck, IconShieldCheck, IconShieldX, IconPackage, IconCheck, IconCreditCard } from "@tabler/icons-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface ProcessOrderModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessOrderModal: React.FC<ProcessOrderModalProps> = ({
  open,
  order,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order && open) {
      form.setFieldsValue({
        status: (order.status?.toLowerCase() === "pending" || order.status?.toLowerCase() === "processing") ? "Completed" : (order.status || "Completed"),
        paymentStatus: order.paymentStatus || "Paid",
        courier: order.courier || "Domex",
        trackingNumber: order.trackingNumber || "",
        estimatedDelivery: order.estimatedDelivery ? dayjs(order.estimatedDelivery as any) : dayjs().add(3, "day"),
        sendNotification: true,
      });
    }
  }, [order, open, form]);

  if (!order) return null;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        status: values.status,
        paymentStatus: values.paymentStatus,
        courier: values.courier,
        trackingNumber: values.trackingNumber?.trim(),
        estimatedDelivery: values.estimatedDelivery ? values.estimatedDelivery.format("YYYY-MM-DD") : null,
        sendNotification: values.sendNotification,
      };

      await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);

      toast.success(`Order #${order.orderId} processed successfully as ${values.status}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Process order error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to process order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isHighRisk = order.riskStatus === "HIGH_RISK" || order.ipqsRiskLevel === "CRITICAL";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Confirm & Process Order"
      cancelText="Cancel"
      width={680}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <IconTruck size={20} />
          </div>
          <div>
            <div className="leading-tight">Process Website Order #{order.orderId}</div>
            <div className="text-xs font-mono text-slate-400 font-normal">Source: {order.from || "Website"} • Placed by {order.customer?.name || "Customer"}</div>
          </div>
        </div>
      }
      okButtonProps={{
        className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2">
        {/* Customer & Risk Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 mb-5">
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Delivery Contact</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{order.customer?.name || "N/A"}</div>
              <div className="text-xs text-slate-500">{order.customer?.phone || "No Phone"}</div>
              <div className="text-xs text-slate-500 truncate">{order.customer?.address}, {order.customer?.city}</div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk & Total Overview</div>
              <div className="flex items-center gap-2 mb-1">
                {isHighRisk ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <IconShieldX size={12} /> HIGH RISK / SPAM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <IconShieldCheck size={12} /> Verified Customer
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                Total: Rs. {(order.total || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                Payment: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.paymentMethod || "COD"} ({order.paymentStatus || "Pending"})</span>
              </div>
            </Col>
          </Row>
        </div>

        <Form form={form} layout="vertical" className="space-y-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Order Status</span>}
                rules={[{ required: true, message: "Please select target status" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Completed">Completed (Fulfilled & Verified)</Select.Option>
                  <Select.Option value="Shipped">Shipped (In Transit)</Select.Option>
                  <Select.Option value="Processing">Processing (Dispatched to Warehouse)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="paymentStatus"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Status</span>}
                rules={[{ required: true, message: "Please select payment status" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Paid">Paid (Verified Payment / COD Received)</Select.Option>
                  <Select.Option value="Pending">Pending Payment</Select.Option>
                  <Select.Option value="Failed">Failed / Unpaid</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="courier"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Courier Partner</span>}
                rules={[{ required: true, message: "Please select courier" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Domex">Domex Courier</Select.Option>
                  <Select.Option value="Pronto">Pronto Lanka</Select.Option>
                  <Select.Option value="Grasshoppers">Grasshoppers</Select.Option>
                  <Select.Option value="Fulfill">Fulfill.lk</Select.Option>
                  <Select.Option value="Prompt Express">Prompt Express</Select.Option>
                  <Select.Option value="Self Delivery">Self Hand Delivery</Select.Option>
                  <Select.Option value="Other">Other Courier Service</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="trackingNumber"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Waybill / Tracking Number</span>}
                rules={[{ required: true, message: "Tracking number is required to process order" }]}
              >
                <Input placeholder="e.g. DX-948201948" className="h-10 font-mono text-xs rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="estimatedDelivery"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated Delivery Date</span>}
              >
                <DatePicker className="w-full h-10 rounded-xl" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="flex items-center">
              <Form.Item name="sendNotification" valuePropName="checked" className="mb-0 mt-4">
                <Checkbox className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Send order notification to customer
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};
