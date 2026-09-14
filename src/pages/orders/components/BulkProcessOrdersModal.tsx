import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Checkbox, Progress, Table } from "antd";
import { IconTruck, IconCheck, IconBarcode } from "@tabler/icons-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface BulkProcessOrdersModalProps {
  open: boolean;
  selectedOrders: Order[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkProcessOrdersModal: React.FC<BulkProcessOrdersModalProps> = ({
  open,
  selectedOrders,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [waybillMap, setWaybillMap] = useState<Record<string, string>>({});

  const firstOrderId = selectedOrders[0]?.orderId || "";
  const lastOrderId = selectedOrders[selectedOrders.length - 1]?.orderId || "";

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        status: "Completed",
        courier: "Domex",
        estimatedDelivery: dayjs().add(3, "day"),
        sendNotification: true,
      });

      // Initialize waybill map with existing tracking numbers for manual entry
      const initialMap: Record<string, string> = {};
      selectedOrders.forEach((o) => {
        initialMap[o.orderId] = o.trackingNumber || "";
      });
      setWaybillMap(initialMap);
      setProgress(0);
      setProcessedCount(0);
    }
  }, [open, selectedOrders, form]);

  const handleBulkSubmit = async () => {
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
          status: values.status,
          courier: values.courier,
          trackingNumber: waybillMap[order.orderId]?.trim() || order.trackingNumber || "",
          estimatedDelivery: values.estimatedDelivery ? values.estimatedDelivery.format("YYYY-MM-DD") : null,
          sendNotification: values.sendNotification,
        };

        try {
          await api.patch(`/api/v1/erp/orders/${order.orderId}/tracking`, payload);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to bulk process order #${order.orderId}:`, err);
        }

        completed++;
        setProcessedCount(completed);
        setProgress(Math.round((completed / total) * 100));
      }

      toast.success(`Successfully processed ${successCount} of ${total} selected orders!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk process error:", err);
      toast.error("Please fill all required bulk fields");
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
      title: "Customer & Destination",
      key: "customer",
      render: (_: any, record: Order) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark">
            {record.customer?.name || "Customer"}
          </span>
          <span className="text-[10px] text-text-sub font-mono">{record.customer?.city || "—"}</span>
        </div>
      ),
    },
    {
      title: "Manual Physical Waybill No",
      key: "waybill",
      render: (_: any, record: Order) => (
        <Input
          prefix={<IconBarcode size={15} className="text-slate-400" />}
          placeholder="Scan or Enter Physical Waybill No"
          value={waybillMap[record.orderId] || ""}
          onChange={(e) =>
            setWaybillMap((prev) => ({ ...prev, [record.orderId]: e.target.value }))
          }
          className="h-9 rounded-xl font-mono text-xs"
          disabled={processing}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 pb-2 border-b border-card-border dark:border-card-border-dark">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <IconTruck size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight">
              Bulk Process Order Range ({selectedOrders.length} Orders)
            </h3>
            <p className="text-xs text-text-sub font-mono font-normal">
              Selected Range: #{firstOrderId} {selectedOrders.length > 1 ? `to #${lastOrderId}` : ""}
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleBulkSubmit}
      confirmLoading={processing}
      okText={processing ? `Processing (${processedCount}/${selectedOrders.length})...` : `Process Selected Range (${selectedOrders.length})`}
      okButtonProps={{
        icon: <IconCheck size={16} />,
        className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 border-none cursor-pointer",
      }}
      cancelButtonProps={{ className: "rounded-xl h-10 px-4 text-xs font-semibold" }}
      width={720}
      destroyOnClose
    >
      <div className="py-4 space-y-5">
        {processing && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono">
              <span>Processing Order Range Batch...</span>
              <span>{processedCount} / {selectedOrders.length} Completed</span>
            </div>
            <Progress percent={progress} status="active" strokeColor={{ "0%": "#10b981", "100%": "#059669" }} />
          </div>
        )}

        {/* Batch Logistics Common Controls */}
        <Form form={form} layout="vertical" disabled={processing}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item label={<span className="text-xs font-bold text-text-sub">Courier Partner</span>} name="courier" rules={[{ required: true }]}>
              <Select className="h-10 rounded-xl">
                <Select.Option value="Domex">Domex</Select.Option>
                <Select.Option value="Pronto">Pronto</Select.Option>
                <Select.Option value="Grasshoppers">Grasshoppers</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={<span className="text-xs font-bold text-text-sub">Estimated Delivery Date</span>} name="estimatedDelivery">
              <DatePicker className="w-full h-10 rounded-xl" format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item label={<span className="text-xs font-bold text-text-sub">Order Fulfillment Status</span>} name="status" rules={[{ required: true }]}>
              <Select className="h-10 rounded-xl">
                <Select.Option value="Completed">Completed / Dispatched</Select.Option>
                <Select.Option value="Processing">Keep as Processing</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="sendNotification" valuePropName="checked" className="!mb-2">
            <Checkbox className="text-xs font-semibold text-text-main dark:text-text-main-dark">
              Send dispatch and waybill notification emails to customers
            </Checkbox>
          </Form.Item>
        </Form>

        {/* Manual Physical Waybill Entry Table per Order in Range */}
        <div className="border border-card-border dark:border-card-border-dark rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs font-bold text-text-sub uppercase tracking-wider font-mono flex justify-between items-center">
            <span>Manual Physical Waybill Assignment ({selectedOrders.length} Orders)</span>
            <span>Range: #{firstOrderId} → #{lastOrderId}</span>
          </div>
          <Table
            columns={columns}
            dataSource={selectedOrders}
            rowKey="orderId"
            pagination={false}
            size="small"
            scroll={{ y: 220 }}
          />
        </div>
      </div>
    </Modal>
  );
};
