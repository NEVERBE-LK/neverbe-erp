import React from "react";
import { useParams, Navigate } from "react-router-dom";

const OrderEditPage = () => {
  const { orderId } = useParams();
  return <Navigate to={`/orders/${orderId}/customer`} replace />;
};

export default OrderEditPage;
