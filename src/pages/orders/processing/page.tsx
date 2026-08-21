import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconTruck,
  IconEye,
  IconPrinter,
  IconSearch,
  IconFilter,
  IconRotate,
  IconCircleX,
  IconDotsVertical,
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
import { ProcessOrderModal } from "../components/ProcessOrderModal";
import { ProcessReturnModal } from "../components/ProcessReturnModal";
import { ProcessCancelModal } from "../components/ProcessCancelModal";
import { BulkProcessOrdersModal } from "../components/BulkProcessOrdersModal";

export const ProcessOrdersPage = () => {
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
  const [isBulkProcessOpen, setIsBulkProcessOpen] = useState(false);

  // Action Modals State
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [isProcessOrderOpen, setIsProcessOrderOpen] = useState(false);
  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [isProcessCancelOpen, setIsProcessCancelOpen] = useState(false);

  // Invoice Preview State
  const [previewOrderForInvoice, setPreviewOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    fetchProcessingOrders(1);
  }, []);

  const fetchProcessingOrders = async (page = 1) => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: pagination.pageSize,
        status: "Processing",
        from: "website",
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/api/v1/erp/orders", { params });
      const list = res.data?.data || res.data?.dataList || res.data || [];
      const totalCount = res.data?.total || list.length;

      setOrders(Array.isArray(list) ? list : []);
      setPagination((prev) => ({ ...prev, current: page, total: totalCount }));
    } catch (err: any) {
      console.error("Fetch process orders error:", err);
      toast.error(err.message || "Failed to fetch orders requiring processing");
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
      title: "Logistics",
      key: "logistics",
      width: 160,
      render: (_, record) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{record.courier || "Domex"}</span>
          <span className="text-[10px] text-text-sub">{record.trackingNumber || "No Waybill"}</span>
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      width: 130,
      render: (_, record) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-bold text-text-main dark:text-text-main-dark">
            Rs. {(record.total || 0).toLocaleString("en-LK")}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">{record.paymentMethod || "COD"} ({record.paymentStatus})</span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {record.status || "Processing"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, order) => {
        const items: MenuProps["items"] = [
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
            label: <span className="font-bold text-emerald-600 dark:text-emerald-400">Process Order</span>,
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
              icon={<IconTruck size={14} />}
              onClick={() => {
                setSelectedOrderForAction(order);
                setIsProcessOrderOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg border-none shadow-2xs h-8 px-3 cursor-pointer"
            >
              Process
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
    <PageContainer title="Process Orders | Fulfill & Dispatch Website Orders">
      <div className="w-full space-y-5">
        {/* Header & Controls Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <IconTruck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main dark:text-text-main-dark tracking-tight leading-tight">
                Process Orders
              </h2>
              <p className="text-xs text-text-sub font-mono">
                Website orders requiring courier fulfillment & tracking assignment ({pagination.total} pending)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search Order ID, Phone, Customer..."
              prefix={<IconSearch size={16} className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => fetchProcessingOrders(1)}
              className="w-full md:w-64 h-10 rounded-xl font-mono text-xs"
            />
          </div>
        </div>

        {/* Bulk Action Floating Bar */}
        {selectedRowKeys.length > 0 && (
          <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-2xl p-4 shadow-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-mono text-xs font-bold">
                {selectedRowKeys.length} Selected
              </span>
              <span className="text-xs font-semibold">
                Ready for line-by-line bulk dispatch & fulfillment
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                icon={<IconTruck size={16} />}
                onClick={() => setIsBulkProcessOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 border-none shadow-md cursor-pointer"
              >
                Bulk Process ({selectedRowKeys.length})
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
                onChange: (page) => fetchProcessingOrders(page),
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

      <BulkProcessOrdersModal
        open={isBulkProcessOpen}
        selectedOrders={orders.filter((o) => selectedRowKeys.includes(o.orderId))}
        onClose={() => setIsBulkProcessOpen(false)}
        onSuccess={() => {
          setSelectedRowKeys([]);
          fetchProcessingOrders(pagination.current);
        }}
      />

      <ProcessOrderModal
        open={isProcessOrderOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessOrderOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchProcessingOrders(pagination.current)}
      />

      <ProcessReturnModal
        open={isProcessReturnOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessReturnOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchProcessingOrders(pagination.current)}
      />

      <ProcessCancelModal
        open={isProcessCancelOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsProcessCancelOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSuccess={() => fetchProcessingOrders(pagination.current)}
      />
    </PageContainer>
  );
};

export default ProcessOrdersPage;
