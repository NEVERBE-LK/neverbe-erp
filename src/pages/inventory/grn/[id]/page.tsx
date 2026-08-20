import type { ColumnsType } from "antd/es/table";
import { Table } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  IconCheck,
  IconX,
  IconSend,
  IconBuildingStore,
  IconCalendar,
  IconUserCheck,
  IconFileText,
  IconReceipt,
  IconBuildingWarehouse,
  IconPigMoney,
  IconPackage,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

import { GRN_STATUS_LABELS, GRNStatus } from "@/model/GRN";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import Spinner from "@/pages/components/shared/Spinner";
import dayjs from "dayjs";

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

interface GRNItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  stockId: string;
}

interface GRN {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalAmount: number;
  notes?: string;
  receivedBy?: string;
  receivedDate: string;
  inventoryUpdated: boolean;
  status: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
}

const GRN_STATUS_STYLING: Record<
  string,
  { bg: string; text: string; dot: string; pulse?: boolean }
> = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
    dot: "bg-slate-400",
  },
  SUBMITTED: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
    dot: "bg-amber-500",
    pulse: true,
  },
  APPROVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
    pulse: true,
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
  return parsed.isValid() ? parsed.format("MMM DD, YYYY") : dateStr;
};

const ViewGRNPage = () => {
  const params = useParams();
  const grnId = params.id as string;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [grn, setGRN] = useState<GRN | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pageSize, setPageSize] = useState(5);

  const { showConfirmation } = useConfirmationDialog();
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  useEffect(() => {
    const fetchMasterProducts = async () => {
      try {
        const res = await api.get<Product[]>("/api/v1/erp/master/products/dropdown");
        setProducts(res.data || []);
      } catch (e) {
        console.error("Failed to fetch product master data", e);
      }
    };
    if (currentUser) fetchMasterProducts();
  }, [currentUser]);

  const fetchGRN = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<GRN>(`/api/v1/erp/inventory/grn/${grnId}`);
      setGRN(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch GRN");
    } finally {
      setLoading(false);
    }
  }, [grnId]);

  useEffect(() => {
    if (currentUser && grnId) fetchGRN();
  }, [currentUser, grnId, fetchGRN]);

  const handleUpdateStatus = (status: GRNStatus) => {
    const actionMap: Record<string, string> = {
      SUBMITTED: "Submit for Review",
      APPROVED: "Approve",
      REJECTED: grn?.status === "DRAFT" ? "Cancel" : "Reject",
    };

    const action = actionMap[status] || "Update Status";
    const isDestructive = status === "REJECTED";

    showConfirmation({
      title: `${action.toUpperCase()}?`,
      message: `Are you sure you want to ${action.toLowerCase()} this GRN?`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdating(true);
        try {
          const nowIso = new Date().toISOString();
          const payload: any = { status };
          const userName = currentUser?.username || currentUser?.email || "Manager";

          if (status === "APPROVED") {
            payload.approvedBy = currentUser?.userId || "";
            payload.approvedByName = userName;
            payload.approvedAt = nowIso;
          } else if (status === "REJECTED") {
            payload.rejectedBy = currentUser?.userId || "";
            payload.rejectedByName = userName;
            payload.rejectedAt = nowIso;
          }

          await api.patch(`/api/v1/erp/inventory/grn/${grnId}/status`, payload);
          if (status === "APPROVED" && grn?.purchaseOrderId) {
            try {
              await api.patch(`/api/v1/erp/procurement/purchase-orders/${grn.purchaseOrderId}`, {
                status: "COMPLETED",
                updatedAt: nowIso,
              });
            } catch (poErr) {
              console.error("Failed to update PO status to COMPLETED:", poErr);
            }
          }
          toast.success(`GRN ${action}ed successfully`);
          fetchGRN();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const totalReceivedItemsQty = useMemo(() => {
    if (!grn?.items) return 0;
    return grn.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  }, [grn]);

  const totalOrderedItemsQty = useMemo(() => {
    if (!grn?.items) return 0;
    return grn.items.reduce((sum, item) => sum + (item.orderedQuantity || 0), 0);
  }, [grn]);

  if (loading) {
    return (
      <PageContainer title="GRN Details">
        <div className="flex items-center justify-center py-24">
          <Spinner size="large" tip="LOADING GRN DETAILS..." />
        </div>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN Details">
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">
          GRN record not found.
        </div>
      </PageContainer>
    );
  }

  const statusStyle = GRN_STATUS_STYLING[grn.status] || GRN_STATUS_STYLING.DRAFT;

  const canApproveGRN =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPERADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "Manager" ||
    currentUser?.role === "OWNER" ||
    currentUser?.permissions?.includes("approve_grn");

  const columns: ColumnsType<GRNItem> = [
    {
      title: "Product Details",
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
      title: "Size / Spec",
      key: "size",
      render: (_, item) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
          {item.size || "STD"}
        </span>
      ),
    },
    {
      title: "Ordered Qty",
      key: "ordered",
      align: "center",
      render: (_, item) => (
        <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs font-mono">
          {item.orderedQuantity}
        </span>
      ),
    },
    {
      title: "Received Qty",
      key: "received",
      align: "center",
      render: (_, item) => {
        const isComplete = item.receivedQuantity >= item.orderedQuantity;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full font-mono ${
              isComplete
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
            }`}
          >
            {item.receivedQuantity}
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

  return (
    <PageContainer title={grn.grnNumber}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Goods Received Note
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none font-mono">
                #{grn.grnNumber}
              </h2>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {grn.status === "DRAFT" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={updating}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <IconX size={15} />
                  Cancel GRN
                </button>
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

            {grn.status === "SUBMITTED" && canApproveGRN && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={updating}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <IconX size={15} />
                  Reject GRN
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("APPROVED")}
                  disabled={updating}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? <Spinner size="small" /> : <IconCheck size={15} />}
                  Approve GRN
                </button>
              </>
            )}
          </div>
        </div>

        {/* GRN Metric Grid Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              GRN Overview & Reference
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. GRN Number */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                GRN Number
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                #{grn.grnNumber}
              </span>
            </div>

            {/* 2. PO Reference */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                PO Reference
              </span>
              {grn.purchaseOrderId ? (
                <Link
                  to={`/inventory/purchase-orders/${grn.purchaseOrderId}`}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline flex items-center gap-1.5 font-mono truncate"
                >
                  <IconFileText size={15} className="text-slate-400 shrink-0" />
                  #{grn.poNumber || grn.purchaseOrderId}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-slate-500 font-mono">
                  Direct GRN
                </span>
              )}
            </div>

            {/* 3. Supplier */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Supplier
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                <IconBuildingStore size={15} className="text-slate-400 shrink-0" />
                {grn.supplierName || "—"}
              </span>
            </div>

            {/* 4. Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Current Status
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${statusStyle.pulse ? "animate-pulse" : ""}`} />
                  {GRN_STATUS_LABELS[grn.status as GRNStatus] || grn.status}
                </span>
              </div>
            </div>

            {/* 5. Received Date */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Received Date
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                <IconCalendar size={15} className="text-slate-400 shrink-0" />
                {formatDate(grn.receivedDate)}
              </span>
            </div>

            {/* 6. Received By */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Received By
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                <IconUserCheck size={15} className="text-slate-400 shrink-0" />
                {grn.receivedBy || "System Store Manager"}
              </span>
            </div>

            {/* 7. Inventory Stock Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Stock Integration
              </span>
              <div>
                {grn.inventoryUpdated ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Stock Updated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending Stock Update
                  </span>
                )}
              </div>
            </div>

            {/* 8. Approved By / Reviewed By */}
            {(grn.approvedByName || grn.status === "APPROVED") && (
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Approved By
                </span>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 truncate">
                  <IconCheck size={15} className="text-emerald-500 shrink-0" />
                  {grn.approvedByName || "Authorized Manager"}
                </span>
              </div>
            )}

            {/* 9. Rejected By */}
            {(grn.rejectedByName || grn.status === "REJECTED") && (
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex flex-col justify-between">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                  Rejected By
                </span>
                <span className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 truncate">
                  <IconX size={15} className="text-rose-500 shrink-0" />
                  {grn.rejectedByName || "Store Manager"}
                </span>
              </div>
            )}

            {/* 10. Total Amount */}
            <div className="p-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl flex flex-col justify-between shadow-xs">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600 mb-1">
                Grand Total Amount
              </span>
              <span className="font-mono text-lg font-extrabold truncate block">
                Rs {(grn.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Received Items Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-0">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono flex items-center gap-2">
              <IconPackage size={15} className="text-slate-400" />
              Received Line Items ({grn.items?.length || 0})
            </span>
          </div>

          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              columns={columns}
              dataSource={grn.items}
              rowKey={(r: GRNItem) => r.productId + (r.variantId || "") + r.size}
              pagination={{
                pageSize,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                onShowSizeChange: (_, size) => setPageSize(size),
              }}
              size="small"
              className="ant-table-fluid"
            />
          </div>

          {/* Table Summary Footer */}
          <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Total Ordered Qty: <strong className="text-slate-800 dark:text-slate-200">{totalOrderedItemsQty}</strong></span>
              <span>Total Received Qty: <strong className="text-slate-800 dark:text-slate-200">{totalReceivedItemsQty}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Total Value:
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                Rs {(grn.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Reception Notes Card (if present) */}
        {grn.notes && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono block">
              Reception Notes & Comments
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 border-dashed">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic m-0">
                "{grn.notes}"
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ViewGRNPage;
