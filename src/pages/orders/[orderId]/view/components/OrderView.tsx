import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Alert,
  Spin,
} from "antd";

const { Text } = Typography;

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchOrder();
  }, [currentUser]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      setOrder(res.data || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to fetch order");
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal =
    (order?.total || 0) +
    (order?.discount || 0) -
    (order?.shippingFee || 0) -
    (order?.fee || 0);

  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;

  if (loadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  // --- Helpers for Status Colors ---
  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "orange";
      default:
        return "default";
    }
  };

  const getOrderStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "processing";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <Text strong>{text}</Text>
          {record.isComboItem && (
            <Tag color="purple" className="w-fit mt-1 text-[10px]">
              BIN: {record.comboName}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Variant",
      dataIndex: "variantName",
      key: "variantName",
      render: (text: string) => <Text type="secondary">{text || "-"}</Text>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center" as const,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Price Breakdown",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      width: 180,
      render: (price: number, record: any) => {
        const disc = record.discount || 0;
        const sold = price - disc;
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Text type="secondary" className="text-[10px] uppercase">
                Retail
              </Text>
              <Text className="text-xs line-through text-gray-400">
                {price.toLocaleString()}
              </Text>
            </div>
            {disc > 0 && (
              <div className="flex items-center gap-2">
                <Text type="secondary" className="text-[10px] uppercase">
                  Disc
                </Text>
                <Text className="text-xs text-red-500 font-medium">
                  -{disc.toLocaleString()}
                </Text>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100 border-dashed w-full justify-end">
              <Text
                type="secondary"
                className="text-[10px] uppercase font-bold text-green-700"
              >
                Sold
              </Text>
              <Text strong className="text-green-700">
                {sold.toLocaleString()}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Line Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => (
        <div className="bg-gray-50 px-2 py-1 rounded">
          <Text strong className="text-sm">
            {(
              (record.quantity || 0) *
              ((record.price || 0) - (record.discount || 0))
            ).toLocaleString()}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Integrity Alert */}
      {order && order.integrity === false && (
        <Alert
          message="Security Integrity Check Failed"
          description="This order has failed system integrity checks. Please exercise extreme caution before proceeding."
          type="error"
          showIcon
          className="rounded-2xl border-none shadow-sm"
        />
      )}

      <div className="flex justify-between items-end mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-green-600 rounded-full" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
              Order Details
            </span>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
              Order #{order?.orderId}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tag
            color={getPaymentStatusColor(order?.paymentStatus)}
            className="px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider"
          >
            {order?.paymentStatus}
          </Tag>
          <Tag
            color={getOrderStatusColor(order?.status)}
            className="px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider"
          >
            {order?.status}
          </Tag>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card
            title={
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Order Items ({order?.items?.length || 0})
              </span>
            }
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none"
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
              },
            }}
          >
            <Table
              scroll={{ x: 1000 }}
              dataSource={order?.items || []}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => `${record.productId}_${index}`}
              size="small"
              className="rounded-xl overflow-hidden"
            />
          </Card>

          <Card
            title={
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Transaction & Processing
              </span>
            }
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none border-t-4 border-t-green-500"
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
              },
            }}
          >
            <Descriptions
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              size="small"
              labelStyle={{
                fontWeight: 600,
                background: "#f8fafc",
                width: "140px",
              }}
            >
              <Descriptions.Item label="Payment Method">
                <Space direction="vertical" size={0}>
                  <Text strong>{order?.paymentMethod}</Text>
                  <Text type="secondary" className="text-[10px]">
                    ID: {order?.paymentMethodId}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                <Text
                  code
                  className="bg-green-50 text-green-700 border-green-100"
                >
                  {order?.paymentId || "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Placement Date">
                <Text>
                  {order?.createdAt ? String(order.createdAt) : "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Last Update">
                <Text>
                  {order?.updatedAt ? String(order.updatedAt) : "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Inventory Source">
                <Tag color="cyan">
                  {order?.from || "-"} / {order?.stockId || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="System Check">
                {order?.integrity ? (
                  <Tag color="success" bordered={false}>
                    INTEGRITY VERIFIED
                  </Tag>
                ) : (
                  <Tag color="error" bordered={false}>
                    CHECKS FAILED
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Right Column: Financials & Customer */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card
            title={
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Financial Summary
              </span>
            }
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none"
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
              },
            }}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Text className="text-gray-500 text-sm">Subtotal</Text>
                <Text strong className="text-gray-900">
                  {subtotal.toLocaleString()} LKR
                </Text>
              </div>

              {order?.couponCode && (order?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <Text className="text-green-600 text-sm font-medium">
                    Coupon ({order.couponCode})
                  </Text>
                  <Text className="text-green-600 font-bold">
                    - {(order.couponDiscount || 0).toLocaleString()} LKR
                  </Text>
                </div>
              )}

              {(order?.promotionDiscount || 0) > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <Text className="text-sm font-medium">Auto Promotion</Text>
                  <Text className="font-bold">
                    - {(order.promotionDiscount || 0).toLocaleString()} LKR
                  </Text>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-500">
                <Text className="text-sm">Shipping</Text>
                <Text className="font-medium text-gray-700">
                  {shippingFee.toLocaleString()} LKR
                </Text>
              </div>

              <div className="flex justify-between items-center text-gray-500">
                <Text className="text-sm">Processing Fee</Text>
                <Text className="font-medium text-gray-700">
                  {fee.toLocaleString()} LKR
                </Text>
              </div>

              <div className="pt-6 mt-2 border-t border-dashed border-gray-100">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-green-800">
                    Grand Total
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-black tracking-tighter text-green-700">
                      {order?.total?.toLocaleString()}
                    </span>
                    <span className="text-xs text-green-500 font-bold ml-1">
                      LKR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {order?.customer && (
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  Customer Intelligence
                </span>
              }
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none"
              styles={{
                header: {
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                },
              }}
            >
              <Space direction="vertical" size="large" className="w-full">
                {(order.customer.address || order.customer.city) && (
                  <div>
                    <Text
                      type="secondary"
                      className="text-[10px] uppercase font-bold text-green-600 block mb-2"
                    >
                      Contact Info
                    </Text>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col">
                        <Text strong className="text-sm">
                          {order.customer.name}
                        </Text>
                        <Text className="text-gray-500 text-xs leading-relaxed">
                          {order.customer.address}
                          <br />
                          {order.customer.city} {order.customer.zip}
                        </Text>
                        {order.customer.phone && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Text className="text-gray-600 text-[11px] font-medium">
                              {order.customer.phone}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {order.customer.shippingAddress && (
                  <div className="pt-4 border-t border-gray-50">
                    <Text
                      type="secondary"
                      className="text-[10px] uppercase font-bold text-green-600 block mb-2"
                    >
                      Shipping Address
                    </Text>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col">
                        <Text strong className="text-sm">
                          {order.customer.shippingName || order.customer.name}
                        </Text>
                        <Text className="text-gray-500 text-xs leading-relaxed">
                          {order.customer.shippingAddress}
                          <br />
                          {order.customer.shippingCity}{" "}
                          {order.customer.shippingZip}
                        </Text>
                        {(order.customer.shippingPhone ||
                          order.customer.phone) && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Text className="text-gray-600 text-[11px] font-medium">
                              {order.customer.shippingPhone ||
                                order.customer.phone}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderView;
