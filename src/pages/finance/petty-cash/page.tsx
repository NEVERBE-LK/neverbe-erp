import type { ColumnsType } from "antd/es/table";
import {
  Table,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  Dropdown,
} from "antd";
import type { MenuProps, TablePaginationConfig } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconEye,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFilter,
  IconX,
  IconSearch,
  IconDotsVertical,
  IconCheck,
  IconBan,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import PettyCashFormModal from "./components/PettyCashFormModal";
import PettyCashViewModal from "./components/PettyCashViewModal";
import PageContainer from "../../components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";

const { RangePicker } = DatePicker;

export default function PettyCashList() {
  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PettyCash | null>(null);

  const [form] = Form.useForm();

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
    fromDate: "",
    toDate: "",
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    if (currentUser) fetchPettyCash();
  }, [pagination.current, pagination.pageSize, currentUser, appliedFilters]);

  const fetchPettyCash = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/erp/finance/petty-cash?page=${pagination.current}&size=${pagination.pageSize}`;

      if (appliedFilters.search)
        url += `&search=${encodeURIComponent(appliedFilters.search)}`;
      if (appliedFilters.status !== "ALL")
        url += `&status=${appliedFilters.status}`;
      if (appliedFilters.type !== "ALL") url += `&type=${appliedFilters.type}`;
      if (appliedFilters.category !== "ALL")
        url += `&category=${encodeURIComponent(appliedFilters.category)}`;
      if (appliedFilters.fromDate)
        url += `&fromDate=${appliedFilters.fromDate}`;
      if (appliedFilters.toDate) url += `&toDate=${appliedFilters.toDate}`;

      const { data } = await api.get(url);

      setPettyCashList(Array.isArray(data) ? data : data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: Array.isArray(data) ? data.length : data.total || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch petty cash list", error);
      toast.error("Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (values: Record<string, any>) => {
    let fromDate = "";
    let toDate = "";
    if (values.dateRange && values.dateRange.length === 2) {
      fromDate = values.dateRange[0].format("YYYY-MM-DD");
      toDate = values.dateRange[1].format("YYYY-MM-DD");
    }

    setAppliedFilters({
      search: values.search || "",
      status: values.status || "ALL",
      type: values.type || "ALL",
      category: values.category || "ALL",
      fromDate,
      toDate,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearFilters = () => {
    form.resetFields();
    setAppliedFilters({
      search: "",
      status: "ALL",
      type: "ALL",
      category: "ALL",
      fromDate: "",
      toDate: "",
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (p: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: p.current || 1,
      pageSize: p.pageSize || 10,
    }));
  };

  const handleQuickStatusUpdate = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify({ status: newStatus }));
      await api.put(`/api/v1/erp/finance/petty-cash/${id}`, fd);
      toast.success(`VOUCHER ${newStatus}`);
      fetchPettyCash();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE PETTY CASH VOUCHER?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          await api.delete(`/api/v1/erp/finance/petty-cash/${id}`);
          toast.success("VOUCHER DELETED");
          fetchPettyCash();
        } catch (error) {
          console.error("Failed to delete entry", error);
          toast.error("Failed to delete entry");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleOpenCreate = () => {
    setSelectedEntry(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setFormModalOpen(true);
  };

  const handleOpenView = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setSelectedEntry(null);
  };



  const renderStatus = (status: string) => {
    const st = status?.toUpperCase();
    switch (st) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            APPROVED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            PENDING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
            {status || "UNKNOWN"}
          </span>
        );
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Voucher / Details",
      key: "details",
      render: (_, entry) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-xs text-text-main dark:text-text-main-dark">
              {entry.voucherNo || `PCV-${entry.id?.slice(-6).toUpperCase()}`}
            </span>
            {entry.payee && (
              <span className="text-[10px] font-semibold text-text-sub bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                Payee: {entry.payee}
              </span>
            )}
          </div>
          <span className="text-xs text-text-sub line-clamp-1">
            {entry.note || "No notes provided"}
          </span>
          <span className="text-[10px] text-text-sub dark:text-slate-500 font-mono">
            Date: {entry.date}
          </span>
        </div>
      ),
    },
    {
      title: "Amount (Rs)",
      key: "amount",
      align: "right",
      render: (_, entry) => (
        <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              entry.type === "income" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <span className="font-bold text-text-main dark:text-text-main-dark">
            {entry.type === "income" ? "+" : "-"} Rs {Number(entry.amount).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: "Category / Method",
      key: "category",
      render: (_, entry) => (
        <div className="flex flex-col gap-1 font-mono">
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 dark:bg-slate-800 text-text-sub w-fit">
            {entry.category?.toUpperCase() || "UNCATEGORIZED"}
          </span>
          <span className="text-[9px] text-text-sub uppercase font-semibold">
            {entry.paymentMethod || "CASH"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, entry) => renderStatus(entry.status),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right",
      render: (_, entry) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View Voucher",
            onClick: () => handleOpenView(entry),
          },
          {
            key: "edit",
            icon: <IconPencil size={14} />,
            label: "Edit Voucher",
            disabled: entry.status === "APPROVED",
            onClick: () => handleOpenEdit(entry),
          },
          ...(entry.status === "PENDING"
            ? [
                {
                  type: "divider" as const,
                },
                {
                  key: "approve",
                  icon: <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" />,
                  label: (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Approve Voucher
                    </span>
                  ),
                  onClick: () => handleQuickStatusUpdate(entry.id!, "APPROVED"),
                },
                {
                  key: "reject",
                  icon: <IconBan size={14} className="text-rose-600 dark:text-rose-400" />,
                  label: (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Reject Voucher
                    </span>
                  ),
                  onClick: () => handleQuickStatusUpdate(entry.id!, "REJECTED"),
                },
              ]
            : []),
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
            label: (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Delete Voucher
              </span>
            ),
            disabled: entry.status === "APPROVED" || deletingId === entry.id,
            onClick: () => handleDelete(entry.id!),
          },
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
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
    <PageContainer title="Petty Cash Management" description="Manage Expenses & Vouchers">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Finance / Cash Control
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Petty Cash Vouchers
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {pagination.total} Vouchers
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={handleOpenCreate}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Create Voucher
          </Button>
        </div>



        {/* Filters */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              search: "",
              status: "ALL",
              type: "ALL",
              category: "ALL",
              dateRange: undefined,
            }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[180px]">
              <Input
                prefix={<IconSearch size={15} className="text-text-sub" />}
                placeholder="Search Voucher # or Payee or Notes..."
                allowClear
                className="rounded-xl h-10"
              />
            </Form.Item>
            <Form.Item name="dateRange" className="!mb-0">
              <RangePicker className="rounded-xl h-10" />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-32">
              <Select className="h-10">
                <Select.Option value="ALL">All Status</Select.Option>
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="APPROVED">Approved</Select.Option>
                <Select.Option value="REJECTED">Rejected</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-32">
              <Select className="h-10">
                <Select.Option value="ALL">All Types</Select.Option>
                <Select.Option value="expense">Expense</Select.Option>
                <Select.Option value="income">Income</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" className="!mb-0 w-44">
              <Select className="h-10">
                <Select.Option value="ALL">All Categories</Select.Option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Select.Option key={cat.name} value={cat.name}>
                    {cat.name.toUpperCase()}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleClearFilters}
                  className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer"
                >
                  Clear
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Table */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 800 }}
              columns={columns}
              dataSource={pettyCashList}
              rowKey={(r: PettyCash) => r.id || Math.random().toString()}
              pagination={{ ...pagination, position: ["bottomRight"] }}
              loading={loading ? { indicator: <Spinner size="small" /> } : false}
              onChange={handleTableChange}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PettyCashFormModal
        open={formModalOpen}
        onClose={handleModalClose}
        onSave={fetchPettyCash}
        entry={selectedEntry}
      />

      <PettyCashViewModal
        open={viewModalOpen}
        onClose={handleModalClose}
        onStatusChange={fetchPettyCash}
        entry={selectedEntry}
      />
    </PageContainer>
  );
}
