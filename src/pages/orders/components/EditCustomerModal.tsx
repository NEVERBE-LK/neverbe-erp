import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Row, Col, Button, Divider } from "antd";
import { IconUser, IconMail, IconPhone, IconMapPin, IconTruck, IconCopy } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";

interface EditCustomerModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
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
        userId: order.userId || "",
        customerName: order.customer?.name || "",
        customerEmail: order.customer?.email || "",
        customerPhone: order.customer?.phone || "",
        customerAddress: order.customer?.address || "",
        customerCity: order.customer?.city || "",
        customerZip: order.customer?.zip || "",
        shippingName: order.customer?.shippingName || order.customer?.name || "",
        shippingAddress: order.customer?.shippingAddress || order.customer?.address || "",
        shippingCity: order.customer?.shippingCity || order.customer?.city || "",
        shippingZip: order.customer?.shippingZip || order.customer?.zip || "",
        shippingPhone: order.customer?.shippingPhone || order.customer?.phone || "",
      });
    }
  }, [order, open, form]);

  if (!order) return null;

  const handleCopyBillingToShipping = () => {
    const values = form.getFieldsValue();
    form.setFieldsValue({
      shippingName: values.customerName || values.shippingName,
      shippingAddress: values.customerAddress,
      shippingCity: values.customerCity,
      shippingZip: values.customerZip,
      shippingPhone: values.customerPhone || values.shippingPhone,
    });
    toast.success("Billing details copied to shipping destination");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        userId: values.userId || null,
        customer: {
          name: values.customerName,
          email: values.customerEmail,
          phone: values.customerPhone,
          address: values.customerAddress,
          city: values.customerCity,
          zip: values.customerZip,
          shippingName: values.shippingName,
          shippingAddress: values.shippingAddress,
          shippingCity: values.shippingCity,
          shippingZip: values.shippingZip,
          shippingPhone: values.shippingPhone,
        },
      };

      await api.patch(`/api/v1/erp/orders/${order.orderId}/customer`, payload);
      toast.success(`Customer profile for Order #${order.orderId} updated successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update customer info", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to update customer info";
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
      okText="Save Customer Changes"
      cancelText="Cancel"
      width={720}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <IconUser size={20} />
          </div>
          <div>
            <div className="leading-tight">Edit Customer Profile & Delivery Details</div>
            <div className="text-xs font-mono text-slate-400 font-normal">
              Order #{order.orderId} • Status: {order.status}
            </div>
          </div>
        </div>
      }
      okButtonProps={{
        className: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-white font-bold text-xs h-10 px-6 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2">
        <Form form={form} layout="vertical" requiredMark={false} className="space-y-4">
          {/* Section 1: Customer Profile */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <IconUser size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                Customer Details
              </span>
            </div>

            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</span>}
                  name="customerName"
                  rules={[{ required: true, message: "Customer name is required" }]}
                >
                  <Input placeholder="Customer Name" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">User ID / Ref</span>}
                  name="userId"
                >
                  <Input placeholder="GUEST / User ID" className="h-10 rounded-xl font-mono" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</span>}
                  name="customerEmail"
                >
                  <Input prefix={<IconMail size={15} className="text-slate-400" />} placeholder="email@example.com" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Phone</span>}
                  name="customerPhone"
                >
                  <Input prefix={<IconPhone size={15} className="text-slate-400" />} placeholder="+94 77 123 4567" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Billing Address */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <IconMapPin size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Billing Address
                </span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<IconCopy size={13} />}
                onClick={handleCopyBillingToShipping}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 h-7 px-2 cursor-pointer"
              >
                Copy to Shipping
              </Button>
            </div>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Street Address</span>}
              name="customerAddress"
            >
              <Input.TextArea rows={2} placeholder="Billing street address" className="rounded-xl" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">City</span>}
                  name="customerCity"
                >
                  <Input placeholder="Colombo" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Postal / Zip Code</span>}
                  name="customerZip"
                >
                  <Input placeholder="00100" className="h-10 rounded-xl font-mono" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 3: Shipping Destination */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <IconTruck size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                Shipping Destination (Courier Delivery)
              </span>
            </div>

            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Recipient Name</span>}
                  name="shippingName"
                >
                  <Input placeholder="Recipient Full Name" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Recipient Phone</span>}
                  name="shippingPhone"
                >
                  <Input prefix={<IconPhone size={15} className="text-slate-400" />} placeholder="+94 77 999 8888" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Shipping Street Address</span>}
              name="shippingAddress"
            >
              <Input.TextArea rows={2} placeholder="Delivery street address" className="rounded-xl" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Shipping City</span>}
                  name="shippingCity"
                >
                  <Input placeholder="Kandy" className="h-10 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Shipping Zip Code</span>}
                  name="shippingZip"
                >
                  <Input placeholder="20000" className="h-10 rounded-xl font-mono" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
