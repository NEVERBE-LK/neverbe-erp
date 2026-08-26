import React from "react";
import PageContainer from "../../../components/container/PageContainer";
import { useParams } from "react-router-dom";
import OrderView from "./components/OrderView";

const OrderPage = () => {
  const params = useParams();
  const orderId = params?.orderId as string;

  return (
    <PageContainer title={`Order View - ${orderId}`} description="Order View">
      <OrderView orderId={orderId} />
    </PageContainer>
  );
};

export default OrderPage;
