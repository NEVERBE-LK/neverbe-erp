import React from "react";
import { useParams, Navigate } from "react-router-dom";

const OrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  return <Navigate to={`/orders/${orderId}/view`} replace />;
};

export default OrderEditPage;
