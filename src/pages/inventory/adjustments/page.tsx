import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Card, Form, Input, Select, Button, Space, Table, Col, Row, Typography, Tag } from "antd";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconRotateDot,
  IconArrowsExchange,
  IconFileText,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";
import NewAdjustmentModal from "./components/NewAdjustmentModal";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  reason: string;
  items: { productName: string; quantity: number }[];
  status: AdjustmentStatus;
  createdAt: string;
  adjustedByName?: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-50 text-green-700 border border-green-200",
  remove: "bg-red-50 text-red-700 border border-red-200",
  damage: "bg-orange-50 text-orange-700 border border-orange-200",
  return: "bg-blue-50 text-blue-700 border border-blue-200",
  transfer: "bg-purple-50 text-purple-700 border border-purple-200",
};

const TYPE_ICONS: Record<AdjustmentType, React.ReactNode> = {
  add: <IconTrendingUp size={16} className="text-green-600" />,
  remove: <IconTrendingDown size={16} className="text-red-600" />,
  damage: <IconAlertTriangle size={16} className="text-orange-600" />,
  return: <IconRotateDot size={16} className="text-blue-600" />,
  transfer: <IconArrowsExchange size={16} className="text-purple-600" />,
};

const STATUS_STYLING: Record<
  AdjustmentStatus,
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

const AdjustmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustments = useCallback(
    async (values?: any) => {
      setLoading(true);
      try {
        const filters = values || form.getFieldsValue();
        const params: Record<string, any> = {
          page: pagination.current,
          size: pagination.pageSize,
        };

        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;

        const res = await api.get<{ dataList: Adjustment[]; rowCount: number }>(
          "/api/v1/erp/inventory/adjustments",
          { params },
        );
        setAdjustments(res.data.dataList || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.rowCount || 0,
        }));
      } catch {
        toast.error("Failed to fetch adjustments");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, form],
  );

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, fetchAdjustments]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchAdjustments(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  // --- Dynamic Stats ---
  const stats = useMemo(() => {
    const total = pagination.total;
    const additions = adjustments.filter((a) => a.type === "add").length;
    const issues = adjustments.filter(
      (a) => a.type === "remove" || a.type === "damage",
    ).length;
    return { total, additions, issues };
  }, [adjustments, pagination.total]);

  const columns: ColumnsType<Adjustment> = [
    {
      title: "Adjustment #",
      key: "adjustment",
      render: (_, adj) => (
        <Space>
          <IconFileText size={16} className="text-gray-400" />
          <span className="font-mono font-bold text-gray-900">
            {adj.adjustmentNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "Date",
      key: "date",
      render: (_, adj) => (
        <Space className="text-gray-600 text-xs">
          <IconCalendar size={14} className="text-gray-400" />
          <span>{dayjs(adj.createdAt).format("YYYY-MM-DD HH:mm")}</span>
        </Space>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, adj) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
            TYPE_COLORS[adj.type] || "bg-gray-100"
          }`}
        >
          {TYPE_ICONS[adj.type]}
          <span>{TYPE_LABELS[adj.type] || adj.type}</span>
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, adj) => {
        const style = STATUS_STYLING[adj.status] || {
          bg: "bg-gray-100",
          text: "text-gray-700",
          dot: "bg-gray-400",
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span>{ADJUSTMENT_STATUS_LABELS[adj.status] || adj.status}</span>
          </span>
        );
      },
    },
    {
      title: "Reason",
      key: "reason",
      render: (_, adj) => (
        <span className="text-gray-700 text-sm truncate max-w-[200px] block">
          {adj.reason}
        </span>
      ),
    },
    {
      title: "Adjusted By",
      key: "adjustedBy",
      render: (_, adj) => (
        <Space className="text-gray-600 text-xs">
          <IconUser size={14} className="text-gray-400" />
          <span>{adj.adjustedByName || "-"}</span>
        </Space>
      ),
    },
    {
      title: "Items",
      key: "items",
      render: (_, adj) => (
        <Tag color="cyan" className="rounded-full px-2.5 font-semibold">
          {adj.items?.length || 0} items
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, adj) => (
        <Link
          to={`/inventory/adjustments/${adj.id}`}
          className="p-2 hover:bg-gray-100 inline-flex rounded-xl transition-colors text-gray-500 hover:text-black"
        >
          <IconEye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <PageContainer title="Inventory Adjustments">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Inventory Control
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">
                Inventory Adjustments
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => setIsModalOpen(true)}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 self-start sm:self-auto"
          >
            New Adjustment
          </Button>
        </div>

        <NewAdjustmentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAdjustments();
          }}
        />

        {/* Metric Cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total Adjustments
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.total}
                  </div>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <IconFileText size={24} />
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
                    Stock Additions (Page)
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.additions}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <IconTrendingUp size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50/50 to-orange-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Removals & Damages (Page)
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.issues}
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                  <IconTrendingDown size={24} />
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
            initialValues={{ search: "", type: "" }}
            className="w-full p-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search by ID or reason..."
                  allowClear
                  className="rounded-xl border-gray-200 h-10 w-full"
                />
              </Form.Item>
              <Form.Item name="type" label="Type" className="!mb-0">
                <Select
                  className="h-10 rounded-xl w-full"
                  placeholder="Select Type"
                >
                  <Select.Option value="">All Types</Select.Option>
                  <Select.Option value="add">Stock Addition</Select.Option>
                  <Select.Option value="remove">Stock Removal</Select.Option>
                  <Select.Option value="damage">Damaged Goods</Select.Option>
                  <Select.Option value="return">Customer Return</Select.Option>
                  <Select.Option value="transfer">Stock Transfer</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select
                  className="h-10 rounded-xl w-full"
                  placeholder="Select Status"
                >
                  <Select.Option value="">All Status</Select.Option>
                  {Object.entries(ADJUSTMENT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <Select.Option key={value} value={value}>
                        {label}
                      </Select.Option>
                    ),
                  )}
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
            dataSource={adjustments}
            loading={loading}
            rowKey={(r: Adjustment) => r.id}
            pagination={{ ...pagination, position: ["bottomRight"] }}
            onChange={handleTableChange}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default AdjustmentsPage;
