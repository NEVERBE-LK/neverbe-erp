import { Button } from "antd";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Order } from "@/model/Order";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";

import { useAppSelector } from "@/lib/hooks";

import { IconPrinter, IconChevronLeft } from "@tabler/icons-react";
import { Link } from "react-router-dom";

const OrderInvoice = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const orderId = params?.orderId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (orderId && currentUser) fetchOrderById();
  }, [orderId, currentUser]);

  const fetchOrderById = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas dark:bg-canvas-dark">
        <Spinner spinning={true} tip="Generating Invoice..." />
      </div>
    );

  if (!order) return null;

  return (
    <PageContainer title={`Invoice #${order.orderId}`} loading={loading}>
      <style key="print-style">
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            @page { margin: 10mm; size: auto; }
          }
        `}
      </style>

      {/* Nav - Hidden on print */}
      <div className="flex justify-between items-center mb-8 no-print pb-6 border-b border-card-border dark:border-card-border-dark">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono">
              Official Document
            </span>
            <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
              Invoice #{order.orderId}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-text-sub dark:text-slate-400 hover:text-text-main dark:hover:text-white transition-colors uppercase tracking-wider px-3 py-2"
          >
            <IconChevronLeft size={16} /> Back to Orders
          </Link>
          <Button
            type="primary"
            icon={<IconPrinter size={16} />}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 border-none font-bold text-xs rounded-xl h-10 px-5 flex items-center gap-1.5 cursor-pointer shadow-xs"
            onClick={handlePrint}
          >
            Print Document
          </Button>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50/50 pb-20 pt-4 print:bg-white print:py-0 rounded-3xl border border-gray-100">
        <div className="max-w-[850px] mx-auto">
          {/* Invoice Paper */}
          <div
            id="printable-area"
            className="bg-white p-12 md:p-16 shadow-2xl rounded-2xl min-h-[1100px] relative text-black print:shadow-none print:p-0"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-gray-100 pb-10 mb-10">
              <div className="flex flex-col gap-4">
                <img
                  src="/logo.png"
                  alt="NeverBe"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-5xl font-bold tracking-tighter text-black leading-none mb-1">
                    Invoice
                  </h1>
                  <span className="text-xs font-bold text-gray-400">
                    Official Receipt
                  </span>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-bold  tracking-tight mb-1">
                  NeverBe.
                </h2>
                <p className="text-xs font-medium text-gray-500  tracking-wide">
                  330/4/10 New Kandy Road
                  <br />
                  Delgoda, Sri Lanka
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  +94 70 520 8999
                </p>
              </div>
            </div>

            {/* Meta Data Grid */}
            <div className="grid grid-cols-2 gap-10 mb-14 border-b border-gray-50 pb-10">
              <div className="space-y-6">
                {order.customer?.address && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 mb-1">
                      Invoice To
                    </span>
                    <p className="text-sm font-bold">
                      {order.customer?.name || "Guest"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 max-w-[200px] leading-relaxed">
                      {order.customer?.address}
                      <br />
                      {order.customer?.city} {order.customer?.zip}
                    </p>
                  </div>
                )}
                {order.customer?.shippingAddress && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 mb-1">
                      Ship To
                    </span>
                    <p className="text-sm font-bold">
                      {order.customer?.shippingName || order.customer?.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 max-w-[200px] leading-relaxed">
                      {order.customer?.shippingAddress}
                      <br />
                      {order.customer?.shippingCity}{" "}
                      {order.customer?.shippingZip}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right space-y-6">
                <div>
                  <span className="block text-xs font-bold text-gray-400   mb-1">
                    Order No.
                  </span>
                  <p className="text-lg font-bold  tracking-tight">
                    #{order.orderId}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400   mb-1">
                    Date Issued
                  </span>
                  <p className="text-sm font-bold ">
                    {order.createdAt ? String(order.createdAt) : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400   mb-1">
                    Payment Status
                  </span>
                  <p className="text-sm font-bold  tracking-wide">
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-14">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left font-bold   text-xs py-3 pr-4">
                      Item Description
                    </th>
                    <th className="text-center font-bold   text-xs py-3 px-4">
                      Size
                    </th>
                    <th className="text-center font-bold   text-xs py-3 px-4">
                      Qty
                    </th>
                    <th className="text-right font-bold   text-xs py-3 pl-4">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    // Group items: combo items by comboId, regular items separate
                    const comboGroups = new Map<string, typeof order.items>();
                    const regularItems: typeof order.items = [];

                    order.items.forEach((item) => {
                      if (item.isComboItem && item.comboId) {
                        if (!comboGroups.has(item.comboId)) {
                          comboGroups.set(item.comboId, []);
                        }
                        comboGroups.get(item.comboId)!.push(item);
                      } else {
                        regularItems.push(item);
                      }
                    });

                    return (
                      <>
                        {/* Regular Items */}
                        {regularItems.map((item, index) => (
                          <tr key={`regular-${index}`}>
                            <td className="py-4 pr-4">
                              <p className="font-bold text-black ">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500  mt-0.5">
                                {item.variantName}
                              </p>
                              {item.discount > 0 && (
                                <p className="text-xs text-red-600 mt-0.5">
                                  - Rs. {Number(item.discount).toFixed(2)}{" "}
                                  discount
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-xs font-bold text-gray-600">
                              {item.size}
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-xs font-bold text-gray-600">
                              {Number(item.quantity)}
                            </td>
                            <td className="py-4 pl-4 text-right font-mono font-bold text-black">
                              {(
                                ((Number(item.price) || 0) - (Number(item.discount) || 0)) *
                                (Number(item.quantity) || 0)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}

                        {/* Combo Groups */}
                        {Array.from(comboGroups.entries()).map(
                          ([comboId, comboItems]) => {
                            const comboName =
                              comboItems[0]?.comboName || "Combo Bundle";
                            const comboDiscount = comboItems.reduce(
                              (sum, i) => sum + (Number(i.discount) || 0),
                              0,
                            );

                            return (
                              <React.Fragment key={comboId}>
                                {/* Combo Header Row */}
                                <tr className="bg-gray-50">
                                  <td
                                    colSpan={4}
                                    className="py-3 px-4 border-y border-gray-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                          Combo
                                        </span>
                                        <span className="font-bold text-black  text-sm">
                                          {comboName}
                                        </span>
                                      </div>
                                      {comboDiscount > 0 && (
                                        <span className="text-xs font-bold text-red-600">
                                          - Rs. {comboDiscount.toFixed(2)} saved
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {/* Combo Items */}
                                {comboItems.map((item, index) => (
                                  <tr
                                    key={`combo-${comboId}-${index}`}
                                    className="bg-gray-50/50"
                                  >
                                    <td className="py-3 pr-4 pl-6">
                                      <p className="font-medium text-gray-700  text-xs">
                                        └ {item.name}
                                      </p>
                                      <p className="text-xs text-gray-400  mt-0.5 pl-3">
                                        {item.variantName}
                                      </p>
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                                      {item.size}
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                                      {Number(item.quantity)}
                                    </td>
                                    <td className="py-3 pl-4 text-right font-mono text-gray-600 text-xs">
                                      {(
                                        ((Number(item.price) || 0) - (Number(item.discount) || 0)) *
                                        (Number(item.quantity) || 0)
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          },
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-500 ">
                  <span>Subtotal</span>
                  <span className="font-mono text-black">
                    {order.items
                      .reduce(
                        (acc, item) =>
                          acc +
                          ((Number(item.price) || 0) - (Number(item.discount) || 0)) *
                            (Number(item.quantity) || 0),
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </div>

                {/* Coupon Discount */}
                {order.couponCode && Number(order.couponDiscount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 ">
                    <div className="flex items-center gap-2">
                      <span>Coupon</span>
                      <span className="bg-green-100 text-green-700 px-1 py-0.5 text-[8px] font-bold rounded">
                        {order.couponCode}
                      </span>
                    </div>
                    <span className="font-mono text-green-600">
                      - {Number(order.couponDiscount).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Promotion Discount */}
                {Number(order.promotionDiscount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 ">
                    <div className="flex items-center gap-2">
                      <span>Promotion</span>
                      <span className="bg-amber-100 text-amber-700 px-1 py-0.5 text-[8px] font-bold">
                        AUTO
                      </span>
                    </div>
                    <span className="font-mono text-amber-600">
                      - {Number(order.promotionDiscount).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Item Discounts already factored into the net Subtotal directly above! */}

                {Number(order.shippingFee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 ">
                    <span>Shipping</span>
                    <span className="font-mono text-black">
                      {Number(order.shippingFee).toFixed(2)}
                    </span>
                  </div>
                )}

                {Number(order.fee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 ">
                    <span>Payment Fee</span>
                    <span className="font-mono text-black">
                      {Number(order.fee).toFixed(2)}
                    </span>
                  </div>
                )}

                {(() => {
                  const isCOD =
                    (order.paymentMethod || "").toLowerCase().includes("cod") ||
                    (order.paymentMethod || "").toLowerCase().includes("cash on delivery");
                  const isFeePrepaid = isCOD && !!order.deliveryFeePrepaid;
                  const prepaidShipping = isFeePrepaid ? (Number(order.shippingFee) || 450) : 0;
                  const codBalance = Math.max(0, (Number(order.total) || 0) - prepaidShipping);

                  if (!isFeePrepaid) {
                    return (
                      <div className="border-t-2 border-gray-200 pt-4 mt-4 flex justify-between items-end">
                        <span className="text-sm font-bold tracking-tight">
                          Total Due
                        </span>
                        <span className="text-xl font-bold font-mono tracking-tighter">
                          {Number(order.total).toFixed(2)}{" "}
                          <span className="text-xs text-gray-400 font-bold align-top">
                            LKR
                          </span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="flex justify-between text-xs font-bold text-emerald-600">
                        <span>Prepaid Delivery Fee</span>
                        <span className="font-mono text-emerald-600">
                          - {prepaidShipping.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t-2 border-gray-200 pt-4 mt-4 flex justify-between items-end">
                        <div>
                          <span className="text-sm font-bold tracking-tight block">
                            Total Order Value
                          </span>
                          <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                            COD Balance to Collect
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs line-through text-gray-400 font-mono block">
                            {Number(order.total).toFixed(2)} LKR
                          </span>
                          <span className="text-xl font-bold font-mono tracking-tighter text-emerald-700">
                            {codBalance.toFixed(2)}{" "}
                            <span className="text-xs text-gray-400 font-bold align-top">
                              LKR
                            </span>
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-12 right-12 border-t border-gray-100 pt-6 flex justify-between items-end">
              <div className="text-xs font-bold text-gray-400  ">
                Thank you for your purchase.
              </div>
              <div className="text-xs font-bold text-black  ">Neverbe.lk</div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OrderInvoice;
