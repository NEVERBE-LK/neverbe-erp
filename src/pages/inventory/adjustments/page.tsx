import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Select, Table, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconRotateDot,
  IconArrowsExchange,
  IconFileText,
  IconUser,
  IconCalendar,
  IconDotsVertical,
  IconChecklist,
  IconTrash,
} from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";
import NewAdjustmentModal from "./components/NewAdjustmentModal";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  reason: string;
  items: { productName: string; quantity: number }[];
  status: AdjustmentStatus;
  createdAt: string;
  adjustedByName?: string;
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

const TYPE_ICONS: Record<AdjustmentType, React.ReactNode> = {
  add: <IconTrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />,
  remove: <IconTrendingDown size={14} className="text-rose-600 dark:text-rose-400" />,
  damage: <IconAlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />,
  return: <IconRotateDot size={14} className="text-blue-600 dark:text-blue-400" />,
  transfer: <IconArrowsExchange size={14} className="text-purple-600 dark:text-purple-400" />,
};

const renderStatusPill = (status: any) => {
  const normStatus = (String(status || "").toUpperCase() as AdjustmentStatus) || "DRAFT";
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

  const c = config[normStatus] || config.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg}`}
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
        return dayjs(seconds * 1000).format("YYYY-MM-DD HH:mm");
      }
    }
    if (typeof date === "number") {
      const ms = date < 10000000000 ? date * 1000 : date;
      return dayjs(ms).format("YYYY-MM-DD HH:mm");
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
    return d.format("YYYY-MM-DD HH:mm");
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

const AdjustmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { showConfirmation } = useConfirmationDialog();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const canApprove = canApproveAdjustment(currentUser);

  const fetchAdjustments = useCallback(
    async (values?: any) => {
      setLoading(true);
      try {
        const filters = values || form.getFieldsValue();
        const params: Record<string, any> = {
          page: pagination.current,
          size: pagination.pageSize,
        };

        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;

        const res = await api.get<{ dataList: Adjustment[]; rowCount: number }>(
          "/api/v1/erp/inventory/adjustments",
          { params },
        );
        setAdjustments(res.data.dataList || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.rowCount || 0,
        }));
      } catch {
        toast.error("Failed to fetch adjustments");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, form],
  );

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, fetchAdjustments]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchAdjustments(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  const handleDelete = (id: string, adjNumber: string) => {
    showConfirmation({
      title: "Delete Draft Adjustment?",
      message: `Are you sure you want to delete draft adjustment #${adjNumber}? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/inventory/adjustments/${id}`);
          toast.success("Draft adjustment deleted");
          fetchAdjustments();
        } catch (error) {
          console.error(error);
          toast.error("Failed to delete draft adjustment");
        }
      },
    });
  };

  const columns: ColumnsType<Adjustment> = [
    {
      title: "Adjustment #",
      key: "adjustment",
      render: (_, adj) => (
        <div className="flex items-center gap-2">
          <IconFileText size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
            {adj.adjustmentNumber}
          </span>
        </div>
      ),
    },
    {
      title: "Date",
      key: "date",
      render: (_, adj: any) => {
        const rawDate =
          adj.createdAt || adj.created_at || adj.date || adj.updatedAt || adj.updated_at;
        return (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-mono">
            <IconCalendar size={14} className="text-slate-400 dark:text-slate-500" />
            <span>{formatDate(rawDate, adj.adjustmentNumber)}</span>
          </div>
        );
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_, adj) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
            TYPE_COLORS[adj.type] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          {TYPE_ICONS[adj.type]}
          <span>{TYPE_LABELS[adj.type] || adj.type}</span>
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, adj) => renderStatusPill(adj.status),
    },
    {
      title: "Reason",
      key: "reason",
      render: (_, adj) => (
        <span className="text-slate-700 dark:text-slate-300 text-xs truncate max-w-[200px] block">
          {adj.reason}
        </span>
      ),
    },
    {
      title: "Adjusted By",
      key: "adjustedBy",
      render: (_, adj) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
          <IconUser size={14} className="text-slate-400 dark:text-slate-500" />
          <span>{adj.adjustedByName || "-"}</span>
        </div>
      ),
    },
    {
      title: "Items",
      key: "items",
      render: (_, adj) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40">
          {adj.items?.length || 0} items
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, adj) => {
        const normStatus = String(adj.status || "").toUpperCase();
        const isPending = normStatus === "SUBMITTED";
        const isDraft =
          !adj.status ||
          normStatus === "DRAFT" ||
          normStatus === "" ||
          normStatus === "UNDEFINED";

        const adjId = adj.id || (adj as any)._id;

        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: isPending ? "Review & Approve" : "View Details",
            onClick: () => navigate(`/inventory/adjustments/${adjId}`),
          },
        ];

        if (isDraft) {
          items.push({
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-500" />,
            label: <span className="text-rose-600 font-semibold">Delete Draft</span>,
            onClick: () => handleDelete(adjId, adj.adjustmentNumber),
          });
        }

        return (
          <div className="flex items-center justify-end gap-2">
            {isPending && canApprove && (
              <button
                type="button"
                onClick={() => navigate(`/inventory/adjustments/${adjId}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer border-none"
              >
                <IconChecklist size={14} />
                Review
              </button>
            )}

            {isDraft && (
              <button
                type="button"
                onClick={() => handleDelete(adjId, adj.adjustmentNumber)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold cursor-pointer transition-colors"
                title="Delete Draft"
              >
                <IconTrash size={14} />
                <span>Delete</span>
              </button>
            )}

            <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent">
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Inventory Adjustments">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Inventory Control
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Inventory Adjustments
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {pagination.total} items
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start md:self-auto"
          >
            <IconPlus size={16} />
            New Adjustment
          </button>
        </div>

        <NewAdjustmentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAdjustments();
          }}
        />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", type: "" }}
            className="w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <Form.Item name="search" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Search</span>} className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-slate-400" />}
                  placeholder="Search by ID or reason..."
                  allowClear
                  className="rounded-xl h-10 w-full"
                />
              </Form.Item>
              <Form.Item name="type" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type</span>} className="!mb-0">
                <Select
                  className="h-10 rounded-xl w-full"
                  placeholder="Select Type"
                >
                  <Select.Option value="">All Types</Select.Option>
                  <Select.Option value="add">Stock Addition</Select.Option>
                  <Select.Option value="remove">Stock Removal</Select.Option>
                  <Select.Option value="damage">Damaged Goods</Select.Option>
                  <Select.Option value="return">Customer Return</Select.Option>
                  <Select.Option value="transfer">Stock Transfer</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</span>} className="!mb-0">
                <Select
                  className="h-10 rounded-xl w-full"
                  placeholder="Select Status"
                >
                  <Select.Option value="">All Status</Select.Option>
                  {Object.entries(ADJUSTMENT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <Select.Option key={value} value={value}>
                        {label}
                      </Select.Option>
                    ),
                  )}
                </Select>
              </Form.Item>
              <Form.Item className="!mb-0">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2.5 shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all flex-1 h-10"
                  >
                    <IconFilter size={15} />
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-4 py-2.5 font-semibold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 flex-1 h-10"
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
            dataSource={adjustments}
            loading={{ spinning: loading, indicator: <Spinner size="medium" /> }}
            rowKey={(r: Adjustment) => r.id}
            pagination={{ ...pagination, position: ["bottomRight"] }}
            onChange={handleTableChange}
            size="middle"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:dark:!text-slate-400 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default AdjustmentsPage;

