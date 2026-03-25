import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Tag, Card, Descriptions, Typography, Button } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  IconPackage,
  IconSend,
  IconX,
  IconFileInvoice,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  PurchaseOrder,
  PO_STATUS_COLORS,
  PO_STATUS_LABELS,
  PurchaseOrderStatus,
} from "@/model/PurchaseOrder";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const { Text, Title } = Typography;

const ViewPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const poId = params.id as string;
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [po, setPO] = useState<PurchaseOrder | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchPO = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseOrder>(
        `/api/v1/erp/procurement/purchase-orders/${poId}`,
      );
      setPO(res.data);
    } catch (error) {
      console.error(error);
      toast.success("Failed to fetch purchase order");
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    if (currentUser && poId) fetchPO();
  }, [currentUser, poId, fetchPO]);

  const handleUpdateStatus = (status: PurchaseOrderStatus) => {
    const action = status === "SUBMITTED" ? "Submit" : "Cancel Order";
    const isDestructive = status === "REJECTED";

    showConfirmation({
      title: `${action.toUpperCase()}?`,
      message: `Are you sure you want to ${action.toLowerCase()}? ${
        status === "SUBMITTED"
          ? "This will mark the order as sent."
          : "This action cannot be undone."
      }`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdating(true);
        try {
          const fd = new FormData();
          fd.append("data", JSON.stringify({ status }));
          await api.put(`/api/v1/erp/procurement/purchase-orders/${poId}`, fd);
          toast.success(
            `Order ${status === "SUBMITTED" ? "Submitted" : "Cancelled"}`,
          );
          fetchPO();
        } catch (error) {
          console.error(error);
          toast("Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
          <span className="text-xs font-bold   text-gray-400 mt-4">
            Loading Order Details
          </span>
        </div>
      </PageContainer>
    );
  }

  if (!po) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-200 m-8">
          <IconFileInvoice className="text-gray-300 mb-4" size={48} />
          <div className="text-center text-gray-400 font-bold  ">
            Purchase order not found
          </div>
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<any> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => <>{item.productName}</>,
    },
    {
      title: "Variant",
      key: "variant",
      render: (_, item) => <>{item.variantName || "-"}</>,
    },
    {
      title: "Size",
      key: "size",
      align: "center",
      render: (_, item) => <>{item.size}</>,
    },
    {
      title: "Ordered",
      key: "ordered",
      align: "center",
      render: (_, item) => <>{item.quantity}</>,
    },
    {
      title: "Received",
      key: "received",
      render: (_, item) => (
        <>
          <span
            className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
              (item.receivedQuantity || 0) >= item.quantity
                ? "bg-green-100 text-green-700"
                : (item.receivedQuantity || 0) > 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {PO_STATUS_LABELS.COMPLETED}
          </span>
        </>
      ),
    },
    {
      title: "Unit Cost",
      key: "unitCost",
      align: "right",
      render: (_, item) => <>Rs {item.unitCost}</>,
    },
    {
      title: "Total",
      key: "total",
      render: (_, item) => <>Rs {item.totalCost.toLocaleString()}</>,
    },
  ];

  return (
    <PageContainer title={po.poNumber}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
          <div>
            <Text className="block text-[10px] uppercase font-bold tracking-widest text-green-600 mb-2">
              Purchase Order Overview
            </Text>
            <Title
              level={2}
              className="!m-0 !text-3xl font-black tracking-tight text-gray-900"
            >
              #{po.poNumber}
            </Title>
          </div>
          <div className="flex items-center gap-3">
            <Tag
              className={`px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider ${
                PO_STATUS_COLORS[po.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {PO_STATUS_LABELS[po.status] || po.status}
            </Tag>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  Order Items ({po.items?.length || 0})
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
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={po.items}
                  rowKey={(r: any) =>
                    r.productId + (r.variantId || "") + r.size
                  }
                  pagination={false}
                  size="small"
                  className="rounded-xl overflow-hidden ant-table-fluid"
                />
              </div>
            </Card>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
              {po.status === "DRAFT" && (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateStatus("SUBMITTED")}
                    disabled={updating}
                    icon={!updating && <IconSend size={16} />}
                    className="bg-green-600 hover:bg-green-700 border-none rounded-full h-auto py-2.5 px-8 font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    {updating ? <Spin size="small" /> : "Submit"}
                  </Button>
                  <Button
                    danger
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updating}
                    icon={<IconX size={16} />}
                    className="rounded-full h-auto py-2.5 px-8 font-bold text-xs uppercase tracking-widest"
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {(po.status === "SUBMITTED" || po.status === "APPROVED") && (
                <Link to={`/inventory/grn/new?poId=${po.id}`}>
                  <Button
                    type="primary"
                    icon={<IconPackage size={16} />}
                    className="bg-green-600 hover:bg-green-700 border-none rounded-full h-auto py-2.5 px-8 font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Receive Goods (GRN)
                  </Button>
                </Link>
              )}
              {po.status === "COMPLETED" && (
                <div className="flex items-center text-green-700 font-bold text-[10px] uppercase tracking-widest bg-green-50 px-6 py-3 rounded-full border border-green-100">
                  <IconPackage size={16} className="mr-2" />
                  Order Completed
                </div>
              )}
              {po.status === "REJECTED" && (
                <div className="flex items-center text-red-700 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-6 py-3 rounded-full border border-red-100">
                  <IconX size={16} className="mr-2" />
                  Order Cancelled
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Insight */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  PO Insight
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
                <Descriptions.Item label="Supplier">
                  <Text strong className="text-gray-900 uppercase text-[10px]">
                    {po.supplierName}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  <Text className="text-xs font-bold text-gray-700">
                    {po.expectedDate || "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  <Text className="text-xl font-black text-green-700">
                    Rs {po.totalAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  <Text className="text-xs text-gray-600">
                    {po.createdAt ? String(po.createdAt) : "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Update">
                  <Text className="text-xs text-gray-600">
                    {po.updatedAt ? String(po.updatedAt) : "N/A"}
                  </Text>
                </Descriptions.Item>
                {po.notes && (
                  <Descriptions.Item label="PO Notes">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 border-dashed">
                      <Text className="text-sm text-gray-600 leading-relaxed italic">
                        "{po.notes}"
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

export default ViewPurchaseOrderPage;
