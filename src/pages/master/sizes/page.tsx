import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconRuler,
  IconFilter,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Size } from "@/model/Size";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Switch,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import { ColumnsType } from "antd/es/table";
import Spinner from "@/pages/components/shared/Spinner";

const { Option } = Select;

const SizePage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);

  const [form] = Form.useForm();

  // Fetch Sizes
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const { data } = await api.get("/api/v1/erp/master/sizes", { params });
      setSizes(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch sizes", e);
      toast.error("Failed to fetch sizes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchSizes();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      form.setFieldsValue({ name: size.name, status: size.status });
    } else {
      setEditingSize(null);
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
    setOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("data", JSON.stringify(values));

      if (editingSize) {
        const res = await api.put(
          `/api/v1/erp/master/sizes/${editingSize.id}`,
          formData,
        );
        const updated: Size = res.data || { ...editingSize, ...values };
        setSizes((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
      } else {
        const res = await api.post("/api/v1/erp/master/sizes", formData);
        const created: Size = res.data;
        if (created) {
          setSizes((prev) => [created, ...prev]);
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        } else {
          await fetchSizes();
        }
      }
      setOpen(false);
      toast.success(editingSize ? "Size updated" : "Size added");
    } catch (e) {
      console.error("Failed to save size", e);
      toast.error("Failed to save size");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE SIZE?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/master/sizes/${id}`);
          setSizes((prev) => prev.filter((s) => s.id !== id));
          setPagination((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
          }));
          toast.success("Size deleted");
        } catch (e) {
          console.error("Failed to delete size", e);
          toast.error("Failed to delete size");
        }
      },
    });
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSizes();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchSizes, 0);
  };

  const columns: ColumnsType<Size> = [
    {
      title: "Size Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="text-sm font-semibold text-text-main dark:text-text-main-dark">
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          status
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {status ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      align: "center",
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit",
            onClick: () => handleOpenDialog(record),
          },
          { type: "divider" },
          {
            key: "delete",
            icon: <IconTrash size={14} />,
            label: "Delete",
            danger: true,
            onClick: () => handleDelete(record.id!),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <button className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <IconDotsVertical size={16} />
            </button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageContainer title="Sizes" description="Size Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Product Attributes
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Size Chart
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {pagination.total} items
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <IconPlus size={16} />
            New Size
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-slate-400" />}
                placeholder="Search sizes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleFilterSearch}
                allowClear
                className="rounded-xl"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={status}
                onChange={setStatus}
                style={{ width: "100%" }}
                className="rounded-xl"
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFilterSearch}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
              >
                <IconFilter size={14} />
                Filter
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all cursor-pointer"
              >
                <IconX size={14} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <Table
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={sizes}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.size,
              total: pagination.total,
              onChange: (page, size) =>
                setPagination((prev) => ({ ...prev, page, size })),
              showSizeChanger: true,
              position: ["bottomRight"],
            }}
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>

        {/* Modal */}
        <Modal
          title={<span className="text-base font-bold text-slate-900 dark:text-slate-100">{editingSize ? "Edit Size" : "New Size"}</span>}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Size"
          maskClosable={false}
          width={400}
        >
          <Form form={form} layout="vertical" onFinish={handleSave} className="pt-2">
            <Form.Item
              name="name"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Size Name (e.g. XL, 42)</span>}
              rules={[{ required: true, message: "Please enter size name" }]}
            >
              <Input placeholder="Enter Size..." className="rounded-xl" />
            </Form.Item>

            <Form.Item name="status" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</span>} valuePropName="checked">
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default SizePage;
