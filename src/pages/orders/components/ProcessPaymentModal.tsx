import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Checkbox, Row, Col } from "antd";
import { IconCreditCard, IconCoin, IconCheck } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface ProcessPaymentModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
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
        paymentStatus: "Paid",
        status: "keep",
        sendNotification: true,
      });
    }
  }, [order, open, form]);

  if (!order) return null;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: any = {
        paymentStatus: values.paymentStatus,
        sendNotification: values.sendNotification,
      };

      if (values.status && values.status !== "keep") {
        payload.status = values.status;
      }

      await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);

      toast.success(`Payment status for Order #${order.orderId} updated to ${values.paymentStatus}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Process payment error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to update payment status";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isCOD =
    (order.paymentMethod || "").toLowerCase().includes("cod") ||
    (order.paymentMethod || "").toLowerCase().includes("cash on delivery");
  const isFeePrepaid = isCOD && !!order.deliveryFeePrepaid;
  const shippingFee = order.shippingFee || 450;
  const codBalance = Math.max(0, (order.total || 0) - shippingFee);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Confirm & Update Payment"
      cancelText="Cancel"
      width={600}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <IconCreditCard size={20} />
          </div>
          <div>
            <div className="leading-tight">Process Payment • Order #{order.orderId}</div>
            <div className="text-xs font-mono text-slate-400 font-normal">
              Customer: {order.customer?.name || "Customer"} • {order.paymentMethod || "COD"}
            </div>
          </div>
        </div>
      }
      okButtonProps={{
        icon: <IconCheck size={16} />,
        className: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        {/* Payment & Amount Summary Card */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                <IconCoin size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
                  Total Order Amount
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  {order.paymentMethod || "Cash On Delivery"} (Current: {order.paymentStatus || "Pending"})
                </span>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
              Rs. {(order.total || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {isFeePrepaid && (
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                Prepaid Delivery Fee Online: -Rs. {shippingFee.toLocaleString()}
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                COD Balance Due: Rs. {codBalance.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Customer Coordinates */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4">
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{order.customer?.name || "N/A"}</span>
              <span className="text-xs text-slate-500 font-mono">{order.customer?.phone || "No Phone"}</span>
            </Col>
            <Col xs={24} sm={12}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Fulfillment Status</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 mt-1">
                {order.status || "Pending"}
              </span>
              {order.trackingNumber && (
                <span className="block text-[10px] font-mono text-slate-500 mt-1">
                  Courier: {order.courier || "Domex"} (#{order.trackingNumber})
                </span>
              )}
            </Col>
          </Row>
        </div>

        {/* Form Controls */}
        <Form form={form} layout="vertical" className="space-y-4 pt-2">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="paymentStatus"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">New Payment Status</span>}
                rules={[{ required: true, message: "Please select payment status" }]}
              >
                <Select className="h-10 rounded-xl">
                  <Select.Option value="Paid">Paid (Payment Verified & Settled)</Select.Option>
                  <Select.Option value="Pending">Pending (Keep Payment Pending)</Select.Option>
                  <Select.Option value="Failed">Failed (Payment Unsuccessful)</Select.Option>
                  <Select.Option value="Cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fulfillment Status</span>}
              >
                <Select className="h-10 rounded-xl">
                  <Select.Option value="keep">Keep Current Status ({order.status || "Current"})</Select.Option>
                  <Select.Option value="Processing">Move to Processing</Select.Option>
                  <Select.Option value="Completed">Move to Completed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="sendNotification" valuePropName="checked" className="mb-0">
            <Checkbox className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Send payment status update notification to customer
            </Checkbox>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
