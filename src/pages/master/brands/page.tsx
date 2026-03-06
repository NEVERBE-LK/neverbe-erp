import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconUpload,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Brand } from "@/model/Brand";
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
  Avatar,
  Upload,
} from "antd";
import { ColumnsType } from "antd/es/table";

const { Text } = Typography;
const { Option } = Select;

const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { showConfirmation } = useConfirmationDialog();

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm();

  // Custom states for file upload manual handling since we used state before
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await api.get("/api/v1/erp/master/brands", { params });
      setBrands(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch brands", e);
      toast.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchBrands();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (brand?: Brand) => {
    form.resetFields();
    setLogoFile(null);
    if (brand) {
      setEditingBrand(brand);
      form.setFieldsValue({
        name: brand.name,
        description: brand.description || "",
        status: brand.status,
      });
      setLogoPreview(brand.logoUrl || "");
    } else {
      setEditingBrand(null);
      form.setFieldsValue({ status: true });
      setLogoPreview("");
    }
    setOpen(true);
  };

  const beforeUpload = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Logo must be less than 20MB");
      return Upload.LIST_IGNORE;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    return false; // Prevent upload
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", String(values.name));
      formData.append("description", String(values.description || ""));
      formData.append("status", String(values.status));
      if (logoFile) formData.append("logo", logoFile);

      if (editingBrand) {
        const res = await api.put(
          `/api/v1/erp/master/brands/${editingBrand.id}`,
          formData,
        );
        const updated: Brand = res.data || {
          ...editingBrand,
          ...values,
          logoUrl: logoPreview,
        };
        setBrands((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b)),
        );
      } else {
        const res = await api.post("/api/v1/erp/master/brands", formData);
        const created: Brand = res.data;
        if (created) {
          setBrands((prev) => [created, ...prev]);
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        } else {
          await fetchBrands();
        }
      }

      toast.success(editingBrand ? "Brand updated" : "Brand added");
      setOpen(false);
    } catch (e) {
      console.error("Failed to save brand", e);
      toast.error("Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE BRAND?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/master/brands/${id}`);
          setBrands((prev) => prev.filter((b) => b.id !== id));
          setPagination((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
          }));
          toast.success("Brand deleted");
        } catch (e) {
          console.error("Failed to delete brand", e);
          toast.error("Failed to delete brand");
        }
      },
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchBrands, 0);
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBrands();
  };

  const columns: ColumnsType<Brand> = [
    {
      title: "Logo",
      dataIndex: "logoUrl",
      key: "logoUrl",
      width: 80,
      render: (url) => (
        <Avatar
          shape="square"
          size="large"
          src={url}
          icon={<IconPhoto size={20} />}
          className="bg-gray-100 border border-gray-200"
        />
      ),
    },
    {
      title: "Brand Name",
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
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Brands" description="Brand Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Partner Relationships
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Brands
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
            New Brand
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm !mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-gray-400" />}
                placeholder="Search brands..."
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
          dataSource={brands}
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
          className="border border-gray-200 rounded-md overflow-hidden bg-white"
        />

        {/* Modal */}
        <Modal
          title={editingBrand ? "Edit Brand" : "New Brand"}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Brand"
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="name"
              label="Brand Name"
              rules={[{ required: true, message: "Please enter brand name" }]}
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
                placeholder="Enter description..."
                disabled={saving}
              />
            </Form.Item>

            <Form.Item label="Logo">
              <div className="flex items-center gap-4">
                <Upload
                  beforeUpload={beforeUpload}
                  showUploadList={false}
                  maxCount={1}
                  accept="image/png, image/jpeg, image/webp"
                >
                  <Button icon={<IconUpload size={16} />}>Select Image</Button>
                </Upload>
                {logoPreview && (
                  <Avatar
                    shape="square"
                    size={64}
                    src={logoPreview}
                    className="border border-gray-200"
                  />
                )}
              </div>
            </Form.Item>

            {/* Hidden File Input Handling is done via state and FormData construction manually */}

            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default BrandPage;
