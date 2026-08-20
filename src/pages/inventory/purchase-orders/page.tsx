import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, Select, Dropdown, MenuProps, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconFileText,
  IconCalendar,
  IconBuildingStore,
  IconDotsVertical,
  IconCheck,
  IconTrash,
  IconPackage,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { PO_STATUS_LABELS, PurchaseOrderStatus } from "@/model/PurchaseOrder";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import dayjs from "dayjs";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDate?: string;
  createdAt: string;
}

const PO_STATUS_STYLING: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; dot: string }
> = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
    dot: "bg-slate-400",
  },
  SUBMITTED: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
    dot: "bg-amber-500 animate-pulse",
  },
  APPROVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
    dot: "bg-emerald-500 animate-pulse",
  },
  REJECTED: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40",
    dot: "bg-rose-500",
  },
  COMPLETED: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40",
    dot: "bg-indigo-500 animate-pulse",
  },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format("MMM DD, YYYY") : "—";
};

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pageSize, setPageSize] = useState(15);
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: any) => {
    setSearch(values.search || "");
    setStatusFilter(values.status || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
    setStatusFilter("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const canCreate = useMemo(() => {
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
    if (Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0) {
      return (
        currentUser.permissions.includes("create_purchase_orders") ||
        currentUser.permissions.includes("all") ||
        currentUser.permissions.includes("*")
      );
    }
    return true;
  }, [currentUser]);

  const canApprovePO = useMemo(() => {
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

  const canDeletePO = useMemo(() => {
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
      (currentUser.permissions.includes("delete_purchase_orders") ||
        currentUser.permissions.includes("create_purchase_orders") ||
        currentUser.permissions.includes("all") ||
        currentUser.permissions.includes("*"))
    );
  }, [currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<PurchaseOrder[]>(
        "/api/v1/erp/procurement/purchase-orders",
        { params },
      );
      setOrders(res.data || []);
    } catch {
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [currentUser, statusFilter]);

  const handleStatusChange = (record: PurchaseOrder, newStatus: PurchaseOrderStatus) => {
    const actionLabel = newStatus === "APPROVED" ? "Approve" : "Reject";
    showConfirmation({
      title: `${actionLabel.toUpperCase()} PURCHASE ORDER?`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} purchase order #${record.poNumber}?`,
      variant: newStatus === "REJECTED" ? "danger" : "default",
      onSuccess: async () => {
        try {
          const nowIso = new Date().toISOString();
          const payload: any = { status: newStatus, updatedAt: nowIso };

          if (newStatus === "APPROVED") {
            payload.approvedBy = currentUser?.userId || "";
            payload.approvedByName = currentUser?.username || currentUser?.email || "Manager";
            payload.approvedAt = nowIso;
          } else if (newStatus === "REJECTED") {
            payload.rejectedBy = currentUser?.userId || "";
            payload.rejectedByName = currentUser?.username || currentUser?.email || "Manager";
            payload.rejectedAt = nowIso;
          }

          await api.patch(`/api/v1/erp/procurement/purchase-orders/${record.id}`, payload);
          toast.success(`Purchase Order ${actionLabel.toLowerCase()}d successfully`);
          fetchOrders();
        } catch (e: any) {
          console.error(e);
          toast.error(e.response?.data?.message || `Failed to ${actionLabel.toLowerCase()} order`);
        }
      },
    });
  };

  const handleDeleteDraftPO = (record: PurchaseOrder) => {
    showConfirmation({
      title: "DELETE DRAFT PURCHASE ORDER?",
      message: `Are you sure you want to delete draft purchase order #${record.poNumber}? This action cannot be undone.`,
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/procurement/purchase-orders/${record.id}`);
          toast.success("Draft purchase order deleted successfully");
          fetchOrders();
        } catch (e: any) {
          console.error(e);
          toast.error(e.response?.data?.message || "Failed to delete draft order");
        }
      },
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        (o.supplierName &&
          o.supplierName.toLowerCase().includes(search.toLowerCase())),
    );
  }, [orders, search]);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "PO Number",
      dataIndex: "poNumber",
      key: "poNumber",
      render: (poNumber: string) => (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          <IconFileText size={14} className="text-slate-400 shrink-0" />
          <span>#{poNumber}</span>
        </span>
      ),
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      render: (name: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
          <IconBuildingStore size={14} className="text-slate-400 shrink-0" />
          <span>{name || "—"}</span>
        </span>
      ),
    },
    {
      title: "Expected Date",
      dataIndex: "expectedDate",
      key: "expectedDate",
      render: (date?: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
          <IconCalendar size={14} className="text-slate-400 shrink-0" />
          <span>{formatDate(date)}</span>
        </span>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
          Rs. {(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: PurchaseOrderStatus) => {
        const style = PO_STATUS_STYLING[status] || PO_STATUS_STYLING.DRAFT;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${style.bg} ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {PO_STATUS_LABELS[status] || status}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View PO Details",
            onClick: () => navigate(`/inventory/purchase-orders/${record.id}`),
          },
        ];

        if (record.status === "APPROVED") {
          items.push({
            key: "grn",
            icon: <IconPackage size={14} className="text-emerald-500" />,
            label: (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Receive Goods (GRN)
              </span>
            ),
            onClick: () => navigate(`/inventory/grn/create?poId=${record.id}`),
          });
        }

        if (record.status === "DRAFT" && canDeletePO) {
          items.push({
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-500" />,
            label: (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Delete Draft
              </span>
            ),
            onClick: () => handleDeleteDraftPO(record),
          });
        }

        return (
          <div className="flex items-center justify-end">
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

  return (
    <PageContainer title="Purchase Orders">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-card-border dark:border-card-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono">
                Procurement
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Purchase Orders
                </h2>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {filteredOrders.length} Total
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canApprovePO && (
              <Button
                onClick={() => navigate("/inventory/purchase-orders/approvals")}
                icon={<IconCheck size={16} />}
                className="rounded-xl h-10 font-bold text-xs border-card-border dark:border-card-border-dark bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-text-main dark:text-slate-200 cursor-pointer flex items-center gap-2"
              >
                PO Approvals
              </Button>
            )}
            {canCreate && (
              <Button
                type="primary"
                icon={<IconPlus size={16} />}
                onClick={() => navigate("/inventory/purchase-orders/create")}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl px-5 py-2.5 shadow-xs cursor-pointer transition-all h-10 border-none flex items-center gap-2"
              >
                New Order
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", status: undefined }}
            className="w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-slate-400" />}
                  placeholder="Search PO Number or Supplier..."
                  allowClear
                  className="rounded-xl w-full"
                />
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select
                  placeholder="All Status"
                  allowClear
                  className="rounded-xl w-full"
                  options={[
                    { value: "", label: "All Status" },
                    ...Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              </Form.Item>
              <Form.Item className="!mb-0">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer border-none"
                  >
                    <IconFilter size={15} />
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all cursor-pointer bg-transparent"
                  >
                    <IconX size={15} />
                    Clear
                  </button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <Table
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={filteredOrders}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            rowKey="id"
            pagination={{
              pageSize: pageSize,
              onShowSizeChange: (_current, size) => setPageSize(size),
              showSizeChanger: true,
              pageSizeOptions: ["10", "15", "25", "50", "100"],
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

export default PurchaseOrdersPage;
