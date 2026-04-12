import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Form, Input, Select, Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from "@/model/PurchaseOrder";
import NewPOModal from "./components/NewPOModal";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedDate?: string;
  createdAt: string;
}

// --- NIKE AESTHETIC STYLES ---
const styles = {
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-8 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer ",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-all rounded-lg shadow-sm hover:shadow-md",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-green-600 hover:border-gray-200 hover:text-white transition-colors",
};

const PurchaseOrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: any) => {
    setSearch(values.search || "");
    setStatusFilter(values.status || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
    setStatusFilter("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<PurchaseOrder[]>(
        "/api/v1/erp/procurement/purchase-orders",
        { params },
      );
      setOrders(res.data);
    } catch {
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [currentUser, statusFilter]);

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "PO Number",
      key: "poNumber",
      render: (_, po) => (
        <span className="font-mono font-bold text-black text-xs tracking-wide">
          {po.poNumber}
        </span>
      ),
    },
    {
      title: "Supplier",
      key: "supplierName",
      render: (_, po) => (
        <span className="font-bold text-gray-700 text-xs tracking-wide">
          {po.supplierName}
        </span>
      ),
    },
    {
      title: "Status",
      align: "center",
      key: "status",
      render: (_, po) => (
        <span
          className={`px-3 py-1 text-xs font-bold rounded-lg border ${PO_STATUS_COLORS[po.status] || "bg-gray-100 border-gray-200"}`}
        >
          {PO_STATUS_LABELS[po.status] || po.status}
        </span>
      ),
    },
    {
      title: "Amount",
      align: "right",
      key: "totalAmount",
      render: (_, po) => (
        <span className="font-bold text-black">
          Rs {po.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Expected",
      align: "right",
      key: "expectedDate",
      render: (_, po) => (
        <span className="text-gray-500 text-xs font-bold">
          {po.expectedDate || "-"}
        </span>
      ),
    },
    {
      title: "Action",
      align: "right",
      key: "action",
      render: (_, po) => (
        <div className="flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <Link
            to={`/inventory/purchase-orders/${po.id}`}
            className={`${styles.iconBtn} rounded-lg`}
            title="View Details"
          >
            <IconEye size={16} stroke={2} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Purchase Orders">
      <div className="w-full space-y-8">
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Procurement
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Purchase Orders
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => setIsModalOpen(true)}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Order
          </Button>
        </div>

        <NewPOModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchOrders();
          }}
        />

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", status: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search PO Number or Supplier..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-40">
              <Select
                placeholder="All Status"
                allowClear
                onChange={() => form.submit()}
              >
                <Select.Option value="">All Status</Select.Option>
                {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
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

        {/* Table */}
        <div className="mt-6">
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={columns}
            dataSource={filteredOrders}
            loading={loading}
            rowKey="id"
            rowClassName="group"
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default PurchaseOrdersPage;
