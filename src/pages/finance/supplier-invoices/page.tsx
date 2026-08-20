import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Form,
  Input,
  Button,
  Table,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconAlertCircle,
  IconClock,
  IconCalendar,
  IconFileInvoice,
  IconFilter,
  IconX,
  IconCreditCard,
  IconDotsVertical,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
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
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<SupplierInvoice | null>(null);
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
  const formatDate = (date: any) => date || "—";

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const renderStatus = (status: string) => {
    const st = status?.toUpperCase();
    switch (st) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PAID
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            OVERDUE
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
            {status || "UNPAID"}
          </span>
        );
    }
  };

  const columns: ColumnsType<SupplierInvoice> = [
    {
      title: "Invoice Details",
      key: "details",
      render: (_, inv) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark font-mono">
            {inv.invoiceNumber}
          </span>
          <span className="text-xs text-text-sub font-semibold">
            {inv.supplierName}
          </span>
          <span className="text-[10px] text-text-sub dark:text-slate-500 font-mono">
            Issued: {formatDate(inv.issueDate)}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatus(status),
    },
    {
      title: "Total Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount) => (
        <span className="font-mono text-xs font-semibold text-text-main dark:text-text-main-dark">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "Balance Due",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (balance) => (
        <span className={`font-mono text-xs font-bold ${balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {formatCurrency(balance)}
        </span>
      ),
    },
    {
      title: "Due Date",
      key: "due",
      align: "center",
      render: (_, inv) => {
        const isOverdue =
          new Date(inv.dueDate as any).getTime() < Date.now() && inv.balance > 0;
        return (
          <div
            className={`flex items-center justify-center gap-1 font-mono text-xs ${
              isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-text-sub"
            }`}
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
      width: 60,
      align: "right",
      render: (_, inv) => {
        const menuItems: MenuProps["items"] = [
          ...(inv.status !== "PAID"
            ? [
                {
                  key: "pay",
                  icon: <IconCreditCard size={14} className="text-emerald-600 dark:text-emerald-400" />,
                  label: (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Record Payment
                    </span>
                  ),
                  onClick: () => handlePay(inv),
                },
                {
                  type: "divider" as const,
                },
              ]
            : []),
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Invoice",
            onClick: () => handleEdit(inv),
          },
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
            label: (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Delete Invoice
              </span>
            ),
            onClick: () => handleDelete(inv.id!),
          },
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Accounts Payable">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Finance / Accounts Payable
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Supplier Invoices
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {invoices.length} Total
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={handleCreate}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            New Invoice
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
              <IconAlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
            </div>
            <p className="text-3xl font-bold text-text-main dark:text-text-main-dark tracking-tight">
              {formatCurrency(summary.overdue)}
            </p>
            <span className="text-[10px] text-rose-500 font-bold uppercase mt-1 block">
              Requires Immediate Attention
            </span>
          </div>

          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
              <IconClock size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Due in 7 Days</span>
            </div>
            <p className="text-3xl font-bold text-text-main dark:text-text-main-dark tracking-tight">
              {formatCurrency(summary.due7Days)}
            </p>
          </div>

          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-text-sub">
              <IconFileInvoice size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Payable</span>
            </div>
            <p className="text-3xl font-bold text-text-main dark:text-text-main-dark tracking-tight">
              {formatCurrency(summary.totalPayable)}
            </p>
            <span className="text-[10px] text-text-sub font-bold uppercase mt-1 block font-sans">
              {summary.count} Unpaid Invoices
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-text-sub" />}
                placeholder="Search Invoice # or Supplier..."
                allowClear
                className="rounded-xl h-10"
              />
            </Form.Item>
            <Form.Item className="!mb-0">
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleClearFilters}
                  className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer"
                >
                  Clear
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="large" tip="Loading Supplier Invoices..." />
          </div>
        ) : (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
            <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
              <Table
                scroll={{ x: 800 }}
                columns={columns}
                dataSource={filteredInvoices}
                rowKey="id"
                pagination={{ pageSize: 10, position: ["bottomRight"] }}
              />
            </div>
          </div>
        )}

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
      </div>
    </PageContainer>
  );
};

export default SupplierInvoicesPage;
