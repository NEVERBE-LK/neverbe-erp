import type { ColumnsType } from "antd/es/table";
import { Table, Descriptions, Button } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { IconCheck, IconX, IconSend } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

import { GRN_STATUS_LABELS, GRNStatus } from "@/model/GRN";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import Spinner from "@/pages/components/shared/Spinner";

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
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
        dot: "bg-emerald-500",
        pulse: true,
      };
    case "SUBMITTED":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
        dot: "bg-amber-500",
        pulse: true,
      };
    case "REJECTED":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
        dot: "bg-rose-500",
        pulse: true,
      };
    case "DRAFT":
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
        pulse: false,
      };
  }
};

const ViewGRNPage = () => {
  const params = useParams();
  const grnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [grn, setGRN] = useState<GRN | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

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
          await api.patch(`/api/v1/erp/inventory/grn/${grnId}/status`, { status });
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

  if (loading) {
    return (
      <PageContainer title="GRN">
        <div className="flex justify-center py-20">
          <Spinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN">
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">GRN not found</div>
      </PageContainer>
    );
  }

  const statusStyle = getStatusStyle(grn.status);

  const columns: ColumnsType<GRNItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
          {item.productName}
        </span>
      ),
    },
    {
      title: "Size",
      key: "size",
      render: (_, item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {item.size}
        </span>
      ),
    },
    {
      title: "Ordered",
      key: "ordered",
      align: "right",
      render: (_, item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {item.orderedQuantity}
        </span>
      ),
    },
    {
      title: "Received",
      key: "received",
      align: "right",
      render: (_, item) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          {item.receivedQuantity}
        </span>
      ),
    },
    {
      title: "Unit Cost",
      key: "unitCost",
      align: "right",
      render: (_, item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Rs {item.unitCost}
        </span>
      ),
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_, item) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          Rs {item.totalCost.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title={grn.grnNumber}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Goods Received Note Overview
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none font-mono">
                #{grn.grnNumber}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {grn.inventoryUpdated && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Inventory Updated
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${statusStyle.pulse ? "animate-pulse" : ""}`} />
              <span>{GRN_STATUS_LABELS[grn.status as GRNStatus] || grn.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                  Received Items ({grn.items?.length || 0})
                </span>
              </div>
              <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5">
                <Table
                  columns={columns}
                  dataSource={grn.items}
                  rowKey={(r: GRNItem) =>
                    r.productId + (r.variantId || "") + r.size
                  }
                  pagination={false}
                  size="small"
                  className="ant-table-fluid"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-dashed">
              {grn.status === "DRAFT" && (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateStatus("SUBMITTED")}
                    disabled={updating}
                    icon={!updating && <IconSend size={16} />}
                    className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-10 px-6 shadow-xs cursor-pointer transition-all border-none flex items-center justify-center gap-2"
                  >
                    {updating ? <Spinner size="small" /> : "Submit for Review"}
                  </Button>
                  <Button
                    danger
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updating}
                    icon={<IconX size={16} />}
                    className="rounded-xl h-10 px-6 font-semibold text-xs border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2"
                  >
                    Cancel GRN
                  </Button>
                </>
              )}

              {grn.status === "SUBMITTED" && currentUser?.permissions?.includes("approve_grn") && (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateStatus("APPROVED")}
                    disabled={updating}
                    icon={!updating && <IconCheck size={16} />}
                    className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-10 px-6 shadow-xs cursor-pointer transition-all border-none flex items-center justify-center gap-2"
                  >
                    {updating ? <Spinner size="small" /> : "Approve GRN"}
                  </Button>
                  <Button
                    danger
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updating}
                    icon={<IconX size={16} />}
                    className="rounded-xl h-10 px-6 font-semibold text-xs border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2"
                  >
                    Reject GRN
                  </Button>
                </>
              )}

              {(grn.status === "APPROVED" || grn.status === "COMPLETED") && (
                <div className="flex items-center text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-widest font-mono bg-emerald-50 dark:bg-emerald-950/40 px-6 py-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                  GRN Approved & Processed
                </div>
              )}

              {grn.status === "REJECTED" && (
                <div className="flex items-center text-rose-700 dark:text-rose-400 font-semibold text-xs uppercase tracking-widest font-mono bg-rose-50 dark:bg-rose-950/40 px-6 py-2.5 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-2" />
                  GRN Rejected
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Insight */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                  GRN Insight
                </span>
              </div>
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{
                  fontWeight: 600,
                  background: "transparent",
                  width: "140px",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#64748b",
                }}
                contentStyle={{
                  background: "transparent",
                }}
              >
                <Descriptions.Item label="Supplier">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {grn.supplierName}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="PO Number">
                  <Link
                    to={`/inventory/purchase-orders/${grn.purchaseOrderId}`}
                    className="!text-slate-900 dark:!text-slate-100 hover:underline font-mono font-bold text-xs"
                  >
                    #{grn.poNumber}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="Received By">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {(grn.receivedBy || "S").charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {grn.receivedBy || "System Admin"}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Received Date">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-mono">
                    {grn.receivedDate}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Total Value">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Rs {grn.totalAmount.toLocaleString()}
                  </span>
                </Descriptions.Item>
                {grn.notes && (
                  <Descriptions.Item label="Reception Notes">
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 border-dashed">
                      <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{grn.notes}"
                      </span>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewGRNPage;

