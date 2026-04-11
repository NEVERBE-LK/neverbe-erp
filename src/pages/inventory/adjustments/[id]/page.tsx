import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Button, Tag, Typography, Card, Descriptions } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import dayjs from "dayjs";

const { Text, Title } = Typography;
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_COLORS,
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName?: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  adjustedBy?: string;
  adjustedByName?: string;
  status: AdjustmentStatus;
  createdAt: string;
  updatedAt?: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-100 text-green-800",
  remove: "bg-red-100 text-red-800",
  damage: "bg-orange-100 text-orange-800",
  return: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

const formatDate = (date: any) => {
  if (!date) return "N/A";
  try {
    // If it's a Firestore timestamp object with seconds
    if (
      typeof date === "object" &&
      date !== null &&
      (date.seconds !== undefined || date._seconds !== undefined)
    ) {
      const seconds = date.seconds !== undefined ? date.seconds : date._seconds;
      return dayjs(seconds * 1000).format("DD MMM YYYY, hh:mm A");
    }
    const d = dayjs(date);
    if (!d.isValid()) return String(date);
    return d.format("DD MMM YYYY, hh:mm A");
  } catch (e) {
    return String(date);
  }
};

const ViewAdjustmentPage = () => {
  const { id: adjustmentId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);

  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Adjustment>(
        `/api/v1/erp/inventory/adjustments/${adjustmentId}`,
      );
      setAdjustment(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch adjustment");
    } finally {
      setLoading(false);
    }
  }, [adjustmentId]);

  useEffect(() => {
    if (currentUser && adjustmentId) {
      fetchAdjustment();
    }
  }, [currentUser, adjustmentId, fetchAdjustment]);

  const handleUpdateStatus = (status: AdjustmentStatus) => {
    let message = `Are you sure you want to ${status.toLowerCase()} this adjustment?`;
    let confirmText = "Confirm";
    let variant: "default" | "danger" | "warning" = "default";

    if (status === "APPROVED") {
      message = "Are you sure you want to APPROVE this adjustment? This will mark the review as done, but physical stock will NOT be updated yet.";
      confirmText = "Approve";
      variant = "default";
    } else if (status === "COMPLETED") {
      message = "Are you sure you want to COMPLETE this adjustment? This WILL update your physical inventory levels.";
      confirmText = "Mark as Completed";
      variant = "default";
    } else if (status === "REJECTED") {
      message = "Are you sure you want to REJECT this adjustment?";
      confirmText = "Reject";
      variant = "danger";
    }

    showConfirmation({
      title: `Confirm ${status.toLowerCase()}`,
      message,
      variant,
      confirmText,
      onSuccess: async () => {
        try {
          const formData = new FormData();
          formData.append("data", JSON.stringify({ status }));
          await api.put(
            `/api/v1/erp/inventory/adjustments/${adjustmentId}/status`,
            formData,
          );
          toast.success(`Adjustment ${status.toLowerCase()}`);
          fetchAdjustment(); // Refresh data
        } catch (error) {
          console.error(error);
          toast.error("Failed to update status");
        }
      },
    });
  };

  useEffect(() => {
    if (currentUser && adjustmentId) fetchAdjustment();
  }, [currentUser, adjustmentId]);

  if (loading) {
    return (
      <PageContainer title="Adjustment">
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!adjustment) {
    return (
      <PageContainer title="Adjustment">
        <div className="text-center py-20 text-gray-500">
          Adjustment not found
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<AdjustmentItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => (
        <>
          {item.productName}
          {item.variantName && (
            <span className="block text-xs text-gray-500 font-normal">
              {item.variantName}
            </span>
          )}
        </>
      ),
    },
    { title: "Size", key: "size", render: (_, item) => <>{item.size}</> },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, item) => (
        <>
          <span
            className={`font-bold ${
              adjustment.type === "add" || adjustment.type === "return"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {adjustment.type === "add" || adjustment.type === "return"
              ? "+"
              : "-"}
            {item.quantity}
          </span>
        </>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      render: (_, item) => <>{item.stockName || item.stockId}</>,
    },
    {
      title: "Destination",
      key: "destination",
      render: (_, item) => (
        <>{item.destinationStockName || item.destinationStockId}</>
      ),
    },
  ];

  return (
    <PageContainer title={adjustment.adjustmentNumber}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-gray-100 pb-8">
          <div>
            <Text className="block text-[10px] uppercase font-bold tracking-widest text-green-600 mb-2">
              Inventory Adjustment Overview
            </Text>
            <Title
              level={2}
              className="!m-0 !text-3xl font-black tracking-tight text-gray-900"
            >
              #{adjustment.adjustmentNumber}
            </Title>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Tag
              className={`px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider ${
                ADJUSTMENT_STATUS_COLORS[adjustment.status] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {ADJUSTMENT_STATUS_LABELS[adjustment.status] || adjustment.status}
            </Tag>
            <Tag
              className={`px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider ${TYPE_COLORS[adjustment.type]}`}
            >
              {TYPE_LABELS[adjustment.type]}
            </Tag>

            {adjustment.status === "SUBMITTED" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  danger
                  className="rounded-full px-6 font-bold text-xs uppercase tracking-wider"
                  onClick={() => handleUpdateStatus("REJECTED")}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  className="rounded-full px-6 font-bold text-xs uppercase tracking-wider bg-green-600 hover:bg-green-700 border-none h-auto py-2.5 shadow-none"
                  onClick={() => handleUpdateStatus("APPROVED")}
                >
                  Approve Review
                </Button>
              </div>
            )}

            {adjustment.status === "APPROVED" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  danger
                  className="rounded-full px-6 font-bold text-xs uppercase tracking-wider"
                  onClick={() => handleUpdateStatus("REJECTED")}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  className="rounded-full px-6 font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 border-none h-auto py-2.5 shadow-none"
                  onClick={() => handleUpdateStatus("COMPLETED")}
                >
                  Update Stock (Complete)
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  Inventory Items ({adjustment.items?.length || 0})
                </span>
              }
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none"
              styles={{
                header: {
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                },
              }}
            >
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={adjustment.items}
                  rowKey={(r: any) =>
                    r.productId +
                    (r.variantId || "") +
                    r.size +
                    Math.random().toString()
                  }
                  pagination={false}
                  size="small"
                  className="rounded-xl overflow-hidden ant-table-fluid"
                />
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {adjustment.items?.map((item, idx) => (
                  <div key={idx} className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Text
                          strong
                          className="text-sm text-gray-900 block truncate"
                        >
                          {item.productName}
                        </Text>
                        {item.variantName && (
                          <Text
                            type="secondary"
                            className="text-[10px] block uppercase tracking-wide"
                          >
                            {item.variantName}
                          </Text>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Tag className="m-0 px-2 py-0 text-[10px] font-bold rounded-md bg-gray-50 border-gray-200">
                            SIZE: {item.size}
                          </Tag>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-black ${
                            adjustment.type === "add" ||
                            adjustment.type === "return"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {adjustment.type === "add" ||
                          adjustment.type === "return"
                            ? "+"
                            : "-"}
                          {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="uppercase tracking-widest text-[9px]">
                          Source
                        </span>
                        <span className="text-gray-600 truncate">
                          {item.stockName || item.stockId}
                        </span>
                      </div>
                      {adjustment.type === "transfer" && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                            →
                          </div>
                          <div className="flex flex-col gap-1 flex-1 text-right">
                            <span className="uppercase tracking-widest text-[9px]">
                              Destination
                            </span>
                            <span className="text-gray-600 truncate">
                              {item.destinationStockName ||
                                item.destinationStockId}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Insight */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  Adjustment Insight
                </span>
              }
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none border-t-4 border-t-green-500"
              styles={{
                header: {
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                },
              }}
            >
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{
                  fontWeight: 600,
                  background: "#f8fafc",
                  width: "140px",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#64748b",
                }}
              >
                <Descriptions.Item label="Adjustment Type">
                  <Tag
                    className={`border-none font-bold uppercase text-[10px] ${TYPE_COLORS[adjustment.type]}`}
                  >
                    {TYPE_LABELS[adjustment.type]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Adjustment Reason">
                  <Text
                    strong
                    className="text-gray-900 uppercase text-xs tracking-tight"
                  >
                    {adjustment.reason}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Adjusted By">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-600 border border-green-100">
                      {adjustment.adjustedByName?.charAt(0) || "S"}
                    </div>
                    <Text className="text-xs font-bold text-gray-700">
                      {adjustment.adjustedByName || "System Process"}
                    </Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Impacted Items">
                  <Text className="text-xl font-black text-green-700">
                    {adjustment.items?.length || 0}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  <Text className="text-xs text-gray-600">
                    {formatDate(adjustment.createdAt)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Update">
                  <Text className="text-xs text-gray-600">
                    {formatDate(adjustment.updatedAt)}
                  </Text>
                </Descriptions.Item>
                {adjustment.notes && (
                  <Descriptions.Item label="Auditor Notes">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 border-dashed">
                      <Text className="text-sm text-gray-600 leading-relaxed italic">
                        "{adjustment.notes}"
                      </Text>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewAdjustmentPage;
