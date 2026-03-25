import type { ColumnsType } from "antd/es/table";
import { Button, Table, Input, Select, Switch, Modal } from "antd";
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
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { Space, Tooltip, Card, Form } from "antd";

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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
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
      toast("Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));

      if (editingId) {
        await api.put(
          `/api/v1/erp/finance/expense-categories/${editingId}`,
          fd,
        );
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
    { title: "Name", key: "name", render: (_, cat) => <>{cat.name}</> },
    {
      title: "Description",
      key: "description",
      render: (_, cat) => <>{cat.description || "-"}</>,
    },
    {
      title: "Type",
      key: "type",
      render: (_, cat) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              cat.type === "expense"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {cat.type}
          </span>
        </>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, cat) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              cat.status
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {cat.status ? "Active" : "Inactive"}
          </span>
        </>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, cat) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => openEditModal(cat)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDelete(cat.id)}
            />
          </Tooltip>
        </Space>
      ),
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
    <PageContainer
      title="Expense Categories"
      description="Financial Classifications"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Financial Classifications
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Expense Categories
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            Add Category
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
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
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[150px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search Categories..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-44">
              <Select>
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="expense">Expense</Select.Option>
                <Select.Option value="income">Income</Select.Option>
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

        {/* List */}
        {!loading && filteredCategories.length === 0 ? (
          <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl shadow-sm">
            <IconCategory size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table
                scroll={{ x: 1000 }}
                bordered
                columns={columns}
                dataSource={filteredCategories}
                loading={loading}
                rowKey={(r: ExpenseCategory) =>
                  r.id || Math.random().toString()
                }
                pagination={{ pageSize: 15, position: ["bottomRight"] }}
              />
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cat.description || "No description"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            cat.type === "expense"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {cat.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            cat.status
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cat.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title="Edit">
                        <Button
                          type="text"
                          icon={<IconEdit size={16} />}
                          onClick={() => openEditModal(cat)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          danger
                          icon={<IconTrash size={16} />}
                          onClick={() => handleDelete(cat.id)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal
          open={showModal}
          title={editingId ? "Edit Category" : "Add Category"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Office Supplies"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Type *
              </label>
              <Select
                className="w-full"
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.status}
                onChange={(checked) =>
                  setFormData({ ...formData, status: checked })
                }
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>
        </Modal>
      </Space>
    </PageContainer>
  );
};

export default ExpenseCategoriesPage;
