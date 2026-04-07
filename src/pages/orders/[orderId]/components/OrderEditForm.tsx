import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Alert,
} from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import NeuralOrderInsight from "./NeuralOrderInsight";

interface OrderEditFormProps {
  order: Order;
  onRefresh?: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onRefresh,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<
    { paymentId: string; name: string }[]
  >([]);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    form.setFieldsValue({
      ...order,
      customer: order.customer || {},
    });
    fetchPaymentMethods();
  }, [order, form]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get("/api/v1/erp/finance/payment-methods");
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  const onFinish = async (values: Order) => {
    showConfirmation({
      title: "UPDATE ORDER",
      message:
        order?.integrity === false
          ? "WARNING: THIS ORDER IS FLAGGED. CONFIRM UPDATE?"
          : "CONFIRM UPDATING ORDER DETAILS?",
      confirmText: "UPDATE",
      variant: order?.integrity === false ? "danger" : "default",
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
          // Construct payload with status history if status changed
          const payload = { ...values };
          if (values.status !== order.status) {
            const existingHistory = order.statusHistory || [];
            payload.statusHistory = [
              ...existingHistory,
              { status: values.status, date: new Date().toISOString() },
            ];
          }

          const fd = new FormData();
          fd.append("data", JSON.stringify(payload));
          await api.put(`/api/v1/erp/orders/${order.orderId}`, fd);
          toast.success(`ORDER #${order.orderId} UPDATED`);
          onRefresh?.();
        } catch (error: any) {
          console.error(error);
          toast.error(
            error.response?.data?.message || "Failed to update order",
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <div className="w-full animate-in fade-in duration-700 space-y-16">
        {/* ⚠️ Security Alert */}
        {order.integrity === false && (
          <Alert
            message="Security Integrity Check Failed"
            description="This order has failed system integrity checks. Please exercise extreme caution before proceeding."
            type="error"
            showIcon
            className="shadow-sm"
          />
        )}

        {/* 🧠 Neural Strategy Hub - Priority View */}
        <div className="mb-8">
           <NeuralOrderInsight order={order} />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-12"
        >
          <Row gutter={[48, 64]}>
            {/* Main Configuration Card */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={48} className="w-full">
                <Card
                  title={<span className="text-emerald-900/40 text-[10px] font-black uppercase tracking-widest">Order Configuration</span>}
                  className="shadow-xl shadow-gray-200/50 border-gray-100"
                  bodyStyle={{ padding: '32px' }}
                >
                  <Row gutter={40}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Order Status"
                        name="status"
                        rules={[{ required: true }]}
                      >
                        <Select size="large">
                          <Select.Option value="Pending">PENDING</Select.Option>
                          <Select.Option value="Processing">
                            PROCESSING
                          </Select.Option>
                          <Select.Option value="Completed">
                            COMPLETED
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Payment Method"
                        name="paymentMethod"
                        rules={[{ required: true }]}
                      >
                        <Select size="large" placeholder="Select Method">
                          {paymentMethods.map((m) => (
                            <Select.Option
                              key={m.paymentId}
                              value={m.paymentId.toUpperCase()}
                            >
                              {m.name.toUpperCase()}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Payment Status"
                        name="paymentStatus"
                        rules={[{ required: true }]}
                      >
                        <Select size="large">
                          <Select.Option value="Pending">PENDING</Select.Option>
                          <Select.Option value="Paid">PAID</Select.Option>
                          <Select.Option value="Failed">FAILED</Select.Option>
                          <Select.Option value="Refunded">
                            REFUNDED
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={40} className="mt-8">
                    <Col xs={24} md={12}>
                      <Form.Item label="Tracking Number" name="trackingNumber">
                        <Input size="large" placeholder="Enter Tracking Number" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Shipping Courier" name="courier">
                        <Select size="large" placeholder="Select Courier (e.g., Domex)">
                          <Select.Option value="Domex">Domex</Select.Option>
                          <Select.Option value="Certis">Certis</Select.Option>
                          <Select.Option value="Prompt">Prompt Express</Select.Option>
                          <Select.Option value="Koombiyo">Koombiyo</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Customer Information Grid */}
                <Row gutter={[32, 48]}>
                  <Col xs={24} md={12}>
                    <Card
                      title={<span className="text-emerald-900/40 text-[10px] font-black uppercase tracking-widest">Billing Details</span>}
                      className="shadow-xl shadow-gray-200/50 border-gray-100 h-full"
                      bodyStyle={{ padding: '32px' }}
                    >
                      <div className="space-y-6">
                        <Form.Item
                          label="Customer Name"
                          name={["customer", "name"]}
                        >
                          <Input size="large" placeholder="Full Name" />
                        </Form.Item>
                        <Form.Item
                          label="Email Address"
                          name={["customer", "email"]}
                        >
                          <Input
                            size="large"
                            type="email"
                            placeholder="email@example.com"
                          />
                        </Form.Item>
                        <Form.Item
                          label="Phone Number"
                          name={["customer", "phone"]}
                        >
                          <Input size="large" placeholder="+94 XX XXX XXXX" />
                        </Form.Item>
                        <Form.Item
                          label="Street Address"
                          name={["customer", "address"]}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Mailing Address"
                          />
                        </Form.Item>
                        <Row gutter={8}>
                          <Col span={14}>
                            <Form.Item label="City" name={["customer", "city"]}>
                              <Input size="large" placeholder="City" />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              label="Zip Code"
                              name={["customer", "zip"]}
                            >
                              <Input size="large" placeholder="00000" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card
                      title={<span className="text-emerald-900/40 text-[10px] font-black uppercase tracking-widest">Shipping Details</span>}
                      className="shadow-xl shadow-gray-200/50 border-gray-100 h-full"
                      bodyStyle={{ padding: '32px' }}
                    >
                      <div className="space-y-6">
                        <Form.Item
                          label="Recipient Name"
                          name={["customer", "shippingName"]}
                        >
                          <Input size="large" placeholder="Recipient Name" />
                        </Form.Item>
                        <Form.Item
                          label="Contact Phone"
                          name={["customer", "shippingPhone"]}
                        >
                          <Input size="large" placeholder="+94 XX XXX XXXX" />
                        </Form.Item>
                        <Form.Item
                          label="Street Address"
                          name={["customer", "shippingAddress"]}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Shipping Address"
                          />
                        </Form.Item>
                        <Row gutter={8}>
                          <Col span={14}>
                            <Form.Item
                              label="City"
                              name={["customer", "shippingCity"]}
                            >
                              <Input size="large" placeholder="City" />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              label="Zip Code"
                              name={["customer", "shippingZip"]}
                            >
                              <Input size="large" placeholder="00000" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </Col>
                </Row>
                

              </Space>
            </Col>

            {/* Action Sidebar */}
            <Col xs={24} lg={8}>
              <Card
                className="sticky top-8 shadow-2xl shadow-emerald-900/10 border-emerald-500/10 bg-[#f8fafc]"
                title={
                  <span className="text-emerald-900 text-xs font-black uppercase tracking-[0.2em] opacity-40">
                    Update Summary
                  </span>
                }
                bodyStyle={{ padding: '24px' }}
              >
                <div className="space-y-6">
                  <div className="bg-white p-4 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-medium">
                        Order ID
                      </span>
                      <span className="font-bold">#{order.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">
                        Original Status
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 rounded uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <Divider className="my-0" />

                  <Space direction="vertical" className="w-full" size="middle">
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={isSubmitting}
                      className="h-14 font-bold text-base shadow-lg shadow-green-100"
                      style={{ background: "#16a34a", borderColor: "#16a34a" }}
                    >
                      Commit Changes
                    </Button>
                    <Button
                      block
                      size="large"
                      onClick={() =>
                        form.setFieldsValue({
                          ...order,
                          customer: order.customer || {},
                        })
                      }
                      className="h-12 border-gray-200 text-gray-600 hover:text-black font-medium"
                    >
                      Discard Changes
                    </Button>
                  </Space>

                  <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed">
                    By committing these changes, the order state and customer
                    data will be permanently updated. Detailed history will be
                    recorded for audit purposes.
                  </p>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
    </div>
  );
};
