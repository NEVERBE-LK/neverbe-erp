import type { ColumnsType } from "antd/es/table";
import { Button, Table, Input, Select, Switch, Modal, Form, Dropdown } from "antd";
import type { MenuProps } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconFilter,
  IconX,
  IconSearch,
  IconDotsVertical,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  type: "expense" | "income";
  status: boolean;
}

const ExpenseCategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filters, setFilters] = useState<{
    type: "all" | "expense" | "income";
    search: string;
  }>({
    type: "all",
    search: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "expense" as "expense" | "income",
    status: true,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const url =
        filters.type === "all"
          ? "/api/v1/erp/finance/expense-categories"
          : `/api/v1/erp/finance/expense-categories?type=${filters.type}`;

      const res = await api.get<ExpenseCategory[]>(url);
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchCategories();
  }, [currentUser, filters.type]);

  const handleFilterSubmit = (values: Record<string, any>) => {
    setFilters({
      type: values.type || "all",
      search: values.search || "",
    });
  };

  const handleClearFilters = () => {
    form.resetFields();
    setFilters({
      type: "all",
      search: "",
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", type: "expense", status: true });
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
      status: category.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));

      if (editingId) {
        await api.put(`/api/v1/erp/finance/expense-categories/${editingId}`, fd);
        toast.success("Category updated");
      } else {
        await api.post("/api/v1/erp/finance/expense-categories", fd);
        toast.success("Category created");
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/api/v1/erp/finance/expense-categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Name",
      key: "name",
      render: (_, cat) => (
        <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">
          {cat.name}
        </span>
      ),
    },
    {
      title: "Description",
      key: "description",
      render: (_, cat) => (
        <span className="text-xs text-text-sub dark:text-slate-400">
          {cat.description || "—"}
        </span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, cat) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
            cat.type === "expense"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
          }`}
        >
          {cat.type}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, cat) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
            cat.status
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cat.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {cat.status ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right",
      render: (_, cat) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Category",
            onClick: () => openEditModal(cat),
          },
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
            label: (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Delete Category
              </span>
            ),
            onClick: () => handleDelete(cat.id),
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

  const filteredCategories = categories.filter((cat) => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(s) ||
      (cat.description && cat.description.toLowerCase().includes(s))
    );
  });

  return (
    <PageContainer title="Expense Categories" description="Financial Classifications">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Financial Classifications
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Expense Categories
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {categories.length} Total
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={openAddModal}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Add Category
          </Button>
        </div>

        {/* Filters Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              type: "all",
              search: "",
            }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-text-sub" />}
                placeholder="Search Categories..."
                allowClear
                className="rounded-xl h-10"
              />
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-44">
              <Select className="h-10">
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="expense">Expense</Select.Option>
                <Select.Option value="income">Income</Select.Option>
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

        {/* Table / List */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="large" tip="Loading Categories..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-12 text-center rounded-2xl shadow-xs">
            <IconCategory size={48} className="mx-auto text-text-sub mb-4" />
            <p className="text-text-sub text-sm font-semibold">No expense categories found</p>
          </div>
        ) : (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
            <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
              <Table
                scroll={{ x: 800 }}
                columns={columns}
                dataSource={filteredCategories}
                rowKey={(r: ExpenseCategory) => r.id || Math.random().toString()}
                pagination={{ pageSize: 15, position: ["bottomRight"] }}
              />
            </div>
          </div>
        )}

        <Modal
          open={showModal}
          title={editingId ? "Edit Category" : "Add Category"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowModal(false)} className="rounded-xl h-10 font-bold text-xs">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none rounded-xl h-10 px-5 font-bold text-xs cursor-pointer"
              >
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Office Supplies"
                className="rounded-xl h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="rounded-xl h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Type *
              </label>
              <Select
                className="w-full h-10"
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.status}
                onChange={(checked) => setFormData({ ...formData, status: checked })}
              />
              <span className="text-xs font-bold text-text-main dark:text-text-main-dark uppercase font-mono">
                Active Category
              </span>
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default ExpenseCategoriesPage;
