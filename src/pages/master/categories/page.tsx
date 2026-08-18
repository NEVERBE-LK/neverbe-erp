import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconFilter,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Category } from "@/model/Category";
import toast from "react-hot-toast";
import AIDescriptionTextarea from "@/components/AIDescriptionTextarea";
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
import Spinner from "@/pages/components/shared/Spinner";
import { ColumnsType } from "antd/es/table";

const { Option } = Select;

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
  });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await api.get("/api/v1/erp/master/categories", {
        params,
      });
      setCategories(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch categories", e);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchCategories();
  }, [pagination.page, pagination.size, currentUser]);

  // Open Add/Edit Dialog
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        name: category.name,
        description: category.description || "",
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
    setOpen(true);
  };

  // Save (Add/Edit)
  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      const payload = {
        name: values.name,
        description: values.description,
        status: values.status,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      if (editingCategory) {
        const res = await api.put(
          `/api/v1/erp/master/categories/${editingCategory.id}`,
          formData,
        );
        const updated: Category = res.data || {
          ...editingCategory,
          ...payload,
        };
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        const res = await api.post("/api/v1/erp/master/categories", formData);
        const created: Category = res.data;
        if (created) {
          setCategories((prev) => [created, ...prev]);
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        } else {
          await fetchCategories();
        }
      }

      setOpen(false);
      toast.success(editingCategory ? "Category updated" : "Category added");
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete
  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE CATEGORY?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/master/categories/${id}`);
          setCategories((prev) => prev.filter((c) => c.id !== id));
          setPagination((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
          }));
          toast.success("Category deleted");
        } catch {
          toast.error("Failed to delete category");
        }
      },
    });
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCategories();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchCategories, 0);
  };

  const columns: ColumnsType<Category> = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="text-sm font-semibold text-text-main dark:text-text-main-dark">{text}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <span className="text-xs text-text-sub dark:text-slate-500">{text || "\u2014"}</span>,
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
    <PageContainer title="Categories" description="Category Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Master Data Configuration
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Categories
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
            New Category
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-slate-400" />}
                placeholder="Search categories..."
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
            dataSource={categories}
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
          title={<span className="text-base font-bold text-slate-900 dark:text-slate-100">{editingCategory ? "Edit Category" : "New Category"}</span>}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Category"
          maskClosable={false}
          className="rounded-2xl"
        >
          <Form form={form} layout="vertical" onFinish={handleSave} className="pt-2">
            <Form.Item
              name="name"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category Name</span>}
              rules={[
                { required: true, message: "Please enter category name" },
              ]}
            >
              <Input placeholder="Enter Name..." className="rounded-xl" />
            </Form.Item>

            <Form.Item name="description" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</span>}>
              <AIDescriptionTextarea
                rows={4}
                placeholder="Enter category description..."
                className="rounded-xl"
                contextTitle="Category Description"
                aiContext={{ name: Form.useWatch("name", form) || "" }}
              />
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

export default CategoryPage;
