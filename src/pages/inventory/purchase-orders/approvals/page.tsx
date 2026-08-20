import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Space, Table, Dropdown, MenuProps } from "antd";
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
import Spinner from "@/pages/components/shared/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedDate?: string;
  createdAt: string;
}

const POApprovalsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseOrder[]>(
        "/api/v1/erp/procurement/purchase-orders",
        { params: { status: "SUBMITTED" } }
      );
      setOrders(res.data);
    } catch {
      toast.error("Failed to fetch pending purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [currentUser]);

  const canApprove = useMemo(() => {
    if (!currentUser) return false;
    const role = String(currentUser.role || "").toUpperCase();
    if (
      role === "ADMIN" ||
      role === "SUPERADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "MANAGER" ||
      role === "OWNER"
    ) {
      return true;
    }
    return (
      Array.isArray(currentUser.permissions) &&
      (currentUser.permissions.includes("approve_po") ||
        currentUser.permissions.includes("all") ||
        currentUser.permissions.includes("*"))
    );
  }, [currentUser]);

  const handleUpdateStatus = (poId: string, status: "APPROVED" | "REJECTED") => {
    const action = status === "APPROVED" ? "Approve" : "Reject";
    const isDestructive = status === "REJECTED";

    showConfirmation({
      title: `${action.toUpperCase()} ORDER?`,
      message: `Are you sure you want to ${action.toLowerCase()} this purchase order?`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdatingId(poId);
        try {
          const nowIso = new Date().toISOString();
          const payload: any = { status, updatedAt: nowIso };

          if (status === "APPROVED") {
            payload.approvedBy = currentUser?.userId || "";
            payload.approvedByName = currentUser?.username || currentUser?.email || "Manager";
            payload.approvedAt = nowIso;
          } else if (status === "REJECTED") {
            payload.rejectedBy = currentUser?.userId || "";
            payload.rejectedByName = currentUser?.username || currentUser?.email || "Manager";
            payload.rejectedAt = nowIso;
          }

          await api.patch(`/api/v1/erp/procurement/purchase-orders/${poId}`, payload);
          toast.success(`Order ${action}ed successfully`);
          fetchOrders();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "PO Number",
      key: "poNumber",
      render: (_, po) => (
        <Space>
          <IconFileText size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            {po.poNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "Supplier",
      key: "supplierName",
      render: (_, po) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
          {po.supplierName}
        </span>
      ),
    },
    {
      title: "Amount",
      align: "right",
      key: "totalAmount",
      render: (_, po) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Rs {po.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Expected Date",
      align: "right",
      key: "expectedDate",
      render: (_, po) => (
        <Space className="text-slate-500 dark:text-slate-400 text-xs font-bold">
          <IconCalendar size={14} className="text-slate-400" />
          <span>{po.expectedDate || "-"}</span>
        </Space>
      ),
    },
    {
      title: "Actions",
      align: "right",
      key: "action",
      render: (_, po) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View PO Details",
            onClick: () => navigate(`/inventory/purchase-orders/${po.id}`),
          },
        ];

        if (canApprove) {
          items.push({
            key: "approve",
            icon: <IconCheck size={14} className="text-emerald-500" />,
            label: <span className="text-emerald-600 font-semibold">Approve Order</span>,
            onClick: () => handleUpdateStatus(po.id, "APPROVED"),
          });
          items.push({
            key: "reject",
            icon: <IconX size={14} className="text-rose-500" />,
            label: <span className="text-rose-600 font-semibold">Reject Order</span>,
            onClick: () => handleUpdateStatus(po.id, "REJECTED"),
          });
        }

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
    return orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  return (
    <PageContainer title="Purchase Order Approvals">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Procurement
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  PO Approvals
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {orders.length} pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <Table
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={orders}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            rowKey="id"
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            size="middle"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
            locale={{
              emptyText: (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 font-medium font-mono">
                  <IconCheck size={40} className="text-emerald-500 mb-2" />
                  <span>No purchase orders pending approval</span>
                </div>
              )
            }}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default POApprovalsPage;

