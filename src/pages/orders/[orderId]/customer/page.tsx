import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Row, Col } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import OrderSubNav from "../components/OrderSubNav";
import { IconUser, IconDeviceFloppy, IconMail, IconPhone, IconMapPin, IconTruck } from "@tabler/icons-react";

const OrderCustomerEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      const data = res.data;
      setOrder(data);

      form.setFieldsValue({
        userId: data.userId || "",
        customerName: data.customer?.name || "",
        customerEmail: data.customer?.email || "",
        customerPhone: data.customer?.phone || "",
        customerAddress: data.customer?.address || "",
        customerCity: data.customer?.city || "",
        customerZip: data.customer?.zip || "",
        shippingName: data.customer?.shippingName || data.customer?.name || "",
        shippingAddress: data.customer?.shippingAddress || "",
        shippingCity: data.customer?.shippingCity || "",
        shippingZip: data.customer?.shippingZip || "",
        shippingPhone: data.customer?.shippingPhone || data.customer?.phone || "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
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

      await api.patch(`/api/v1/erp/orders/${orderId}/customer`, payload);
      toast.success("Customer profile & addresses updated successfully");
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update customer info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Order...">
        <div className="flex justify-center items-center py-24">
          <Spinner spinning={true} tip="Loading Customer Details..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Customer Profile | Order #${orderId}`}>
      <div className="w-full space-y-6">
        <OrderSubNav orderId={orderId!} order={order} />

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Row gutter={[24, 24]}>
            {/* Left Column: Customer Coordinates & Billing */}
            <Col xs={24} lg={12}>
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconUser size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Customer Profile
                    </h3>
                  </div>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Customer Full Name</span>} name="customerName" rules={[{ required: true, message: "Customer name is required" }]}>
                    <Input placeholder="John Doe" className="h-10 rounded-xl" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Email Address</span>} name="customerEmail">
                        <Input prefix={<IconMail size={15} className="text-text-sub" />} placeholder="john@example.com" className="h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Phone Number</span>} name="customerPhone">
                        <Input prefix={<IconPhone size={15} className="text-text-sub" />} placeholder="+94 77 123 4567" className="h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">User ID / Client Reference</span>} name="userId">
                    <Input placeholder="User ID" className="h-10 rounded-xl font-mono" />
                  </Form.Item>
                </div>

                {/* Billing Address Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconMapPin size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Billing Address
                    </h3>
                  </div>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Street Address</span>} name="customerAddress">
                    <Input.TextArea rows={2} placeholder="No. 123, Main Street" className="rounded-xl" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={14}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">City</span>} name="customerCity">
                        <Input placeholder="Colombo" className="h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Postal / Zip Code</span>} name="customerZip">
                        <Input placeholder="00100" className="h-10 rounded-xl font-mono" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>

            {/* Right Column: Shipping Details & Actions */}
            <Col xs={24} lg={12}>
              <div className="space-y-6">
                {/* Shipping Details Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconTruck size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Shipping Destination
                    </h3>
                  </div>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Recipient Name</span>} name="shippingName">
                    <Input placeholder="Recipient Name" className="h-10 rounded-xl" />
                  </Form.Item>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Shipping Street Address</span>} name="shippingAddress">
                    <Input.TextArea rows={2} placeholder="Delivery address" className="rounded-xl" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={14}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Shipping City</span>} name="shippingCity">
                        <Input placeholder="Kandy" className="h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item label={<span className="text-xs font-semibold text-text-sub">Shipping Zip</span>} name="shippingZip">
                        <Input placeholder="20000" className="h-10 rounded-xl font-mono" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label={<span className="text-xs font-semibold text-text-sub">Shipping Contact Phone</span>} name="shippingPhone">
                    <Input prefix={<IconPhone size={15} className="text-text-sub" />} placeholder="+94 77 999 8888" className="h-10 rounded-xl" />
                  </Form.Item>
                </div>

                {/* Submit Action Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={saving}
                    icon={<IconDeviceFloppy size={18} />}
                    className="h-11 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Save Customer Changes
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </PageContainer>
  );
};

export default OrderCustomerEditPage;
