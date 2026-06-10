import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Space, Table, Spin, Typography } from "antd";
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
          await api.patch(`/api/v1/erp/procurement/purchase-orders/${poId}/status`, { status });
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
          <IconFileText size={16} className="text-gray-400" />
          <span className="font-mono font-bold text-gray-900 text-sm tracking-wide">
            {po.poNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "Supplier",
      key: "supplierName",
      render: (_, po) => (
        <span className="font-semibold text-gray-700 text-sm">
          {po.supplierName}
        </span>
      ),
    },
    {
      title: "Amount",
      align: "right",
      key: "totalAmount",
      render: (_, po) => (
        <span className="font-bold text-gray-900">
          Rs {po.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Expected Date",
      align: "right",
      key: "expectedDate",
      render: (_, po) => (
        <Space className="text-gray-500 text-xs font-bold">
          <IconCalendar size={14} className="text-gray-400" />
          <span>{po.expectedDate || "-"}</span>
        </Space>
      ),
    },
    {
      title: "Actions",
      align: "right",
      key: "action",
      render: (_, po) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/inventory/purchase-orders/${po.id}`}
            className="p-2 hover:bg-gray-100 inline-flex rounded-xl transition-colors text-gray-500 hover:text-black"
            title="View Details"
          >
            <IconEye size={18} />
          </Link>
          <Button
            type="primary"
            onClick={() => handleUpdateStatus(po.id, "APPROVED")}
            disabled={updatingId !== null}
            icon={<IconCheck size={16} />}
            className="bg-green-600 hover:bg-green-700 border-none rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
          >
            Approve
          </Button>
          <Button
            danger
            onClick={() => handleUpdateStatus(po.id, "REJECTED")}
            disabled={updatingId !== null}
            icon={<IconX size={16} />}
            className="rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const totalValue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  return (
    <PageContainer title="Purchase Order Approvals">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-amber-500 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Procurement
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">
                PO Approvals
              </h2>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Pending Approvals
                </Typography.Text>
                <div className="text-3xl font-black text-slate-800 mt-1">
                  {orders.length}
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <IconUser size={24} />
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Total Value Pending
                </Typography.Text>
                <div className="text-2xl font-black text-slate-800 mt-1 truncate">
                  Rs {totalValue.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <IconPigMoney size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={columns}
            dataSource={orders}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
            locale={{
              emptyText: (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 font-medium">
                  <IconCheck size={40} className="text-green-500 mb-2" />
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
