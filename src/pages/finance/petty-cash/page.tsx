import type { ColumnsType } from "antd/es/table";
import {
  Spin,
  Table,
  Tag,
  Tooltip,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  DatePicker,
} from "antd";
import type { TablePaginationConfig } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconEye,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFilter,
  IconX,
  IconLoader,
  IconSearch,
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

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PettyCash | null>(null);

  // Filters state
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE ENTRY?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          await api.delete(`/api/v1/erp/finance/petty-cash/${id}`);
          toast.success("ENTRY DELETED");
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

  // Helper for Status Badges
  const renderStatus = (status: string) => {
    let color = "default";
    switch (status) {
      case "APPROVED":
        color = "green";
        break;
      case "PENDING":
        color = "blue";
        break;
      case "REJECTED":
        color = "red";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };
  const columns: ColumnsType<any> = [
    {
      title: "Details",
      key: "details",
      render: (_, entry) => (
        <>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-900 leading-tight line-clamp-2 max-w-[250px]">
              {entry.note || "NO NOTE"}
            </span>
            <span className="text-xs text-gray-400 font-bold  ">
              {entry.date}
            </span>
          </div>
        </>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, entry) => (
        <>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                entry.type === "income" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="font-bold text-lg font-mono tracking-tight">
              {Number(entry.amount).toLocaleString()}
            </span>
          </div>
        </>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (_, entry) => <Tag>{entry.category?.toUpperCase() || "N/A"}</Tag>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, entry) => <>{renderStatus(entry.status)}</>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, entry) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<IconEye size={18} />}
              onClick={() => handleOpenView(entry)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<IconPencil size={16} />}
              disabled={entry.status === "APPROVED"}
              onClick={() => handleOpenEdit(entry)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              size="small"
              danger
              icon={
                deletingId === entry.id ? (
                  <Spin size="small" />
                ) : (
                  <IconTrash size={16} />
                )
              }
              disabled={entry.status === "APPROVED" || deletingId === entry.id}
              onClick={() => handleDelete(entry.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Petty Cash" description="Manage Expenses">
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Finance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Petty Cash
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreate}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            Create Entry
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
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
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[150px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search Notes..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="dateRange" className="!mb-0">
              <RangePicker />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-32">
              <Select>
                <Select.Option value="ALL">All Status</Select.Option>
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="APPROVED">Approved</Select.Option>
                <Select.Option value="REJECTED">Rejected</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-32">
              <Select>
                <Select.Option value="ALL">All Types</Select.Option>
                <Select.Option value="expense">Expense</Select.Option>
                <Select.Option value="income">Income</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" className="!mb-0 w-44">
              <Select>
                <Select.Option value="ALL">All Categories</Select.Option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Select.Option key={cat.name} value={cat.name}>
                    {cat.name.toUpperCase()}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                >
                  Filter
                </Button>
                <Button icon={<IconX size={15} />} onClick={handleClearFilters}>
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Table */}
        <Table
          scroll={{ x: 1000 }}
          bordered
          columns={columns}
          dataSource={pettyCashList}
          rowKey={(r: PettyCash) => r.id || Math.random().toString()}
          pagination={{ ...pagination, position: ["bottomRight"] }}
          loading={loading}
          onChange={handleTableChange}
        />
      </Space>

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
