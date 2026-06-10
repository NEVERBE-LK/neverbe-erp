import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Space, Table, Select, Col, Row, Typography } from "antd";
import {
  IconEye,
  IconSearch,
  IconPlus,
  IconFilter,
  IconX,
  IconFileText,
  IconCalendar,
  IconCheck,
  IconPigMoney,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  GRN as GRNModel,
  GRN_STATUS_LABELS,
  GRNStatus,
} from "@/model/GRN";

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  receivedDate: string;
  receivedBy?: string;
  status: GRNStatus;
}

const GRN_STATUS_STYLING: Record<
  GRNStatus,
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

const GRNListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: { search: string; status: string }) => {
    setSearch(values.search || "");
    setStatus(values.status || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
    setStatus("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const canCreate = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPERADMIN" ||
      currentUser.role === "Manager" ||
      currentUser.permissions?.includes("create_grn")
    );
  }, [currentUser]);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const res = await api.get<GRN[]>(
        `/api/v1/erp/inventory/grn?${params.toString()}`,
      );
      setGRNs(res.data);
    } catch {
      toast.error("Failed to fetch GRNs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchGRNs();
  }, [currentUser]);

  const filteredGRNs = useMemo(() => {
    return grns.filter(
      (g) =>
        g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.supplierName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [grns, search]);

  // --- Dynamic Stats ---
  const stats = useMemo(() => {
    const total = filteredGRNs.length;
    const completed = filteredGRNs.filter((g) => g.status === "COMPLETED").length;
    const totalValue = filteredGRNs.reduce(
      (sum, g) => sum + (g.totalAmount || 0),
      0,
    );
    return { total, completed, totalValue };
  }, [filteredGRNs]);

  const columns: ColumnsType<GRN> = [
    {
      title: "GRN Number",
      key: "gRNNumber",
      render: (_, grn) => (
        <Space>
          <IconFileText size={16} className="text-gray-400" />
          <span className="font-mono font-bold text-gray-900 text-sm">
            {grn.grnNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "PO Number",
      key: "pONumber",
      render: (_, grn) => (
        <Space className="text-gray-600 text-xs">
          <IconFileText size={14} className="text-gray-400" />
          <span className="font-mono">{grn.poNumber}</span>
        </Space>
      ),
    },
    {
      title: "Supplier",
      key: "supplier",
      render: (_, grn) => (
        <span className="font-semibold text-gray-700 text-sm">
          {grn.supplierName}
        </span>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, grn) => (
        <span className="font-bold text-gray-900">
          Rs {grn.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Received Date",
      key: "receivedDate",
      align: "right",
      render: (_, grn) => (
        <Space className="text-gray-500 text-xs font-bold">
          <IconCalendar size={14} className="text-gray-400" />
          <span>{grn.receivedDate}</span>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, grn) => {
        const style = GRN_STATUS_STYLING[grn.status] || {
          bg: "bg-gray-100",
          text: "text-gray-700",
          dot: "bg-gray-400",
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span>{GRN_STATUS_LABELS[grn.status] || grn.status}</span>
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, grn) => (
        <Link
          to={`/inventory/grn/${grn.id}`}
          className="p-2 hover:bg-gray-100 inline-flex rounded-xl transition-colors text-gray-500 hover:text-black"
        >
          <IconEye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <PageContainer title="Goods Received Notes">
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
                Goods Received Notes
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => navigate("/inventory/grn/create")}
            disabled={!canCreate}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 self-start sm:self-auto"
          >
            New GRN
          </Button>
        </div>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total GRNs
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
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Completed GRNs
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.completed}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <IconCheck size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total Received Value
                  </Typography.Text>
                  <div className="text-2xl font-black text-slate-800 mt-1 truncate">
                    Rs {stats.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
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
            initialValues={{ search: "" }}
            className="w-full p-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search by GRN#, PO#, or supplier..."
                  allowClear
                  className="rounded-xl border-gray-200 h-10 w-full"
                />
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select
                  placeholder="Select Status"
                  allowClear
                  className="h-10 rounded-xl w-full"
                >
                  <Select.Option value="">All Status</Select.Option>
                  {Object.entries(GRN_STATUS_LABELS).map(([value, label]) => (
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

        {/* Table */}
        <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={columns}
            dataSource={filteredGRNs}
            loading={loading}
            rowKey={(r: GRN) => r.id}
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default GRNListPage;
