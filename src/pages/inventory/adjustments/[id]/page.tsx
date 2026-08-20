import type { ColumnsType } from "antd/es/table";
import { Table } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  IconPackage,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Product {
  id: string;
  label: string;
  variants: {
    variantId: string;
    variantName: string;
    sizes: string[];
    images?: { url: string; file?: string; order?: number }[];
  }[];
  availableSizes: string[];
  thumbnail?: { url: string; file: string; order: number };
}

interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName?: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  adjustedBy?: string;
  adjustedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  status: AdjustmentStatus;
  createdAt: string;
  updatedAt?: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
  remove: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
  damage: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
  return: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40",
  transfer: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40",
};

const renderStatusPill = (status: AdjustmentStatus) => {
  const config: Record<
    AdjustmentStatus,
    { bg: string; dot: string; pulseDot: string; label: string }
  > = {
    DRAFT: {
      bg: "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80",
      dot: "bg-slate-400",
      pulseDot: "",
      label: ADJUSTMENT_STATUS_LABELS.DRAFT || "Draft",
    },
    SUBMITTED: {
      bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
      dot: "bg-amber-500",
      pulseDot: "bg-amber-400",
      label: ADJUSTMENT_STATUS_LABELS.SUBMITTED || "Submitted",
    },
    APPROVED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
      dot: "bg-emerald-500",
      pulseDot: "bg-emerald-400",
      label: ADJUSTMENT_STATUS_LABELS.APPROVED || "Approved",
    },
    REJECTED: {
      bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40",
      dot: "bg-rose-500",
      pulseDot: "bg-rose-400",
      label: ADJUSTMENT_STATUS_LABELS.REJECTED || "Rejected",
    },
  };

  const c = config[status] || config.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {c.pulseDot && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.pulseDot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
      </span>
      <span>{c.label}</span>
    </span>
  );
};

const formatDate = (rawDate: any, adjustmentNumber?: string) => {
  if (!rawDate) {
    if (adjustmentNumber) {
      const match = adjustmentNumber.match(/ADJ-(\d{4})(\d{2})-/i);
      if (match) {
        const [, year, month] = match;
        return `${year}-${month}-01 00:00`;
      }
    }
    return "—";
  }
  try {
    let date = rawDate;
    if (typeof date === "object" && date !== null) {
      if (date.seconds !== undefined || date._seconds !== undefined) {
        const seconds = date.seconds !== undefined ? date.seconds : date._seconds;
        return dayjs(seconds * 1000).format("DD MMM YYYY, hh:mm A");
      }
    }
    if (typeof date === "number") {
      const ms = date < 10000000000 ? date * 1000 : date;
      return dayjs(ms).format("DD MMM YYYY, hh:mm A");
    }
    const d = dayjs(date);
    if (!d.isValid()) {
      if (adjustmentNumber) {
        const match = adjustmentNumber.match(/ADJ-(\d{4})(\d{2})-/i);
        if (match) {
          const [, year, month] = match;
          return `${year}-${month}-01 00:00`;
        }
      }
      return "—";
    }
    return d.format("DD MMM YYYY, hh:mm A");
  } catch (e) {
    return "—";
  }
};

const canApproveAdjustment = (user: any): boolean => {
  if (!user) return false;
  const role = String(user.role || "").toUpperCase();
  if (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "MANAGER" ||
    role === "OWNER"
  ) {
    return true;
  }
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return (
      user.permissions.includes("approve_adjustments") ||
      user.permissions.includes("update_inventory") ||
      user.permissions.includes("all") ||
      user.permissions.includes("*")
    );
  }
  return true;
};

