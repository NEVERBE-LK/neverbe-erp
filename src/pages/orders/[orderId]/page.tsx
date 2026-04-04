import { Spin, Result, Button } from "antd";
import api from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Order } from "@/model/Order";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { useAppSelector } from "@/lib/hooks";
import { OrderEditForm } from "./components/OrderEditForm";
import { OrderExchangeHistory } from "./components/OrderExchangeHistory";
import toast from "react-hot-toast";
import { Link } from "react-router-dom"; // Use Next.js Link instead of MUI

const OrderEditPage = () => {
  const param = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  useEffect(() => {
    if (param.orderId && !authLoading && currentUser) {
      fetchOrder();
    }
  }, [currentUser, param.orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${param.orderId}`);
      setOrder(response.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to fetch order");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageContainer title="Loading..." loading={true} children={null} />;
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
                  className="h-12 px-8 font-bold"
                  style={{ background: "#16a34a", borderColor: "#16a34a" }}
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
        <OrderExchangeHistory orderId={order.orderId} />
      </div>
    </PageContainer>
  );
};

export default OrderEditPage;
