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
  IconDotsVertical,
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
  Avatar,
  Upload,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import Spinner from "@/pages/components/shared/Spinner";
import { ColumnsType } from "antd/es/table";

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
      if (logoFile) formData.append("logo", logoFile);
      formData.append("data", JSON.stringify(values));

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
          className="bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark"
        />
      ),
    },
    {
      title: "Brand Name",
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
            onClick: () => handleDelete(record.id),
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
    <PageContainer title="Brands" description="Brand Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Partner Relationships
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Brands
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
            New Brand
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-slate-400" />}
                placeholder="Search brands..."
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
            dataSource={brands}
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
          title={<span className="text-base font-bold text-slate-900 dark:text-slate-100">{editingBrand ? "Edit Brand" : "New Brand"}</span>}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Brand"
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSave} className="pt-2">
            <Form.Item
              name="name"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brand Name</span>}
              rules={[{ required: true, message: "Please enter brand name" }]}
            >
              <Input placeholder="Enter Brand Name..." className="rounded-xl" />
            </Form.Item>

            <Form.Item name="logoUrl" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brand Logo</span>}>
              <div className="flex items-center gap-4">
                <Upload
                  beforeUpload={beforeUpload}
                  showUploadList={false}
                  maxCount={1}
                  accept="image/png, image/jpeg, image/webp"
                >
                  <Button icon={<IconUpload size={16} />} className="rounded-xl">Select Image</Button>
                </Upload>
                {logoPreview && (
                  <Avatar
                    shape="square"
                    size={64}
                    src={logoPreview}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl"
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