export default function AdjustmentDetailPage() {
  const { id: adjustmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const canApprove = canApproveAdjustment(currentUser);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<Product[]>("/api/v1/erp/master/products/dropdown");
        setProducts(res.data || []);
      } catch (e) {
        console.error("Failed to fetch products", e);
      }
    };
    if (currentUser) fetchProducts();
  }, [currentUser]);

  const fetchAdjustment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Adjustment>(
        `/api/v1/erp/inventory/adjustments/${adjustmentId}`,
      );
      setAdjustment(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch adjustment");
    } finally {
      setLoading(false);
    }
  }, [adjustmentId]);

  useEffect(() => {
    if (currentUser && adjustmentId) {
      fetchAdjustment();
    }
  }, [currentUser, adjustmentId, fetchAdjustment]);

  const handleUpdateStatus = (status: AdjustmentStatus) => {
    if (!canApprove) {
      toast.error("You do not have permission to approve or reject adjustments");
      return;
    }
    let message = `Are you sure you want to ${status.toLowerCase()} this adjustment?`;
    let confirmText = "Confirm";
    let variant: "default" | "danger" | "warning" = "default";

    if (status === "APPROVED") {
      message =
        "Are you sure you want to APPROVE this adjustment? This will immediately apply and persist inventory changes to the database.";
      confirmText = "Approve & Persist";
      variant = "default";
    } else if (status === "REJECTED") {
      message =
        "Are you sure you want to REJECT this adjustment? This action cannot be undone.";
      confirmText = "Reject";
      variant = "danger";
    }

    showConfirmation({
      title: `Confirm ${status.toLowerCase()}`,
      message,
      variant,
      confirmText,
      onSuccess: async () => {
        try {
          const now = new Date().toISOString();
          const approverName =
            currentUser?.username || currentUser?.email || "System Approver";
          const approverId = currentUser?.userId || "system";

          const updateData: any = {
            status,
            updatedAt: now,
          };

          if (status === "APPROVED") {
            updateData.approvedBy = approverId;
            updateData.approvedByName = approverName;
            updateData.approvedAt = now;
          } else if (status === "REJECTED") {
            updateData.rejectedBy = approverId;
            updateData.rejectedByName = approverName;
            updateData.rejectedAt = now;
          }

          const formData = new FormData();
          formData.append("data", JSON.stringify(updateData));
          await api.put(
            `/api/v1/erp/inventory/adjustments/${adjustmentId}/status`,
            formData,
          );
          toast.success(
            status === "APPROVED"
              ? "Adjustment approved and persisted to database"
              : "Adjustment rejected",
          );
          fetchAdjustment();
        } catch (error) {
          console.error(error);
          toast.error("Failed to update status");
        }
      },
    });
  };

  const handleDeleteDraft = () => {
    showConfirmation({
      title: "Delete Draft Adjustment?",
      message: `Are you sure you want to delete draft adjustment #${adjustment?.adjustmentNumber}? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/inventory/adjustments/${adjustmentId}`);
          toast.success("Draft adjustment deleted");
          navigate("/inventory/adjustments");
        } catch (error) {
          console.error(error);
          toast.error("Failed to delete draft adjustment");
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="Adjustment">
        <div className="flex justify-center py-20">
          <Spinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!adjustment) {
    return (
      <PageContainer title="Adjustment">
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          Adjustment not found
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<AdjustmentItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const variant = prod?.variants.find((v) => v.variantId === item.variantId);
        const imageUrl = variant?.images?.[0]?.url || prod?.thumbnail?.url;

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconPackage className="text-slate-400 dark:text-slate-600" size={18} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{item.productName}</span>
              {item.variantName && (
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  {item.variantName}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Size",
      key: "size",
      render: (_, item) => <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{item.size}</span>,
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, item) => (
        <span
          className={`font-bold text-xs ${
            adjustment.type === "add" || adjustment.type === "return"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {adjustment.type === "add" || adjustment.type === "return"
            ? "+"
            : "-"}
          {item.quantity}
        </span>
      ),
    },
    {
      title: "Stock Location",
      key: "stock",
      render: (_, item) => (
        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs">
          <IconMapPin size={14} className="text-slate-400" />
          <span>{item.stockName || item.stockId}</span>
        </span>
      ),
    },
    {
      title: "Destination Location",
      key: "destination",
      render: (_, item) => (
        <span className="text-slate-700 dark:text-slate-300 text-xs">
          {item.destinationStockName || item.destinationStockId || "—"}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title={adjustment.adjustmentNumber}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Adjustment Details
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                #{adjustment.adjustmentNumber}
              </h2>
            </div>
          </div>

          {/* Action Buttons: DRAFT shows Delete, SUBMITTED shows Reject/Approve (only if user has permission) */}
          {adjustment.status === "DRAFT" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5"
              >
                <IconTrash size={15} />
                Delete Draft
              </button>
            </div>
          )}

          {adjustment.status === "SUBMITTED" && canApprove && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus("REJECTED")}
                className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("APPROVED")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5"
              >
                <IconCheck size={16} />
                Approve Adjustment
              </button>
            </div>
          )}
        </div>

        {/* Single Card: Adjustment Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              Adjustment Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* 1. Adjustment Number */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Adjustment Number
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                #{adjustment.adjustmentNumber}
              </span>
            </div>

            {/* 2. Type */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Adjustment Type
              </span>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${TYPE_COLORS[adjustment.type]}`}>
                  {TYPE_LABELS[adjustment.type]}
                </span>
              </div>
            </div>

            {/* 3. Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Current Status
              </span>
              <div>
                {renderStatusPill(adjustment.status)}
              </div>
            </div>

            {/* 4. Reason */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Stated Reason
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase block truncate">
                {adjustment.reason || "N/A"}
              </span>
            </div>

            {/* 5. Adjusted By */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Adjusted By
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                  {adjustment.adjustedByName?.charAt(0).toUpperCase() || "S"}
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {adjustment.adjustedByName || "System Process"}
                </span>
              </div>
            </div>

            {/* 6. Impacted Items */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Impacted Items
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                {adjustment.items?.length || 0} SKU Items
              </span>
            </div>

            {/* 7. Created At */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Created At
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate font-mono">
                <IconCalendar size={14} className="text-slate-400 shrink-0" />
                {formatDate(adjustment.createdAt, adjustment.adjustmentNumber)}
              </span>
            </div>

            {/* 8. Last Update */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Last Update
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate font-mono">
                <IconClock size={14} className="text-slate-400 shrink-0" />
                {formatDate(adjustment.updatedAt, adjustment.adjustmentNumber)}
              </span>
            </div>

            {/* 9. Approved By (when approved) */}
            {(adjustment.approvedByName || adjustment.status === "APPROVED") && (
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Approved By
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {(adjustment.approvedByName || "A").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {adjustment.approvedByName || adjustment.approvedBy || "System Approver"}
                  </span>
                </div>
              </div>
            )}

            {/* 10. Approved Date (when approved) */}
            {(adjustment.approvedAt || adjustment.status === "APPROVED") && (
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Approved Date & Time
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate font-mono">
                  <IconCalendar size={14} className="text-emerald-500 shrink-0" />
                  {formatDate(adjustment.approvedAt || adjustment.updatedAt, adjustment.adjustmentNumber)}
                </span>
              </div>
            )}

            {/* 11. Rejected By (when rejected) */}
            {(adjustment.rejectedByName || adjustment.status === "REJECTED") && (
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                  Rejected By
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                    {(adjustment.rejectedByName || "R").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {adjustment.rejectedByName || adjustment.rejectedBy || "System User"}
                  </span>
                </div>
              </div>
            )}

            {/* 12. Rejected Date (when rejected) */}
            {(adjustment.rejectedAt || adjustment.status === "REJECTED") && (
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                  Rejected Date & Time
                </span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 truncate font-mono">
                  <IconCalendar size={14} className="text-rose-500 shrink-0" />
                  {formatDate(adjustment.rejectedAt || adjustment.updatedAt, adjustment.adjustmentNumber)}
                </span>
              </div>
            )}
          </div>

          {adjustment.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Auditor Notes
              </span>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 border-dashed">
                <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed m-0">
                  "{adjustment.notes}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Full Width Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              Inventory Items ({adjustment.items?.length || 0})
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table
              columns={columns}
              dataSource={adjustment.items}
              rowKey={(r: any) =>
                r.productId +
                (r.variantId || "") +
                r.size +
                Math.random().toString()
              }
              pagination={false}
              size="small"
              className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:dark:!text-slate-400 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {adjustment.items?.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              const variant = prod?.variants.find((v) => v.variantId === item.variantId);
              const imageUrl = variant?.images?.[0]?.url || prod?.thumbnail?.url;

              return (
                <div key={idx} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPackage className="text-slate-400 dark:text-slate-600" size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block truncate">
                          {item.productName}
                        </span>
                        {item.variantName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase tracking-wide">
                            {item.variantName}
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                            SIZE: {item.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-base font-bold ${
                          adjustment.type === "add" || adjustment.type === "return"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {adjustment.type === "add" || adjustment.type === "return"
                          ? "+"
                          : "-"}
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="uppercase tracking-widest text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                        Source
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {item.stockName || item.stockId}
                      </span>
                    </div>
                    {adjustment.type === "transfer" && (
                      <>
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs text-slate-400">
                          →
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 text-right">
                          <span className="uppercase tracking-widest text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            Destination
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                            {item.destinationStockName || item.destinationStockId}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

