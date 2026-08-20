import React from "react";
import { Modal, Button } from "antd";
import { IconPrinter, IconX } from "@tabler/icons-react";
import { Order } from "@/model/Order";
import { formatSLDateTime } from "@/utils/dateUtils";

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  onClose,
  order,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items?.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  ) || 0;

  const manualOrItemDiscount = Math.max(
    0,
    (order.discount || 0) - (order.couponDiscount || 0) - (order.promotionDiscount || 0)
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={850}
      centered
      className="invoice-preview-modal"
      styles={{ body: { padding: 0 } }}
    >
      <style key="print-style">
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: fixed; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 20px; background: white; z-index: 99999; }
            .no-print { display: none !important; }
            @page { margin: 10mm; size: auto; }
          }
        `}
      </style>

      {/* Action Header in Modal */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-t-2xl no-print">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Invoice Preview
          </span>
          <span className="text-sm font-bold">#{order.orderId}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<IconPrinter size={16} />}
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 border-none font-bold text-xs rounded-xl h-9 px-4 flex items-center gap-1.5 cursor-pointer"
          >
            Print PDF / Document
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Printable Invoice Paper Area */}
      <div className="max-h-[80vh] overflow-y-auto p-8 md:p-12 bg-white text-slate-900 font-sans" id="printable-invoice">
        {/* Header Branding */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
          <div className="flex flex-col gap-3">
            <img src="/logo.png" alt="NeverBe" className="h-10 w-auto object-contain self-start" />
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-1 font-mono">
                INVOICE
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Official Receipt
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <h2 className="text-lg font-bold text-slate-900 mb-1">NeverBe.</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              330/4/10 New Kandy Road
              <br />
              Delgoda, Sri Lanka
            </p>
            <p className="text-xs text-slate-500 mt-1">+94 70 520 8999</p>
          </div>
        </div>

        {/* Customer & Order Metadata Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10 border-b border-slate-100 pb-8 font-mono">
          <div className="space-y-4">
            {order.customer && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Invoice To
                </span>
                <p className="text-xs font-bold text-slate-900">{order.customer.name}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {order.customer.address}
                  {order.customer.city && `, ${order.customer.city}`}
                  {order.customer.zip && ` ${order.customer.zip}`}
                </p>
                {order.customer.phone && <p className="text-[11px] text-slate-500 font-mono mt-0.5">Tel: {order.customer.phone}</p>}
              </div>
            )}

            {order.customer?.shippingAddress && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ship To
                </span>
                <p className="text-xs font-bold text-slate-900">{order.customer.shippingName || order.customer.name}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {order.customer.shippingAddress}
                  {order.customer.shippingCity && `, ${order.customer.shippingCity}`}
                  {order.customer.shippingZip && ` ${order.customer.shippingZip}`}
                </p>
              </div>
            )}
          </div>

          <div className="text-right space-y-3 font-mono">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order No.</span>
              <p className="text-sm font-bold text-slate-900">#{order.orderId}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Issued</span>
              <p className="text-xs font-bold text-slate-700">{formatSLDateTime(order.createdAt) || "N/A"}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
              <p className="text-xs font-bold uppercase text-emerald-700">{order.paymentStatus || "PENDING"}</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-10 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left font-bold uppercase py-3 px-4 text-slate-500">Item Description</th>
                <th className="text-center font-bold uppercase py-3 px-3 text-slate-500">Size</th>
                <th className="text-center font-bold uppercase py-3 px-3 text-slate-500">Qty</th>
                <th className="text-right font-bold uppercase py-3 px-4 text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.variantName && <p className="text-[10px] text-slate-500 uppercase">{item.variantName}</p>}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">{item.size || "—"}</td>
                  <td className="py-3 px-3 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    Rs {((item.price - (item.discount || 0)) * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals */}
        <div className="flex justify-end font-mono text-xs mb-8">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">Rs {subtotal.toLocaleString()}</span>
            </div>

            {manualOrItemDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discounts</span>
                <span className="font-bold">-Rs {manualOrItemDiscount.toLocaleString()}</span>
              </div>
            )}

            {order.shippingFee !== undefined && order.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span className="font-bold">Rs {order.shippingFee.toLocaleString()}</span>
              </div>
            )}

            {order.fee !== undefined && order.fee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Processing Fee</span>
                <span className="font-bold">Rs {order.fee.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-bold text-slate-900">
              <span className="uppercase">Grand Total</span>
              <span className="text-emerald-700">Rs {(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="pt-6 border-t border-slate-100 text-center font-mono text-[10px] text-slate-400">
          Thank you for choosing NeverBe! For support queries, contact info@neverbe.lk
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
