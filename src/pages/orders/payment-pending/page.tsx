import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconCreditCard,
  IconEye,
  IconPrinter,
  IconSearch,
  IconFilter,
  IconTruck,
  IconRotate,
  IconCircleX,
  IconDotsVertical,
  IconCoin,
  IconShieldX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import { Table, Input, Select, Button, Dropdown, MenuProps, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatSLDateTime } from "@/utils/dateUtils";
import Spinner from "@/pages/components/shared/Spinner";
import { InvoicePreviewModal } from "../[orderId]/components/InvoicePreviewModal";
import { ProcessPaymentModal } from "../components/ProcessPaymentModal";
import { ProcessOrderModal } from "../components/ProcessOrderModal";
import { ProcessReturnModal } from "../components/ProcessReturnModal";
import { ProcessCancelModal } from "../components/ProcessCancelModal";
import { BulkProcessPaymentsModal } from "../components/BulkProcessPaymentsModal";

export const ProcessPaymentsPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Bulk Selection State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);

  // Action Modals State
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [isProcessPaymentOpen, setIsProcessPaymentOpen] = useState(false);
  const [isProcessOrderOpen, setIsProcessOrderOpen] = useState(false);
  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [isProcessCancelOpen, setIsProcessCancelOpen] = useState(false);

  // Invoice Preview State
  const [previewOrderForInvoice, setPreviewOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingPaymentOrders(1);
  }, []);

  const fetchPendingPaymentOrders = async (page = 1) => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: pagination.pageSize,
        payment: "Pending",
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/api/v1/erp/orders", { params });
      const list = res.data?.data || res.data?.dataList || res.data || [];
      const totalCount = res.data?.total || list.length;

      setOrders(Array.isArray(list) ? list : []);
      setPagination((prev) => ({ ...prev, current: page, total: totalCount }));
    } catch (err: any) {
      console.error("Fetch process payments error:", err);
      toast.error(err.message || "Failed to fetch orders with pending payments");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 140,
      render: (id, record) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => navigate(`/orders/${id}/view`)}
            className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline text-left cursor-pointer border-none bg-transparent p-0"
          >
            #{id}
          </button>
          <span className="text-[10px] text-text-sub font-mono">{formatSLDateTime(record.createdAt)}</span>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark truncate">
            {record.customer?.name || "Anonymous Customer"}
          </span>
          <span className="text-[10px] text-text-sub font-mono truncate">{record.customer?.phone || "No Phone"}</span>
          <span className="text-[10px] text-slate-400 truncate">{record.customer?.city || ""}</span>
        </div>
      ),
    },
    {
      title: "Method & Source",
      key: "method",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{record.paymentMethod || "COD / Bank"}</span>
          <span className="text-[10px] text-text-sub uppercase">{record.from || "Website"}</span>
        </div>
      ),
    },
    {
      title: "Total Payable",
      key: "payment",
      width: 140,
      render: (_, record) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-bold text-slate-900 dark:text-white">
            Rs. {(record.total || 0).toLocaleString("en-LK")}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
            Pending Verification
          </span>
        </div>
      ),
    },
    {
      title: "Fulfillment Status",
      key: "status",
      width: 130,
      render: (_, record) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {record.status || "Pending"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, order) => {
        const isWebsiteOrder = (order.from || "").toLowerCase() === "website";

        const items: MenuProps["items"] = [
          {
            key: "process-payment",
            icon: <IconCreditCard size={14} className="text-blue-600 dark:text-blue-400" />,
            label: <span className="font-bold text-blue-600 dark:text-blue-400">Process Payment</span>,
            onClick: () => {
              setSelectedOrderForPayment(order);
              setIsProcessPaymentOpen(true);
            },
          },
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View Details",
            onClick: () => navigate(`/orders/${order.orderId}/view`),
          },
          {
            key: "invoice",
            icon: <IconPrinter size={14} />,
            label: "Print PDF",
            onClick: () => {
              setPreviewOrderForInvoice(order);
              setIsInvoiceModalOpen(true);
            },
          },
          { type: "divider" as const },
          {
            key: "process-order",
            icon: <IconTruck size={14} className="text-emerald-600 dark:text-emerald-400" />,
            label: <span className="font-bold text-emerald-600 dark:text-emerald-400">Process Fulfillment</span>,
            onClick: () => {
              setSelectedOrderForAction(order);
              setIsProcessOrderOpen(true);
            },
          },
          {
            key: "process-cancel",
            icon: <IconCircleX size={14} className="text-rose-600 dark:text-rose-400" />,
            label: <span className="font-bold text-rose-600 dark:text-rose-400">Process Cancel</span>,
            onClick: () => {
              setSelectedOrderForAction(order);
              setIsProcessCancelOpen(true);
            },
          },
        ];

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="primary"
              size="small"
              icon={<IconCreditCard size={14} />}
              onClick={() => {
                setSelectedOrderForPayment(order);
                setIsProcessPaymentOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-none shadow-2xs h-8 px-3 cursor-pointer"
            >
              Process Payment
            </Button>
            <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
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
    <PageContainer title="Process Payments | Verify & Approve Order Payments">
      <div className="w-full space-y-5">
        {/* Header Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <IconCreditCard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main dark:text-text-main-dark tracking-tight leading-tight">
                Process Payments
              </h2>
              <p className="text-xs text-text-sub font-mono">
                Orders with pending payment confirmation ({pagination.total} pending verification)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search Order ID, Phone, Customer..."
              prefix={<IconSearch size={16} className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => fetchPendingPaymentOrders(1)}
              className="w-full md:w-64 h-10 rounded-xl font-mono text-xs"
            />
          </div>
        </div>

        {/* Bulk Action Floating Bar */}
        {selectedRowKeys.length > 0 && (
          <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-2xl p-4 shadow-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-mono text-xs font-bold">
                {selectedRowKeys.length} Selected
              </span>
              <span className="text-xs font-semibold">
                Ready for batch payment approval & status update
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                icon={<IconCreditCard size={16} />}
                onClick={() => setIsBulkPaymentOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 border-none shadow-md cursor-pointer"
              >
                Bulk Process Payments ({selectedRowKeys.length})
              </Button>
              <Button
                onClick={() => setSelectedRowKeys([])}
                className="rounded-xl h-10 px-4 text-xs font-semibold text-slate-300 dark:text-slate-700 hover:text-white border-slate-700 dark:border-slate-300"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden p-4">
          <Spinner spinning={isLoading}>
            <Table
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              columns={columns}
              dataSource={orders}
              rowKey="orderId"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => fetchPendingPaymentOrders(page),
                showSizeChanger: false,
              }}
              scroll={{ x: 750 }}
            />
          </Spinner>
        </div>
      </div>

      <InvoicePreviewModal
        open={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={previewOrderForInvoice}
      />

      <ProcessPaymentModal
        open={isProcessPaymentOpen}
        order={selectedOrderForPayment}
        onClose={() => {
          setIsProcessPaymentOpen(false);
          setSelectedOrderForPayment(null);
        }}
        onSuccess={() => fetchPendingPaymentOrders(pagination.current)}
      />

      <BulkProcessPaymentsModal
        open={isBulkPaymentOpen}
        selectedOrders={orders.filter((o) => selectedRowKeys.includes(o.orderId))}
        onClose={() => setIsBulkPaymentOpen(false)}
        onSuccess={() => {
          setSelectedRowKeys([]);
          fetchPendingPaymentOrders(pagination.current);
        }}
      />

      <ProcessOrderModal
        open={isProcessOrderOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessOrderOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchPendingPaymentOrders(pagination.current)}
      />

      <ProcessReturnModal
        open={isProcessReturnOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessReturnOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchPendingPaymentOrders(pagination.current)}
      />

      <ProcessCancelModal
        open={isProcessCancelOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessCancelOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchPendingPaymentOrders(pagination.current)}
      />
    </PageContainer>
  );
};

export default ProcessPaymentsPage;
