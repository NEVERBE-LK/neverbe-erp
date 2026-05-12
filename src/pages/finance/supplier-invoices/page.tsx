import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Table,
  Tag,
  Tooltip,
  Modal,
  Badge,
  Descriptions,
} from "antd";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCalendar,
  IconFileInvoice,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import SupplierInvoiceFormModal from "./components/SupplierInvoiceFormModal";
import SupplierPaymentModal from "./components/SupplierPaymentModal";

const SupplierInvoicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [summary, setSummary] = useState({
    overdue: 0,
    due7Days: 0,
    totalPayable: 0,
    count: 0,
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(
    null,
  );
  const [paymentInvoice, setPaymentInvoice] = useState<SupplierInvoice | null>(
    null,
  );
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: any) => {
    setSearch(values.search || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get<SupplierInvoice[]>("/api/v1/erp/finance/supplier-invoices"),
        api.get("/api/v1/erp/finance/supplier-invoices?summary=true"),
      ]);
      setInvoices(listRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchInvoices();
  }, [currentUser]);

  const handleCreate = () => {
    setEditingInvoice(null);
    setShowModal(true);
  };

  const handleEdit = (inv: SupplierInvoice) => {
    setEditingInvoice(inv);
    setShowModal(true);
  };

  const handlePay = (inv: SupplierInvoice) => {
    setPaymentInvoice(inv);
    setShowPaymentModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.delete(`/api/v1/erp/finance/supplier-invoices/${id}`);
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const formatCurrency = (amount: number) => `Rs ${amount.toLocaleString()}`;
  const formatDate = (date: any) => {
    return date || "-";
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplierName.toLowerCase().includes(search.toLowerCase()),
  );
  const columns: ColumnsType<SupplierInvoice> = [
    {
      title: "Invoice Details",
      key: "details",
      render: (_, inv) => (
        <div>
          <div className="font-bold text-gray-900">{inv.invoiceNumber}</div>
          <div className="text-xs text-gray-500 tracking-wide">
            {inv.supplierName}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Issued: {formatDate(inv.issueDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "PAID") color = "green";
        else if (status === "OVERDUE") color = "red";
        else if (status === "PARTIAL") color = "orange";

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount) => (
        <span className="font-medium">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (balance) => (
        <span className="font-bold">{formatCurrency(balance)}</span>
      ),
    },
    {
      title: "Due Date",
      key: "due",
      align: "center",
      render: (_, inv) => {
        const isOverdue =
          new Date(inv.dueDate as any).getTime() < Date.now() &&
          inv.balance > 0;
        return (
          <div
            className={`flex items-center justify-center gap-1 ${isOverdue ? "text-red-600 font-bold" : "text-gray-600"}`}
          >
            <IconCalendar size={14} />
            {formatDate(inv.dueDate)}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, inv) => (
        <Space>
          {inv.status !== "PAID" && (
            <Button size="small" type="primary" onClick={() => handlePay(inv)}>
              PAY
            </Button>
          )}
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => handleEdit(inv)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDelete(inv.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Accounts Payable">
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Finance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Supplier Invoices
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            New Invoice
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-600 text-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <IconAlertCircle size={16} />
              <span className="text-xs font-bold  ">Overdue</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.overdue)}
            </p>
            <p className="text-xs text-red-400 mt-1 font-bold">
              Requires Immediate Attention
            </p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <IconClock size={16} />
              <span className="text-xs font-bold  ">Due in 7 Days</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.due7Days)}
            </p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <IconFileInvoice size={16} />
              <span className="text-xs font-bold  ">Total Payable</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.totalPayable)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {summary.count} Unpaid Invoices
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search Invoice # or Supplier..."
                allowClear
              />
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
        <Table
          scroll={{ x: 1000 }}
          bordered
          columns={columns}
          dataSource={filteredInvoices}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, position: ["bottomRight"] }}
        />

        <SupplierInvoiceFormModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={fetchInvoices}
          invoice={editingInvoice}
        />

        <SupplierPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={fetchInvoices}
          invoice={paymentInvoice}
        />
      </Space>
    </PageContainer>
  );
};

export default SupplierInvoicesPage;
