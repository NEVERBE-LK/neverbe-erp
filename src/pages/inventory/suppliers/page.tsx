import type { ColumnsType } from "antd/es/table";
import {
  Button,
  Table,
  Input,
  Select,
  Modal,
  Form,
  Card,
  Tag,
  Space,
  Typography,
} from "antd";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

import { Supplier } from "@/model/Supplier";

const DEFAULT_SUPPLIER: Supplier = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  paymentTerms: "COD",
  notes: "",
  status: true,
};

const SuppliersPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Supplier>(DEFAULT_SUPPLIER);
  const [saving, setSaving] = useState(false);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSuppliers = React.useCallback(
    async (values?: any) => {
      setLoading(true);
      try {
        const filters = values || form.getFieldsValue();
        const params: Record<string, string | boolean> = {};

        if (filters.search) params.search = filters.search;
        if (filters.status && filters.status !== "all") {
          params.status = filters.status;
        }

        const res = await api.get<Supplier[]>(
          "/api/v1/erp/procurement/suppliers",
          { params },
        );
        setSuppliers(res.data);
      } catch {
        toast.error("Failed to fetch suppliers");
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  useEffect(() => {
    if (currentUser) fetchSuppliers();
  }, [currentUser, fetchSuppliers]);

  const handleFilterSubmit = (values: any) => {
    fetchSuppliers(values);
  };

  const handleClearFilters = () => {
    form.resetFields();
    fetchSuppliers({});
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData(DEFAULT_SUPPLIER);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast("Supplier name is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));

      if (editingSupplier?.id) {
        await api.put(
          `/api/v1/erp/procurement/suppliers/${editingSupplier.id}`,
          fd,
        );
        toast.success("Supplier updated");
      } else {
        await api.post("/api/v1/erp/procurement/suppliers", fd);
        toast.success("Supplier created");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;
    try {
      await api.delete(`/api/v1/erp/procurement/suppliers/${id}`);
      toast.success("Supplier deactivated");
      fetchSuppliers();
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: "Name",
      key: "name",
      render: (_, supplier) => (
        <>
          <div className="font-medium text-gray-900">{supplier.name}</div>
          {supplier.city && (
            <div className="text-xs text-gray-500">{supplier.city}</div>
          )}
        </>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, supplier) => <>{supplier.contactPerson || "-"}</>,
    },
    {
      title: "Phone",
      key: "phone",
      render: (_, supplier) => <>{supplier.phone || "-"}</>,
    },
    {
      title: "Payment Terms",
      key: "paymentTerms",
      render: (_, supplier) => <>{supplier.paymentTerms || "-"}</>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, supplier) => (
        <Tag color={supplier.status ? "success" : "error"}>
          {supplier.status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, supplier) => (
        <Space>
          <button
            onClick={() => handleEdit(supplier)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(supplier.id!)}
            className="p-2 hover:bg-red-50 text-red-600 transition-colors"
          >
            <IconTrash size={16} />
          </button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Suppliers"
      description="Procurement & Vendor Directory"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Procurement
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Supplier Directory
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={handleAdd}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            Add Supplier
          </Button>
        </div>

        {/* Filter bar */}
        <Card size="small" className="shadow-sm mb-4!">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ status: "all" }}
            className="flex flex-wrap gap-2 w-full"
          >
            <Form.Item name="search" className="mb-0! flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search by name, contact or phone..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="status" className="mb-0! w-48">
              <Select>
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item className="mb-0!">
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
          dataSource={suppliers}
          loading={loading}
          rowKey={(r) => r.id || Math.random().toString()}
          pagination={{ pageSize: 15, position: ["bottomRight"] }}
          size="small"
          className="border border-gray-100 rounded-xl overflow-hidden shadow-none"
        />

        <Modal
          open={isModalOpen}
          title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
          onCancel={() => setIsModalOpen(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                {editingSupplier ? "Update" : "Create"}
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Contact Person
                </label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  City
                </label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Payment Terms
                </label>
                <Select
                  className="w-full"
                  value={formData.paymentTerms || "COD"}
                  onChange={(val) =>
                    setFormData({ ...formData, paymentTerms: val })
                  }
                  options={[
                    { value: "COD", label: "Cash on Delivery" },
                    { value: "Advance", label: "Advance Payment" },
                    { value: "Net 7", label: "Net 7 Days" },
                    { value: "Net 15", label: "Net 15 Days" },
                    { value: "Net 30", label: "Net 30 Days" },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Address
              </label>
              <Input.TextArea
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Status
                </label>
                <Select
                  className="w-full"
                  value={formData.status ? "active" : "inactive"}
                  onChange={(val) =>
                    setFormData({ ...formData, status: val === "active" })
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Notes
                </label>
                <Input.TextArea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
        </Modal>
      </Space>
    </PageContainer>
  );
};

export default SuppliersPage;
