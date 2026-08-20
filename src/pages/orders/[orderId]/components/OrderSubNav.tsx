import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconUser, IconPackage, IconTruck, IconEye, IconPrinter, IconArrowLeft, IconLock } from "@tabler/icons-react";
import { Order } from "@/model/Order";
import { Button } from "antd";
import { InvoicePreviewModal } from "./InvoicePreviewModal";

interface OrderSubNavProps {
  orderId: string;
  order?: Order | null;
}

export const OrderSubNav: React.FC<OrderSubNavProps> = ({ orderId, order }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const isTerminal = ["completed", "returned", "refused (rto)", "refused", "exchanged", "cancelled"].includes(
    (order?.status || "").toLowerCase()
  );

  const tabs = [
    {
      key: "customer",
      label: "Customer Profile",
      icon: IconUser,
      path: `/orders/${orderId}/customer`,
    },
    {
      key: "items",
      label: "Order Items",
      icon: IconPackage,
      path: `/orders/${orderId}/items`,
    },
    {
      key: "tracking",
      label: "Tracking & Delivery",
      icon: IconTruck,
      path: `/orders/${orderId}/tracking`,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Navigation Links */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-card-border dark:border-card-border-dark">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-mono"
                  : "bg-transparent text-text-sub dark:text-slate-400 hover:text-text-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isTerminal && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-mono shadow-2xs">
          <span className="flex items-center gap-2">
            <IconLock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            Order #{orderId} is in terminal status ({order?.status}). Customer profile & order items are frozen.
          </span>
        </div>
      )}

      <InvoicePreviewModal
        open={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={order || null}
      />
    </div>
  );
};

export default OrderSubNav;
