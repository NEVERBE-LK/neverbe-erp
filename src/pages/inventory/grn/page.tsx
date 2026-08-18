import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Space, Table, Select, Col, Row } from "antd";
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
  GRN_STATUS_LABELS,
  GRNStatus,
} from "@/model/GRN";
import Spinner from "@/pages/components/shared/Spinner";

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
  { bg: string; text: string; dot: string; pulse?: boolean }
> = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    pulse: false,
  },
  SUBMITTED: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
    dot: "bg-amber-500",
    pulse: true,
  },
  APPROVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
    pulse: true,
  },
  REJECTED: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
    dot: "bg-rose-500",
    pulse: true,
  },
  COMPLETED: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40",
    dot: "bg-indigo-500",
    pulse: true,
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

  const columns: ColumnsType<GRN> = [
    {
      title: "GRN Number",
      key: "gRNNumber",
      render: (_, grn) => (
        <Space>
          <IconFileText size={16} className="text-slate-400" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
            {grn.grnNumber}
          </span>
        </Space>
      ),
    },
    {
      title: "PO Number",
      key: "pONumber",
      render: (_, grn) => (
        <Space className="text-slate-500 dark:text-slate-400 text-xs">
          <IconFileText size={14} className="text-slate-400" />
          <span className="font-mono">{grn.poNumber}</span>
        </Space>
      ),
    },
    {
      title: "Supplier",
      key: "supplier",
      render: (_, grn) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          {grn.supplierName}
        </span>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, grn) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Rs {grn.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Received Date",
      key: "receivedDate",
      align: "right",
      render: (_, grn) => (
        <Space className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <IconCalendar size={14} className="text-slate-400" />
          <span>{grn.receivedDate}</span>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, grn) => {
        const style = GRN_STATUS_STYLING[grn.status] || {
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
          pulse: false,
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${style.pulse ? "animate-pulse" : ""}`} />
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
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Inventory Control
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Goods Received Notes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {filteredGRNs.length} GRNs
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={() => navigate("/inventory/grn/create")}
            disabled={!canCreate}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2.5 shadow-xs cursor-pointer transition-all h-auto border-none flex items-center gap-2"
          >
            New GRN
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "" }}
            className="w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <Form.Item name="search" label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Search</span>} className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-slate-400" />}
                  placeholder="Search by GRN#, PO#, or supplier..."
                  allowClear
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 h-10 w-full"
                />
              </Form.Item>
              <Form.Item name="status" label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</span>} className="!mb-0">
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
                    className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl px-4 py-2.5 shadow-xs cursor-pointer transition-all h-10 border-none flex-1 flex items-center justify-center gap-1.5"
                  >
                    Filter
                  </Button>
                  <Button
                    icon={<IconX size={15} />}
                    onClick={handleClearFilters}
                    className="rounded-xl h-10 font-semibold text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Table */}
        <Spinner spinning={loading}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 1000 }}
              bordered={false}
              columns={columns}
              dataSource={filteredGRNs}
              rowKey={(r: GRN) => r.id}
              pagination={{ pageSize: 15, position: ["bottomRight"] }}
              size="middle"
              className="rounded-2xl overflow-hidden ant-table-fluid"
            />
          </div>
        </Spinner>
      </div>
    </PageContainer>
  );
};

export default GRNListPage;

