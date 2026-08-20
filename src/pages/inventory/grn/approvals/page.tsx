import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Space, Table, Dropdown, MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconEye,
  IconCheck,
  IconX,
  IconFileText,
  IconCalendar,
  IconDotsVertical,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import Spinner from "@/pages/components/shared/Spinner";

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  receivedDate: string;
  receivedBy?: string;
  status: string;
}

const GRNApprovalsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const res = await api.get<GRN[]>(
        "/api/v1/erp/inventory/grn",
        { params: { status: "SUBMITTED" } }
      );
      setGRNs(res.data);
    } catch {
      toast.error("Failed to fetch pending GRNs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchGRNs();
  }, [currentUser]);

  const handleUpdateStatus = (grnId: string, status: "APPROVED" | "REJECTED") => {
    const action = status === "APPROVED" ? "Approve" : "Reject";
    const isDestructive = status === "REJECTED";

    showConfirmation({
      title: `${action.toUpperCase()} GRN?`,
      message: `Are you sure you want to ${action.toLowerCase()} this GRN?`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdatingId(grnId);
        try {
          const targetGrn = grns.find((g) => g.id === grnId);
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
          if (status === "APPROVED" && targetGrn) {
            const poId = (targetGrn as any).purchaseOrderId || (targetGrn as any).poId;
            if (poId) {
              try {
                await api.patch(`/api/v1/erp/procurement/purchase-orders/${poId}`, {
                  status: "COMPLETED",
                  updatedAt: nowIso,
                });
              } catch (poErr) {
                console.error("Failed to update PO status to COMPLETED:", poErr);
              }
            }
          }
          toast.success(`GRN ${action}ed successfully`);
          fetchGRNs();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const columns: ColumnsType<GRN> = [
    {
      title: "GRN Number",
      key: "grnNumber",
      render: (_, grn) => (
        <Space>
          <IconFileText size={16} className="text-slate-400" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
            {grn.grnNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "PO Number",
      key: "poNumber",
      render: (_, grn) => (
        <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
          {grn.poNumber}
        </span>
      ),
    },
    {
      title: "Supplier",
      key: "supplierName",
      render: (_, grn) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          {grn.supplierName}
        </span>
      ),
    },
    {
      title: "Amount",
      key: "totalAmount",
      render: (_, grn) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Rs {grn.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Received Date",
      align: "right",
      key: "receivedDate",
      render: (_, grn) => (
        <Space className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <IconCalendar size={14} className="text-slate-400" />
          <span>{grn.receivedDate}</span>
        </Space>
      ),
    },
    {
      title: "Actions",
      align: "right",
      key: "action",
      render: (_, grn) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View Details",
            onClick: () => navigate(`/inventory/grn/${grn.id}`),
          },
          {
            key: "approve",
            icon: <IconCheck size={14} className="text-emerald-500" />,
            label: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Approve GRN</span>,
            onClick: () => handleUpdateStatus(grn.id, "APPROVED"),
          },
          {
            key: "reject",
            icon: <IconX size={14} className="text-rose-500" />,
            label: <span className="text-rose-600 dark:text-rose-400 font-semibold">Reject GRN</span>,
            onClick: () => handleUpdateStatus(grn.id, "REJECTED"),
          },
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const totalValue = useMemo(() => {
    return grns.reduce((sum, g) => sum + (g.totalAmount || 0), 0);
  }, [grns]);

  return (
    <PageContainer title="GRN Approvals">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono">
                Inventory Control
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  GRN Approvals
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                  {grns.length} pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Spinner spinning={loading}>
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 1000 }}
              columns={columns}
              dataSource={grns}
              rowKey="id"
              pagination={{ pageSize: 15, position: ["bottomRight"] }}
              size="middle"
              className="rounded-2xl overflow-hidden ant-table-fluid"
              locale={{
                emptyText: (
                  <div className="py-12 flex flex-col items-center justify-center text-text-sub dark:text-slate-500 font-medium">
                    <IconCheck size={40} className="text-emerald-500 mb-2" />
                    <span>No Goods Received Notes pending approval</span>
                  </div>
                )
              }}
            />
          </div>
        </Spinner>
      </div>
    </PageContainer>
  );
};

export default GRNApprovalsPage;

