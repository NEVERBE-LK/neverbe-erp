import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Category } from "@/model/Category";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import AIDescriptionTextarea from "@/components/AIDescriptionTextarea";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Switch,
  Space,
  Card,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { ColumnsType } from "antd/es/table";

const { Text } = Typography;
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

      if (editingCategory) {
        const res = await api.put(
          `/api/v1/erp/master/categories/${editingCategory.id}`,
          payload,
        );
        const updated: Category = res.data || {
          ...editingCategory,
          ...payload,
        };
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        const res = await api.post("/api/v1/erp/master/categories", payload);
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
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <Text type="secondary">{text || "N/A"}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag color={status ? "green" : "default"}>
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => handleOpenDialog(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDelete(record.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Categories" description="Category Management">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Master Data Configuration
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Categories
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={() => handleOpenDialog()}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Category
          </Button>
        </div>

        {/* Filters Panel */}
        <Card size="small" className="shadow-sm !mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-gray-400" />}
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleFilterSearch}
                allowClear
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={status}
                onChange={setStatus}
                style={{ width: "100%" }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<IconFilter size={15} />}
                onClick={handleFilterSearch}
              >
                Filter
              </Button>
              <Button icon={<IconX size={15} />} onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Table
          scroll={{ x: 1000 }}
          bordered
          columns={columns}
          dataSource={categories}
          loading={loading}
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
        />

        {/* Modal */}
        <Modal
          title={editingCategory ? "Edit Category" : "New Category"}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Category"
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="name"
              label="Category Name"
              rules={[
                { required: true, message: "Please enter category name" },
              ]}
            >
              <Input placeholder="Enter Name..." />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <AIDescriptionTextarea
                aiContext={{
                  name: form.getFieldValue("name"),
                  category: "Brand",
                }}
                rows={4}
                placeholder="Enter details..."
                disabled={saving}
              />
            </Form.Item>

            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default CategoryPage;
