import type { ColumnsType } from "antd/es/table";
import { Table } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  IconPackage,
  IconSend,
  IconX,
  IconFileInvoice,
  IconCheck,
  IconBuildingStore,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconBuildingWarehouse,
  IconTrash,
  IconUserCheck,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  PurchaseOrder,
  PO_STATUS_LABELS,
  PurchaseOrderStatus,
} from "@/model/PurchaseOrder";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import dayjs from "dayjs";

const PO_STATUS_STYLING: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; dot: string }
> = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
    dot: "bg-slate-400",
  },
  SUBMITTED: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
    dot: "bg-amber-500 animate-pulse",
  },
  APPROVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
    dot: "bg-emerald-500 animate-pulse",
  },
  REJECTED: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
    dot: "bg-rose-500",
  },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format("MMM DD, YYYY · HH:mm") : "—";
};

const formatOnlyDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format("MMM DD, YYYY") : "—";
};

interface Product {
  id: string;
  name: string;
  thumbnail?: { url: string };
  variants: {
    variantId: string;
    name: string;
    images?: { url: string }[];
  }[];
}

interface StockLocation {
  id: string;
  label: string;
  name?: string;
}

const ViewPurchaseOrderPage = () => {
  const params = useParams();
  const poId = params.id as string;
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockLocation[]>([]);
  const [pageSize, setPageSize] = useState(5);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [prodRes, stockRes] = await Promise.all([
          api.get<Product[]>("/api/v1/erp/master/products/dropdown"),
          api.get<StockLocation[]>("/api/v1/erp/master/stocks/dropdown"),
        ]);
        setProducts(prodRes.data || []);
        setStocks(stockRes.data || []);
      } catch (e) {
        console.error("Failed to fetch master data", e);
      }
    };
    if (currentUser) fetchMasterData();
  }, [currentUser]);

  const resolvedStockName = useMemo(() => {
    if (!po) return "—";
    if (po.stockName && !po.stockName.startsWith("stock-")) {
      return po.stockName;
    }
    if (po.stockId) {
      const match = stocks.find(
        (s) => s.id === po.stockId || s.id === po.stockName,
      );
      if (match?.label) return match.label;
      if (match?.name) return match.name;
    }
    if (po.stockName && po.stockName.startsWith("stock-")) {
      return "Main Warehouse";
    }
    return po.stockName || po.stockId || "—";
  }, [po, stocks]);

  const fetchPO = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseOrder>(
        `/api/v1/erp/procurement/purchase-orders/${poId}`,
      );
      setPO(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch purchase order");
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    if (currentUser && poId) fetchPO();
  }, [currentUser, poId, fetchPO]);

  const handleUpdateStatus = (status: PurchaseOrderStatus) => {
    const actionMap: Record<string, string> = {
      SUBMITTED: "Submit for Review",
      APPROVED: "Approve",
      REJECTED: po?.status === "DRAFT" ? "Cancel" : "Reject",
    };

    const action = actionMap[status] || "Update Status";
    const isDestructive = status === "REJECTED";

    showConfirmation({
      title: `${action.toUpperCase()}?`,
      message: `Are you sure you want to ${action.toLowerCase()} this order?`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdating(true);
        try {
          const nowIso = new Date().toISOString();
          const payload: any = { status, updatedAt: nowIso };

          if (status === "APPROVED") {
            payload.approvedBy = currentUser?.id || "";
            payload.approvedByName =
              currentUser?.firstName && currentUser?.lastName
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : currentUser?.username || currentUser?.email || "Manager";
            payload.approvedAt = nowIso;
          } else if (status === "REJECTED") {
            payload.rejectedBy = currentUser?.id || "";
            payload.rejectedByName =
              currentUser?.firstName && currentUser?.lastName
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : currentUser?.username || currentUser?.email || "Manager";
            payload.rejectedAt = nowIso;
          }

          await api.patch(`/api/v1/erp/procurement/purchase-orders/${poId}`, payload);
          toast.success(`Order ${action}ed successfully`);
          fetchPO();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleDeleteDraftPO = () => {
    if (!po) return;
    showConfirmation({
      title: "DELETE DRAFT PURCHASE ORDER?",
      message: `Are you sure you want to delete draft purchase order #${po.poNumber}? This action cannot be undone.`,
      variant: "danger",
      onSuccess: async () => {
        setUpdating(true);
        try {
          await api.delete(`/api/v1/erp/procurement/purchase-orders/${poId}`);
          toast.success("Draft purchase order deleted successfully");
          navigate("/inventory/purchase-orders");
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to delete draft order");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-40">
          <Spinner size="large" tip="Loading Order Details" />
        </div>
      </PageContainer>
    );
  }

  if (!po) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-32 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl m-4">
          <IconFileInvoice className="text-slate-300 dark:text-slate-600 mb-4" size={48} />
          <div className="text-center text-slate-500 dark:text-slate-400 font-semibold text-sm font-mono">
            Purchase order not found
          </div>
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<any> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const variant = prod?.variants?.find((v) => v.variantId === item.variantId);
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
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                {item.productName}
              </span>
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
      align: "center",
      render: (_, item) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
          {item.size || "—"}
        </span>
      ),
    },
    {
      title: "Ordered Qty",
      key: "ordered",
      align: "center",
      render: (_, item) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono">
          {item.quantity}
        </span>
      ),
    },
    {
      title: "Received Status",
      key: "received",
      render: (_, item) => {
        const recQty = item.receivedQuantity || 0;
        const isComplete = recQty >= item.quantity;
        const isPartial = recQty > 0;
        const pillBg = isComplete
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
          : isPartial
          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full font-mono ${pillBg}`}>
            {recQty} / {item.quantity}
          </span>
        );
      },
    },
    {
      title: "Unit Cost",
      key: "unitCost",
      align: "right",
      render: (_, item) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs font-mono">
          Rs {(item.unitCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Total Cost",
      key: "total",
      align: "right",
      render: (_, item) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono">
          Rs {(item.totalCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const statusStyle = PO_STATUS_STYLING[po.status] || PO_STATUS_STYLING.DRAFT;

  const canApprove =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPERADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "Manager" ||
    currentUser?.role === "OWNER" ||
    currentUser?.permissions?.includes("approve_po");

  const canDelete =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPERADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "Manager" ||
    currentUser?.role === "OWNER" ||
    currentUser?.permissions?.includes("delete_purchase_orders") ||
    currentUser?.permissions?.includes("create_purchase_orders");

  return (
    <PageContainer title={po.poNumber}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Purchase Order Details
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none font-mono">
                #{po.poNumber}
              </h2>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {po.status === "DRAFT" && (
              <>
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteDraftPO}
                    disabled={updating}
                    className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <IconTrash size={15} />
                    Delete Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("SUBMITTED")}
                  disabled={updating}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? <Spinner size="small" /> : <IconSend size={15} />}
                  Submit for Review
                </button>
              </>
            )}

            {po.status === "SUBMITTED" && canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={updating}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <IconX size={15} />
                  Reject Order
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("APPROVED")}
                  disabled={updating}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? <Spinner size="small" /> : <IconCheck size={15} />}
                  Approve Order
                </button>
              </>
            )}

            {po.status === "APPROVED" && (
              <Link to={`/inventory/grn/new?poId=${po.id}`}>
                <button
                  type="button"
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5"
                >
                  <IconPackage size={16} />
                  Receive Goods (GRN)
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Card 1: PO Details Responsive Metric Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              PO Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* 1. PO Number */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                PO Number
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                #{po.poNumber}
              </span>
            </div>

            {/* 2. Supplier */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Supplier
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                <IconBuildingStore size={15} className="text-slate-400 shrink-0" />
                {po.supplierName || "—"}
              </span>
            </div>

            {/* 3. Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Current Status
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {PO_STATUS_LABELS[po.status] || po.status}
                </span>
              </div>
            </div>

            {/* 4. Expected Date */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Expected Delivery
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate font-mono">
                <IconCalendar size={14} className="text-slate-400 shrink-0" />
                {formatOnlyDate(po.expectedDate)}
              </span>
            </div>

            {/* 5. Total Requisition Amount */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Total Amount
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono block truncate">
                Rs. {(po.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 6. Destination Location */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Destination Warehouse
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                <IconBuildingWarehouse size={14} className="text-slate-400 shrink-0" />
                {resolvedStockName}
              </span>
            </div>

            {/* 7. Created At */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Created At
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate font-mono">
                <IconCalendar size={14} className="text-slate-400 shrink-0" />
                {formatDate(po.createdAt as string)}
              </span>
            </div>

            {/* 8. Last Update */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Last Update
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate font-mono">
                <IconClock size={14} className="text-slate-400 shrink-0" />
                {formatDate(po.updatedAt as string)}
              </span>
            </div>

            {/* 9. Approved By & Approved Date */}
            {po.status === "APPROVED" && (
              <>
                <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex flex-col justify-between">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                    Approved By
                  </span>
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 truncate">
                    <IconUserCheck size={14} className="text-emerald-500 shrink-0" />
                    {po.approvedByName || po.approvedBy || "Manager"}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex flex-col justify-between">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                    Approved Date & Time
                  </span>
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 truncate font-mono">
                    <IconCalendar size={14} className="text-emerald-500 shrink-0" />
                    {formatDate(po.approvedAt as string)}
                  </span>
                </div>
              </>
            )}

            {/* 10. Rejected By & Rejected Date */}
            {po.status === "REJECTED" && (
              <>
                <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex flex-col justify-between">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                    Rejected By
                  </span>
                  <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 truncate">
                    <IconUserCheck size={14} className="text-rose-500 shrink-0" />
                    {po.rejectedByName || po.rejectedBy || "Manager"}
                  </span>
                </div>
                <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex flex-col justify-between">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                    Rejected Date & Time
                  </span>
                  <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 truncate font-mono">
                    <IconCalendar size={14} className="text-rose-500 shrink-0" />
                    {formatDate(po.rejectedAt as string)}
                  </span>
                </div>
              </>
            )}
          </div>

          {po.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Order Notes
              </span>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 border-dashed">
                <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed m-0">
                  "{po.notes}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Order Line Items Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Order Line Items ({po.items?.length || 0})
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              Total: Rs. {(po.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Table
            columns={columns}
            dataSource={po.items}
            rowKey={(r: any, idx?: number) =>
              r.productId + (r.variantId || "") + r.size + (idx || 0)
            }
            pagination={{
              pageSize: pageSize,
              onShowSizeChange: (_current, size) => setPageSize(size),
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              position: ["bottomRight"],
            }}
            size="middle"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewPurchaseOrderPage;
