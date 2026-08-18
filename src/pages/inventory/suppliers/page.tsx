import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { Table, Input, Select, Modal, Form, Dropdown } from "antd";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { Supplier } from "@/model/Supplier";
import Spinner from "@/pages/components/shared/Spinner";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

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

  const { showConfirmation } = useConfirmationDialog();
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
    showConfirmation({
      title: "DEACTIVATE SUPPLIER?",
      message: "Are you sure you want to deactivate this supplier?",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/procurement/suppliers/${id}`);
          toast.success("Supplier deactivated");
          fetchSuppliers();
        } catch {
          toast.error("Failed to delete supplier");
        }
      },
    });
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: "Name",
      key: "name",
      render: (_, supplier) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{supplier.name}</div>
          {supplier.city && (
            <div className="text-xs text-slate-500 dark:text-slate-400">{supplier.city}</div>
          )}
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, supplier) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {supplier.contactPerson || "\u2014"}
        </span>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      render: (_, supplier) => (
        <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
          {supplier.phone || "\u2014"}
        </span>
      ),
    },
    {
      title: "Payment Terms",
      key: "paymentTerms",
      render: (_, supplier) => (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {supplier.paymentTerms || "\u2014"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      align: "center",
      render: (_, supplier) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            supplier.status
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              supplier.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {supplier.status ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      align: "center",
      render: (_, supplier) => {
        const items: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit",
            onClick: () => handleEdit(supplier),
          },
          { type: "divider" },
          {
            key: "delete",
            icon: <IconTrash size={14} />,
            label: "Deactivate",
            danger: true,
            onClick: () => handleDelete(supplier.id!),
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
    <PageContainer
      title="Suppliers"
      description="Procurement & Vendor Directory"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Procurement
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Supplier Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {suppliers.length} items
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <IconPlus size={16} />
            Add Supplier
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ status: "all" }}
            className="flex flex-wrap items-center gap-3 w-full"
          >
            <Form.Item name="search" className="mb-0! flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={16} className="text-slate-400" />}
                placeholder="Search by name, contact or phone..."
                allowClear
                className="rounded-xl"
              />
            </Form.Item>
            <Form.Item name="status" className="mb-0! w-48">
              <Select className="rounded-xl">
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item className="mb-0!">
              <div className="flex gap-2">
                <button
                  type="submit"
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
            </Form.Item>
          </Form>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <Table
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={suppliers}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            rowKey={(r) => r.id || Math.random().toString()}
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            size="small"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>

        {/* Modal */}
        <Modal
          open={isModalOpen}
          title={
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </span>
          }
          onCancel={() => setIsModalOpen(false)}
          maskClosable={false}
          className="rounded-2xl"
          footer={
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {saving && <Spinner size="small" />}
                {editingSupplier ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter supplier name..."
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Person
                </label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Enter contact person..."
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email..."
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Enter city..."
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Terms
                </label>
                <Select
                  className="w-full rounded-xl"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Address
              </label>
              <Input.TextArea
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
                placeholder="Enter address..."
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <Select
                  className="w-full rounded-xl"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes
                </label>
                <Input.TextArea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Enter notes..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default SuppliersPage;
