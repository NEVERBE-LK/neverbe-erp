import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Checkbox, Progress, Table } from "antd";
import { IconCreditCard, IconCheck, IconCoin } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface BulkProcessPaymentsModalProps {
  open: boolean;
  selectedOrders: Order[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkProcessPaymentsModal: React.FC<BulkProcessPaymentsModalProps> = ({
  open,
  selectedOrders,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const firstOrderId = selectedOrders[0]?.orderId || "";
  const lastOrderId = selectedOrders[selectedOrders.length - 1]?.orderId || "";
  const grandTotalPayable = selectedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        paymentStatus: "Paid",
        status: "Processing",
        sendNotification: true,
      });
      setProgress(0);
      setProcessedCount(0);
    }
  }, [open, selectedOrders, form]);

  const handleBulkPaymentSubmit = async () => {
    try {
      const values = await form.validateFields();
      setProcessing(true);
      setProgress(0);
      setProcessedCount(0);

      const total = selectedOrders.length;
      let completed = 0;
      let successCount = 0;

      for (const order of selectedOrders) {
        const payload = {
          paymentStatus: values.paymentStatus,
          status: values.status,
          sendNotification: values.sendNotification,
        };

        try {
          await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to bulk process payment for order #${order.orderId}:`, err);
        }

        completed++;
        setProcessedCount(completed);
        setProgress(Math.round((completed / total) * 100));
      }

      toast.success(`Successfully updated payment status for ${successCount} of ${total} selected orders!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk process payment error:", err);
      toast.error("Please fill all required payment fields");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 130,
      render: (id: string) => <span className="font-mono font-bold text-xs">#{id}</span>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: Order) => (
        <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">
          {record.customer?.name || "Customer"}
        </span>
      ),
    },
    {
      title: "Payment Method",
      key: "method",
      width: 130,
      render: (_: any, record: Order) => (
        <span className="font-mono text-xs text-text-sub">
          {record.paymentMethod || "COD / Bank"}
        </span>
      ),
    },
    {
      title: "Payable Total",
      key: "total",
      align: "right" as const,
      render: (_: any, record: Order) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {(record.total || 0).toLocaleString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 pb-2 border-b border-card-border dark:border-card-border-dark">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <IconCreditCard size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight">
              Bulk Process Payments Range ({selectedOrders.length} Orders)
            </h3>
            <p className="text-xs text-text-sub font-mono font-normal">
              Range: #{firstOrderId} {selectedOrders.length > 1 ? `to #${lastOrderId}` : ""}
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleBulkPaymentSubmit}
      confirmLoading={processing}
      okText={processing ? `Processing (${processedCount}/${selectedOrders.length})...` : `Process Payments Range (${selectedOrders.length})`}
      okButtonProps={{
        icon: <IconCheck size={16} />,
        className: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 border-none cursor-pointer",
      }}
      cancelButtonProps={{ className: "rounded-xl h-10 px-4 text-xs font-semibold" }}
      width={680}
      destroyOnClose
    >
      <div className="py-4 space-y-5">
        {processing && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-blue-800 dark:text-blue-300 font-mono">
              <span>Updating Payment Batch...</span>
              <span>{processedCount} / {selectedOrders.length} Completed</span>
            </div>
            <Progress percent={progress} status="active" strokeColor={{ "0%": "#3b82f6", "100%": "#1d4ed8" }} />
          </div>
        )}

        {/* Range Batch Financial Summary Card */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <IconCoin size={22} className="text-blue-600 dark:text-blue-400" />
            <div>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
                Total Range Payable
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                {selectedOrders.length} Selected Orders
              </span>
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
            Rs. {grandTotalPayable.toLocaleString("en-LK")}
          </span>
        </div>

        {/* Batch Payment Settings Form */}
        <Form form={form} layout="vertical" disabled={processing}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item label={<span className="text-xs font-bold text-text-sub">New Payment Status</span>} name="paymentStatus" rules={[{ required: true }]}>
              <Select className="h-10 rounded-xl">
                <Select.Option value="Paid">Paid (Payment Verified & Settled)</Select.Option>
                <Select.Option value="Failed">Failed (Payment Unsuccessful)</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={<span className="text-xs font-bold text-text-sub">Fulfillment Order Status</span>} name="status" rules={[{ required: true }]}>
              <Select className="h-10 rounded-xl">
                <Select.Option value="Processing">Processing (Move to Courier Dispatch)</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Pending">Keep Pending</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="sendNotification" valuePropName="checked" className="!mb-2">
            <Checkbox className="text-xs font-semibold text-text-main dark:text-text-main-dark">
              Send payment confirmation receipt emails to customers
            </Checkbox>
          </Form.Item>
        </Form>

        {/* Selected Orders Range Preview Table */}
        <div className="border border-card-border dark:border-card-border-dark rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-bold text-text-sub uppercase tracking-wider font-mono flex justify-between items-center">
            <span>Orders in Selected Payment Range ({selectedOrders.length})</span>
            <span>#{firstOrderId} → #{lastOrderId}</span>
          </div>
          <Table
            columns={columns}
            dataSource={selectedOrders}
            rowKey="orderId"
            pagination={false}
            size="small"
            scroll={{ y: 200 }}
          />
        </div>
      </div>
    </Modal>
  );
};
