import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Checkbox, Row, Col, Alert } from "antd";
import { IconX, IconAlertOctagon, IconRefresh } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface ProcessCancelModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessCancelModal: React.FC<ProcessCancelModalProps> = ({
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
        status: "Cancelled",
        paymentStatus: "Cancelled",
        cancellationReason: "CUSTOMER_REQUEST",
        restocked: true,
        sendNotification: true,
        cancelNotes: "",
      });
    }
  }, [order, open, form]);

  if (!order) return null;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        status: "Cancelled",
        paymentStatus: values.paymentStatus,
        restocked: values.restocked,
        returnReason: values.cancellationReason,
        returnNotes: values.cancelNotes,
        sendNotification: values.sendNotification,
      };

      await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);

      toast.success(`Order #${order.orderId} cancelled successfully.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Process cancel error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to cancel order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Confirm & Cancel Order"
      cancelText="Close"
      width={640}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <IconAlertOctagon size={20} />
          </div>
          <div>
            <div className="leading-tight">Cancel Order #{order.orderId}</div>
            <div className="text-xs font-mono text-slate-400 font-normal">Customer: {order.customer?.name || "N/A"} • Amount: Rs. {(order.total || 0).toLocaleString("en-LK")}</div>
          </div>
        </div>
      }
      okButtonProps={{
        className: "bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 px-5 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        <Alert
          type="error"
          showIcon
          icon={<IconAlertOctagon size={18} />}
          message="Order Cancellation Workflow"
          description="Cancelling an order will lock the order details, update payment status, and restore items back to inventory stock if selected."
          className="rounded-2xl text-xs font-medium border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 mb-6"
        />

        <Form form={form} layout="vertical" className="space-y-4 pt-2">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cancellationReason"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for Cancellation</span>}
                rules={[{ required: true, message: "Please select cancellation reason" }]}
              >
                <Select className="h-10">
                  <Select.Option value="CUSTOMER_REQUEST">Customer Requested Cancellation</Select.Option>
                  <Select.Option value="OUT_OF_STOCK">Item Out of Stock / Damaged</Select.Option>
                  <Select.Option value="UNPAID_EXPIRED">Unpaid Order Timeout / Expired</Select.Option>
                  <Select.Option value="SUSPECTED_FRAUD_SPAM">Blacklisted / Suspected Fraud Order</Select.Option>
                  <Select.Option value="ADDRESS_UNREACHABLE">Address Unreachable / Invalid Contact</Select.Option>
                  <Select.Option value="OTHER">Other Reason</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="paymentStatus"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Updated Payment Status</span>}
                rules={[{ required: true, message: "Please select payment status" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Cancelled">Cancelled (Order Payment Cancelled)</Select.Option>
                  <Select.Option value="Failed">Failed (Payment Uncollected)</Select.Option>
                  <Select.Option value="Refunded">Refunded (Paid Amount Returned)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="restocked" valuePropName="checked" className="mb-0">
                <Checkbox className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Restore Item Stock Back to Inventory
                </Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="sendNotification" valuePropName="checked" className="mb-0">
                <Checkbox className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Send Cancellation SMS & Email Notification
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="cancelNotes"
            label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cancellation Notes / Staff Comments</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter optional comments or cancellation rationale..."
              className="rounded-xl text-xs"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
