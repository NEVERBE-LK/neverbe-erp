import React, { useState } from "react";
import { Modal, Button } from "antd";
import { IconPrinter, IconX } from "@tabler/icons-react";
import { Order } from "@/model/Order";
import { formatSLDateTime } from "@/utils/dateUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e: any) => reject(e);
    img.src = url;
  });
};

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  onClose,
  order,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!order) return null;

  const handlePrint = async () => {
    setDownloading(true);
    const { orderId, createdAt, status, items, customer, paymentMethod, paymentStatus, shippingFee, fee, discount, couponDiscount, promotionDiscount, total: backendTotal, deliveryFeePrepaid } = order;

    try {
      const doc = new jsPDF();

      // Preload images
      const loadedImages: Record<string, HTMLImageElement> = {};
      if (items) {
        await Promise.all(
          items.map(async (item: any) => {
            if (item.thumbnail) {
              try {
                const img = await loadImage(item.thumbnail);
                loadedImages[item.itemId] = img;
              } catch (e) {
                console.error("Failed to load thumbnail for", item.name, e);
              }
            }
          })
        );
      }

      // 1. HEADER BRANDING
      try {
        const img = new (window as any).Image();
        img.src = "/logo.png"; // Requires logo.png in public dir
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res; 
        });
        doc.addImage(img, "PNG", 14, 12, 12, 12);
      } catch (e) {
        console.error("Logo not found", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42); 
      doc.text("INVOICE", 30, 18);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); 
      doc.text("OFFICIAL RECEIPT", 30, 23);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("NeverBe.", 196, 16, { align: "right" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); 
      doc.text("330/4/10 New Kandy Road", 196, 21, { align: "right" });
      doc.text("Delgoda, Sri Lanka", 196, 26, { align: "right" });
      doc.text("+94 70 520 8999", 196, 31, { align: "right" });

      doc.setDrawColor(241, 245, 249); 
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      // 2. CUSTOMER & ORDER METADATA
      let y = 46;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); 
      doc.text("INVOICE TO", 14, y);
      
      y += 5;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); 
      doc.text(customer?.name || "Walk-in Customer", 14, y);
      
      if (customer) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); 
        const addressText = `${customer.address || ""}${customer.city ? `, ${customer.city}` : ""}${customer.zip ? ` ${customer.zip}` : ""}`;
        const splitBilling = doc.splitTextToSize(addressText, 60);
        y += 5;
        doc.text(splitBilling, 14, y);
        y += splitBilling.length * 4.5;
        if (customer.phone) {
          doc.text(`Tel: ${customer.phone}`, 14, y);
        }
      }

      let yShip = 46;
      if (customer?.shippingAddress) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text("SHIP TO", 80, yShip);

        yShip += 5;
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(customer.shippingName || customer.name, 80, yShip);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const shipAddressText = `${customer.shippingAddress || ""}${customer.shippingCity ? `, ${customer.shippingCity}` : ""}${customer.shippingZip ? ` ${customer.shippingZip}` : ""}`;
        const splitShipping = doc.splitTextToSize(shipAddressText, 60);
        yShip += 5;
        doc.text(splitShipping, 80, yShip);
      }

      let yOrder = 46;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("ORDER NO.", 196, yOrder, { align: "right" });
      yOrder += 4.5;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${orderId}`, 196, yOrder, { align: "right" });

      yOrder += 8;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("DATE ISSUED", 196, yOrder, { align: "right" });
      yOrder += 4.5;
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); 
      doc.text(formatSLDateTime(createdAt) || "N/A", 196, yOrder, { align: "right" });

      yOrder += 8;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("PAYMENT STATUS", 196, yOrder, { align: "right" });
      yOrder += 4.5;
      doc.setFontSize(9);
      doc.setTextColor(4, 120, 87); 
      doc.text(paymentStatus || "PENDING", 196, yOrder, { align: "right" });

      const finalMetadataY = Math.max(y + 10, yShip + 10, yOrder + 10);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(14, finalMetadataY - 5, 196, finalMetadataY - 5);

      // 3. TABLE
      const tableColumn = ["", "Item Description", "Size", "Qty", "Price", "Discount", "Amount"];
      const tableRows = items.map((item: any) => {
        const originalTotal = (item.price || 0) * (item.quantity || 1);
        const discountTotal = (item.discount || 0) * (item.quantity || 1);
        const finalTotal = originalTotal - discountTotal;
        return [
          "", 
          item.variantName ? `${item.name}\n(${item.variantName})` : item.name,
          item.size || "—",
          (item.quantity || 1).toString(),
          `Rs ${originalTotal.toLocaleString()}`,
          discountTotal > 0 ? `-Rs ${discountTotal.toLocaleString()}` : "—",
          `Rs ${finalTotal.toLocaleString()}`,
        ];
      });

      const tableStartY = finalMetadataY;
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: tableStartY,
        theme: "plain",
        headStyles: { 
          fillColor: [248, 250, 252], 
          textColor: [100, 116, 139], 
          fontStyle: "bold", 
          fontSize: 8,
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: { 
          0: { cellWidth: 15, halign: "center" },
          1: { fontStyle: "bold" },
          2: { halign: "center", textColor: [51, 65, 85] }, 
          3: { halign: "center", textColor: [51, 65, 85] }, 
          4: { halign: "right", textColor: [51, 65, 85] },
          5: { halign: "right", textColor: [225, 29, 72] }, 
          6: { halign: "right", fontStyle: "bold" }, 
        },
        styles: { cellPadding: 4, minCellHeight: 12 },
        didDrawCell: (data: any) => {
          if (data.column.index === 0 && data.cell.section === "body") {
            const item = items[data.row.index];
            const img = loadedImages[item.itemId];
            if (img) {
              const size = 8;
              const x = data.cell.x + (data.cell.width - size) / 2;
              const y = data.cell.y + (data.cell.height - size) / 2;
              try {
                doc.addImage(img, "JPEG", x, y, size, size);
              } catch (e) {
                console.error("Failed to add image to PDF cell:", e);
              }
            }
          }
        }
      });

      // 4. TOTALS
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const summaryX = 130;
      const valueX = 196;

      const rawSubtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const itemDiscountTotal = items.reduce((sum: number, item: any) => sum + (item.discount || 0) * (item.quantity || 1), 0);
      const manualDiscount = Math.max(0, (discount || 0) - (couponDiscount || 0) - (promotionDiscount || 0) - itemDiscountTotal);
      const grandTotal = backendTotal || (rawSubtotal - itemDiscountTotal - (couponDiscount || 0) - (promotionDiscount || 0) - manualDiscount + (shippingFee || 0) + (fee || 0));

      let currentY = finalY;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); 
      doc.text("Subtotal", summaryX, currentY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); 
      doc.text(`Rs ${rawSubtotal.toLocaleString()}`, valueX, currentY, { align: "right" });

      if (itemDiscountTotal > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(225, 29, 72); 
        doc.text("Item Discounts", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`-Rs ${itemDiscountTotal.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      if (couponDiscount && couponDiscount > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(225, 29, 72); 
        doc.text("Coupon Discount", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`-Rs ${couponDiscount.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      if (promotionDiscount && promotionDiscount > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(225, 29, 72); 
        doc.text("Promotion Discount", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`-Rs ${promotionDiscount.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      if (manualDiscount > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(225, 29, 72); 
        doc.text("Manual Discount", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`-Rs ${manualDiscount.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      if (shippingFee && shippingFee > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105); 
        doc.text("Shipping Fee", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); 
        doc.text(`Rs ${shippingFee.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      if (fee && fee > 0) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105); 
        doc.text("Processing Fee", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); 
        doc.text(`Rs ${fee.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      const isCOD =
        (paymentMethod || "").toLowerCase().includes("cod") ||
        (paymentMethod || "").toLowerCase().includes("cash on delivery");
      const isFeePrepaid = isCOD && !!deliveryFeePrepaid;
      const prepaidShipping = isFeePrepaid ? (shippingFee || 450) : 0;
      const codBalance = Math.max(0, grandTotal - prepaidShipping);

      if (isFeePrepaid) {
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(4, 120, 87); 
        doc.text("Prepaid Delivery Fee", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`-Rs ${prepaidShipping.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      currentY += 8;
      doc.setDrawColor(15, 23, 42); 
      doc.line(summaryX, currentY - 4, valueX, currentY - 4);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("GRAND TOTAL", summaryX, currentY);
      doc.setTextColor(4, 120, 87); 
      doc.text(`Rs ${grandTotal.toLocaleString()}`, valueX, currentY, { align: "right" });

      if (isFeePrepaid) {
        currentY += 6;
        doc.setFontSize(9);
        doc.setTextColor(180, 83, 9);
        doc.text("COD BALANCE DUE", summaryX, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`Rs ${codBalance.toLocaleString()}`, valueX, currentY, { align: "right" });
      }

      // 5. FOOTER
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); 
      doc.setDrawColor(241, 245, 249); 
      doc.line(14, 280, 196, 280);
      doc.text("Thank you for choosing NeverBe! For support queries, contact info@neverbe.lk", 105, 285, { align: "center" });

      doc.save(`NeverBe-Invoice-${orderId}.pdf`);
    } catch (err) {
      console.error("Error generating ebill PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const subtotal = order.items?.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  ) || 0;

  const itemDiscountTotal = order.items?.reduce(
    (acc, item) => acc + (item.discount || 0) * (item.quantity || 1),
    0
  ) || 0;

  const manualDiscount = Math.max(
    0,
    (order.discount || 0) - (order.couponDiscount || 0) - (order.promotionDiscount || 0) - itemDiscountTotal
  );

  const isCOD =
    (order.paymentMethod || "").toLowerCase().includes("cod") ||
    (order.paymentMethod || "").toLowerCase().includes("cash on delivery");
  const isFeePrepaid = isCOD && !!order.deliveryFeePrepaid;
  const prepaidShipping = isFeePrepaid ? (order.shippingFee || 450) : 0;
  const codBalance = Math.max(0, (order.total || 0) - prepaidShipping);

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

            {itemDiscountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Item Discounts</span>
                <span className="font-bold">-Rs {itemDiscountTotal.toLocaleString()}</span>
              </div>
            )}

            {order.couponDiscount !== undefined && order.couponDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Coupon Discount</span>
                <span className="font-bold">-Rs {order.couponDiscount.toLocaleString()}</span>
              </div>
            )}

            {order.promotionDiscount !== undefined && order.promotionDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Promotion Discount</span>
                <span className="font-bold">-Rs {order.promotionDiscount.toLocaleString()}</span>
              </div>
            )}

            {manualDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Manual Discount</span>
                <span className="font-bold">-Rs {manualDiscount.toLocaleString()}</span>
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

            {isFeePrepaid && (
              <div className="flex justify-between text-emerald-600">
                <span>Prepaid Delivery Fee (Online)</span>
                <span className="font-bold">-Rs {prepaidShipping.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-bold text-slate-900">
              <span className="uppercase">Grand Total</span>
              <span className="text-emerald-700">Rs {(order.total || 0).toLocaleString()}</span>
            </div>

            {isFeePrepaid && (
              <div className="pt-1 flex justify-between text-sm font-black text-amber-700">
                <span className="uppercase">COD Balance to Collect</span>
                <span>Rs {codBalance.toLocaleString()}</span>
              </div>
            )}
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
