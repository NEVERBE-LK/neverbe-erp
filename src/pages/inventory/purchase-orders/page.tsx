import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Form, Input, Select, Button, Space, Table, Col, Row, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconFileText,
  IconCalendar,
  IconUser,
  IconPigMoney,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { PO_STATUS_LABELS, PurchaseOrderStatus } from "@/model/PurchaseOrder";
import NewPOModal from "./components/NewPOModal";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDate?: string;
  createdAt: string;
}

const PO_STATUS_STYLING: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; dot: string }
> = {
  DRAFT: {
    bg: "bg-gray-50",
    text: "text-gray-700 border border-gray-200",
    dot: "bg-gray-400",
  },
  SUBMITTED: {
    bg: "bg-blue-50/50",
    text: "text-blue-700 border border-blue-100",
    dot: "bg-blue-500",
  },
  APPROVED: {
    bg: "bg-emerald-50/50",
    text: "text-emerald-700 border border-emerald-100",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    bg: "bg-rose-50/50",
    text: "text-rose-700 border border-rose-100",
    dot: "bg-rose-500",
  },
  COMPLETED: {
    bg: "bg-indigo-50/50",
    text: "text-indigo-700 border border-indigo-100",
    dot: "bg-indigo-500",
  },
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

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.supplierName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  // --- Dynamic Stats ---
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter(
      (o) => o.status === "DRAFT" || o.status === "SUBMITTED",
    ).length;
    const totalValue = filteredOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );
    return { total, pending, totalValue };
  }, [filteredOrders]);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "PO Number",
      key: "poNumber",
      render: (_, po) => (
        <Space>
          <IconFileText size={16} className="text-gray-400" />
          <span className="font-mono font-bold text-gray-900 text-sm tracking-wide">
            {po.poNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "Supplier",
      key: "supplierName",
      render: (_, po) => (
        <span className="font-semibold text-gray-700 text-sm">
          {po.supplierName}
        </span>
      ),
    },
    {
      title: "Status",
      align: "center",
      key: "status",
      render: (_, po) => {
        const style = PO_STATUS_STYLING[po.status] || {
          bg: "bg-gray-100",
          text: "text-gray-700",
          dot: "bg-gray-400",
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span>{PO_STATUS_LABELS[po.status] || po.status}</span>
          </span>
        );
      },
    },
    {
      title: "Amount",
      align: "right",
      key: "totalAmount",
      render: (_, po) => (
        <span className="font-bold text-gray-900">
          Rs {po.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Expected",
      align: "right",
      key: "expectedDate",
      render: (_, po) => (
        <Space className="text-gray-500 text-xs font-bold">
          <IconCalendar size={14} className="text-gray-400" />
          <span>{po.expectedDate || "-"}</span>
        </Space>
      ),
    },
    {
      title: "Action",
      align: "right",
      key: "action",
      width: 80,
      render: (_, po) => (
        <div className="flex justify-end">
          <Link
            to={`/inventory/purchase-orders/${po.id}`}
            className="p-2 hover:bg-gray-100 inline-flex rounded-xl transition-colors text-gray-500 hover:text-black"
            title="View Details"
          >
            <IconEye size={18} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Purchase Orders">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Procurement
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">
                Purchase Orders
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => setIsModalOpen(true)}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 self-start sm:self-auto"
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

        {/* Metric Cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total Orders
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.total}
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                  <IconFileText size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Pending Approvals
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.pending}
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                  <IconUser size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total Order Value
                  </Typography.Text>
                  <div className="text-2xl font-black text-slate-800 mt-1 truncate">
                    Rs {stats.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <IconPigMoney size={24} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card
          size="small"
          className="border-none bg-gray-50/50 rounded-2xl shadow-none"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", status: "" }}
            className="w-full p-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search PO Number or Supplier..."
                  allowClear
                  className="rounded-xl border-gray-200 h-10 w-full"
                />
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select
                  placeholder="All Status"
                  allowClear
                  className="h-10 rounded-xl w-full"
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
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<IconFilter size={15} />}
                    className="rounded-xl h-10 font-bold flex-1 bg-gray-900 border-none hover:bg-black flex items-center justify-center gap-1"
                  >
                    Filter
                  </Button>
                  <Button
                    icon={<IconX size={15} />}
                    onClick={handleClearFilters}
                    className="rounded-xl h-10 font-bold border-gray-200 flex-1 flex items-center justify-center gap-1"
                  >
                    Clear
                  </Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </Card>

        {/* Table Container */}
        <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={columns}
            dataSource={filteredOrders}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default PurchaseOrdersPage;
