import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconEye,
  IconCheck,
  IconX,
  IconFileText,
  IconCalendar,
  IconUser,
  IconPigMoney,
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
          await api.patch(`/api/v1/erp/inventory/grn/${grnId}/status`, { status });
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
      render: (_, grn) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/inventory/grn/${grn.id}`}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            title="View Details"
          >
            <IconEye size={18} />
          </Link>
          <Button
            type="primary"
            onClick={() => handleUpdateStatus(grn.id, "APPROVED")}
            disabled={updatingId !== null}
            icon={<IconCheck size={16} />}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-9 px-4 shadow-xs cursor-pointer transition-all border-none flex items-center gap-1.5"
          >
            Approve
          </Button>
          <Button
            danger
            onClick={() => handleUpdateStatus(grn.id, "REJECTED")}
            disabled={updatingId !== null}
            icon={<IconX size={16} />}
            className="rounded-xl h-9 px-4 font-semibold text-xs border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const totalValue = useMemo(() => {
    return grns.reduce((sum, g) => sum + (g.totalAmount || 0), 0);
  }, [grns]);

  return (
    <PageContainer title="GRN Approvals">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Inventory Control
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  GRN Approvals
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {grns.length} pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 font-mono">
                  Pending Approvals
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {grns.length}
                </div>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <IconUser size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 font-mono">
                  Total Value Pending
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  Rs {totalValue.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <IconPigMoney size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Spinner spinning={loading}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 1000 }}
              bordered={false}
              columns={columns}
              dataSource={grns}
              rowKey="id"
              pagination={{ pageSize: 15, position: ["bottomRight"] }}
              size="middle"
              className="rounded-2xl overflow-hidden ant-table-fluid"
              locale={{
                emptyText: (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
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

