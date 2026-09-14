import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Result, Button } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import PageContainer from "@/pages/components/container/PageContainer";
import { OrderEditForm } from "./components/OrderEditForm";
import toast from "react-hot-toast";

const OrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${orderId}`);
      setOrder(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageContainer title="Loading Order..." loading={true} />;
  }

  if (!order) {
    return (
      <PageContainer title="Edit Order">
        <div className="flex justify-center items-center min-h-[70vh]">
          <Result
            status="404"
            title="Order Not Found"
            subTitle="Sorry, the order you are looking for does not exist or failed to load."
            extra={
              <Link to="/orders">
                <Button
                  type="primary"
                  size="large"
                  className="h-12 px-8 font-bold bg-slate-900 dark:bg-slate-100 dark:text-slate-900"
                >
                  Back to Orders
                </Button>
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Edit Order #${order.orderId}`} loading={loading}>
      <div className="w-full flex flex-col gap-8">
        <OrderEditForm order={order} onRefresh={fetchOrder} />
      </div>
    </PageContainer>
  );
};

export default OrderEditPage;
