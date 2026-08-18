import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconBuildingWarehouse,
  IconFilter,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { Stock } from "@/model/Stock";
import PageContainer from "../../components/container/PageContainer";
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

const StockPage: React.FC = () => {
  const [locations, setLocations] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const { showConfirmation } = useConfirmationDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Stock | null>(null);
  const [saving, setSaving] = useState(false);

  // Form instance
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status === "active";

      const response = await api.get("/api/v1/erp/master/stocks", { params });
      setLocations(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e) {
      console.error("Failed to fetch stock locations", e);
      toast.error("Failed to fetch stock locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchLocations();
    }
  }, [pagination.page, pagination.size, currentUser, authLoading]); // Added dependencies

  // --- Handlers ---
  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLocations();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchLocations, 0); // Re-fetch after state update essentially
  };

  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (location: Stock) => {
    setEditingLocation(location);
    form.setFieldsValue({
      name: location.name,
      address: location.address || "",
      status: location.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    form.resetFields();
  };

  const handleSaveLocation = async (values: Record<string, unknown>) => {
    setSaving(true);
    const isEditing = !!editingLocation;
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(values));

      if (isEditing) {
        await api.put(
          `/api/v1/erp/master/stocks/${editingLocation!.id}`,
          formData,
        );
      } else {
        await api.post("/api/v1/erp/master/stocks", formData);
      }
      toast.success(`Location ${isEditing ? "updated" : "added"}`);
      handleCloseModal();
      fetchLocations();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(err.response?.data?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    showConfirmation({
      title: "DELETE LOCATION?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/master/stocks/${id}`);
          toast.success("Location deleted");
          fetchLocations();
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            err.response?.data?.message || "Failed to delete location",
          );
        }
      },
    });
  };

  const columns: ColumnsType<Stock> = [
    {
      title: "Stock ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      render: (text) => (
        <span className="text-[11px] font-mono text-text-sub dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
          {text}
        </span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="text-sm font-semibold text-text-main dark:text-text-main-dark">{text}</span>,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
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
            onClick: () => handleOpenEditModal(record),
          },
          { type: "divider" },
          {
            key: "delete",
            icon: <IconTrash size={14} />,
            label: "Delete",
            danger: true,
            onClick: () => handleDeleteLocation(record.id!),
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
      title="Stock Locations"
      description="Manage Warehouses and Stores"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Warehouse Management
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Stock Locations
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {pagination.total} items
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <IconPlus size={16} />
            New Location
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-slate-400" />}
                placeholder="Search locations..."
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
            dataSource={locations}
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
          title={<span className="text-base font-bold text-slate-900 dark:text-slate-100">{editingLocation ? "Modify Location" : "New Location"}</span>}
          open={isModalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Location"
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLocation} className="pt-2">
            <Form.Item
              name="name"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location Name</span>}
              rules={[
                { required: true, message: "Please enter location name" },
              ]}
            >
              <Input placeholder="E.g. Main Warehouse" className="rounded-xl" />
            </Form.Item>

            <Form.Item name="address" label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Address</span>}>
              <Input.TextArea rows={3} placeholder="Full address..." className="rounded-xl" />
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

export default StockPage;
