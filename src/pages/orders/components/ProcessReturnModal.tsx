import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Checkbox, Row, Col, Alert } from "antd";
import { IconRotate, IconBoxSeam, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface ProcessReturnModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
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
        status: "Returned",
        returnReason: "CUSTOMER_REFUSED",
        paymentStatus: "Failed",
        restocked: true,
        sendNotification: true,
        returnNotes: "",
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
        restocked: values.restocked,
        returnReason: values.returnReason,
        returnNotes: values.returnNotes,
        sendNotification: values.sendNotification,
      };

      await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);

      toast.success(`Return processed for Order #${order.orderId}! Status updated to ${values.status}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Process return error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to process return";
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
      okText="Confirm & Process Return"
      cancelText="Cancel"
      width={640}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <IconRotate size={20} />
          </div>
          <div>
            <div className="leading-tight">Process Return for Order #{order.orderId}</div>
            <div className="text-xs font-mono text-slate-400 font-normal">Customer: {order.customer?.name || "N/A"} • Total: Rs. {(order.total || 0).toLocaleString("en-LK")}</div>
          </div>
        </div>
      }
      okButtonProps={{
        className: "bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-5 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        <Alert
          type="warning"
          showIcon
          icon={<IconAlertTriangle size={18} />}
          message="Return & Stock Restocking Workflow"
          description="Processing a return will update the order status, optionally restock item quantities back to inventory, and log the return reason."
          className="rounded-2xl text-xs font-medium border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 mb-6"
        />

        <Form form={form} layout="vertical" className="space-y-4 pt-2">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Return Action Status</span>}
                rules={[{ required: true, message: "Please select return status" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Returned">Returned (Customer Return / Refund)</Select.Option>
                  <Select.Option value="Refused (RTO)">Refused (RTO - Delivery Door Refusal)</Select.Option>
                  <Select.Option value="Exchanged">Exchanged (Size / Fit Exchange)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="returnReason"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Return Reason Category</span>}
                rules={[{ required: true, message: "Please select return reason" }]}
              >
                <Select className="h-10">
                  <Select.Option value="CUSTOMER_REFUSED">Refused COD Delivery at Door</Select.Option>
                  <Select.Option value="DEFECTIVE">Defective / Damaged Item</Select.Option>
                  <Select.Option value="WRONG_SIZE_FIT">Wrong Size / Fit Issue</Select.Option>
                  <Select.Option value="WRONG_ITEM">Wrong Item Sent</Select.Option>
                  <Select.Option value="CUSTOMER_CHANGED_MIND">Customer Changed Mind</Select.Option>
                  <Select.Option value="OTHER">Other Reason</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="paymentStatus"
                label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Updated Payment Status</span>}
                rules={[{ required: true, message: "Please select payment status" }]}
              >
                <Select className="h-10">
                  <Select.Option value="Failed">Failed (COD Uncollected)</Select.Option>
                  <Select.Option value="Refunded">Refunded (Paid Amount Refunded)</Select.Option>
                  <Select.Option value="Paid">Keep as Paid (Store Credit / Exchange)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="flex items-center">
              <Form.Item name="restocked" valuePropName="checked" className="mb-0 mt-4">
                <Checkbox className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Automatically Restock Items Back to Inventory
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="returnNotes"
            label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Return Notes / Comments</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter inspection details or reason notes..."
              className="rounded-xl text-xs"
            />
          </Form.Item>

          <Form.Item name="sendNotification" valuePropName="checked" className="mb-0">
            <Checkbox className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Dispatch Return Confirmation Notification to Customer
            </Checkbox>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
