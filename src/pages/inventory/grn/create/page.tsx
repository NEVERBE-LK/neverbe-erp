import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Spin,
  Table,
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  DatePicker,
  Card,
  Descriptions,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPackage, IconShoppingCart, IconInfoCircle } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { dayjs } from "@/utils/dateUtils";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const labelClass = "block text-xs font-bold text-gray-500 mb-2";

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  stockId?: string;
  expectedDate?: string;
}

interface Stock {
  id: string;
  label: string;
}

interface GRNItemInput {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  previouslyReceived: number;
  unitCost: number;
  stockId: string;
}

const CreateGRNPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poIdParam = searchParams.get("poId") || "";

  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [selectedPOId, setSelectedPOId] = useState(poIdParam);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Default fields
  const [receivedDate, setReceivedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GRNItemInput[]>([]);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const loadPOItems = useCallback(
    (po: PurchaseOrder, currentStocks: Stock[]) => {
      setSelectedPO(po);
      const defaultStockId =
        po.stockId || (currentStocks.length > 0 ? currentStocks[0].id : "");

      const grnItems: GRNItemInput[] = po.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        size: item.size,
        orderedQuantity: item.quantity,
        previouslyReceived: item.receivedQuantity || 0,
        receivedQuantity: item.quantity - (item.receivedQuantity || 0),
        unitCost: item.unitCost,
        stockId: defaultStockId,
      }));

      setItems(grnItems);
    },
    [],
  );

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const [posRes, stocksRes] = await Promise.all([
        api.get<PurchaseOrder[]>(
          "/api/v1/erp/procurement/purchase-orders?pending=true",
        ),
        api.get<Stock[]>("/api/v1/erp/master/stocks/dropdown"),
      ]);

      setPendingPOs(posRes.data);
      setStocks(stocksRes.data);

      const targetId = selectedPOId || poIdParam;
      if (targetId) {
        const po = posRes.data.find((p) => p.id === targetId);
        if (po) {
          loadPOItems(po, stocksRes.data);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedPOId, poIdParam, loadPOItems]);

  useEffect(() => {
    if (currentUser) initData();
  }, [currentUser, initData]);

  const handlePOChange = (poId: string) => {
    setSelectedPOId(poId);
    const po = pendingPOs.find((p) => p.id === poId);
    if (po) {
      loadPOItems(po, stocks);
    } else {
      setSelectedPO(null);
      setItems([]);
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const remaining =
      items[index].orderedQuantity - items[index].previouslyReceived;
    const qty = Math.max(0, Math.min(value, remaining));

    setItems(
      items.map((item, i) =>
        i === index ? { ...item, receivedQuantity: qty } : item,
      ),
    );
  };

  const handleStockChange = (index: number, value: string) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, stockId: value } : item,
      ),
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0,
  );

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!selectedPO) {
      toast("Please select a purchase order");
      return;
    }

    const validItems = items.filter((item) => item.receivedQuantity > 0);
    if (validItems.length === 0) {
      toast("Please enter received quantities");
      return;
    }

    for (const item of validItems) {
      if (!item.stockId) {
        toast.error(`Please select stock location for ${item.productName}`);
        return;
      }
    }

    const action = status === "DRAFT" ? "Save Draft" : "Submit";

    showConfirmation({
      title: `${action.toUpperCase()} GRN?`,
      message: `Are you sure you want to ${
        status === "DRAFT" ? "save this draft" : "submit this GRN for review"
      }? Total Value: Rs ${totalAmount.toLocaleString()}`,
      variant: "default",
      onSuccess: async () => {
        setSaving(true);
        try {
          const fd = new FormData();
          fd.append(
            "data",
            JSON.stringify({
              purchaseOrderId: selectedPO.id,
              poNumber: selectedPO.poNumber,
              supplierId: selectedPO.supplierId,
              supplierName: selectedPO.supplierName,
              receivedDate,
              notes,
              status,
              items: validItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                variantId: item.variantId,
                variantName: item.variantName,
                size: item.size,
                orderedQuantity: item.orderedQuantity,
                receivedQuantity: item.receivedQuantity,
                unitCost: item.unitCost,
                totalCost: item.receivedQuantity * item.unitCost,
                stockId: item.stockId,
              })),
            }),
          );

          await api.post("/api/v1/erp/inventory/grn", fd);

          toast.success(status === "DRAFT" ? "GRN SAVED AS DRAFT" : "GRN SUBMITTED FOR REVIEW");
          navigate("/inventory/grn");
        } catch (error) {
          console.error(error);
          toast.error("Failed to create GRN");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ColumnsType<GRNItemInput> = [
    {
      title: "Product / Variant",
      key: "product",
      render: (_, i) => (
        <div className="flex flex-col">
          <span className="font-bold text-black text-xs">{i.productName}</span>
          <span className="text-[10px] text-gray-500">
            {i.variantName ? `${i.variantName} / ` : ""}
            {i.size}
          </span>
        </div>
      ),
    },
    {
      title: "Remaining",
      key: "rem",
      align: "center",
      render: (_, i) => (
        <span className="text-[10px] font-bold text-gray-400">
          {i.orderedQuantity - i.previouslyReceived}
        </span>
      ),
    },
    {
      title: "Receiving Qty",
      key: "receiving",
      render: (_, item, index) => {
        const remaining = item.orderedQuantity - item.previouslyReceived;
        return (
          <InputNumber
            min={0}
            max={remaining}
            value={item.receivedQuantity}
            onChange={(val) => handleQuantityChange(index, Number(val))}
            className="w-full rounded-lg"
            size="middle"
          />
        );
      },
    },
    {
      title: "Warehouse Location",
      key: "location",
      render: (_, item, index) => (
        <Select
          className="w-full h-10 rounded-lg"
          size="middle"
          placeholder="Select Location"
          value={item.stockId || undefined}
          onChange={(val) => handleStockChange(index, val)}
          options={stocks.map((s) => ({ value: s.id, label: s.label }))}
        />
      ),
    },
    {
      title: "Line Total",
      key: "total",
      align: "right",
      render: (_, item) => (
        <span className="font-bold text-xs">
          Rs {(item.receivedQuantity * item.unitCost).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="New Goods Received Note">
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
                Create GRN
              </h2>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Selection */}
            <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-50 pb-2">
                Purchase Order Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Purchase Order *</label>
                  <Select
                    className="w-full h-10 rounded-lg"
                    showSearch
                    optionFilterProp="children"
                    placeholder="Select Pending Order"
                    value={selectedPOId || undefined}
                    onChange={handlePOChange}
                    options={pendingPOs.map((po) => ({
                      value: po.id,
                      label: `${po.poNumber} - ${po.supplierName}`,
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Received Date</label>
                  <DatePicker
                    className="w-full h-10 rounded-lg"
                    placeholder="Select Date"
                    value={receivedDate ? dayjs(receivedDate) : null}
                    onChange={(_, dateString) =>
                      setReceivedDate(
                        Array.isArray(dateString) ? dateString[0] : dateString,
                      )
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="rounded-lg h-10"
                  />
                </div>
              </div>
            </div>

            {/* PO Summary Card */}
            {selectedPO && (
              <Card
                size="small"
                className="border-none bg-blue-50/40 rounded-2xl"
                title={
                  <Space>
                    <IconInfoCircle size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Purchase Order Details
                    </span>
                  </Space>
                }
              >
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} className="p-2">
                  <Descriptions.Item label={<span className="font-bold text-gray-500">PO Number</span>}>
                    <span className="font-mono font-bold text-gray-900">{selectedPO.poNumber}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-500">Supplier</span>}>
                    <span className="font-bold text-gray-900">{selectedPO.supplierName}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-bold text-gray-500">Expected Date</span>}>
                    <span className="font-bold text-gray-900">{selectedPO.expectedDate || "Not Specified"}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Items Table */}
            {selectedPO && items.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[200px]">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Items to Receive
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {items.length} Items
                      </span>
                    </div>
                    <Table
                      bordered
                      scroll={{ y: 350, x: 800 }}
                      columns={columns}
                      dataSource={items}
                      size="small"
                      rowKey={(r) => r.productId + (r.variantId || "") + r.size}
                      pagination={false}
                    />
                  </div>
                </div>

                {/* Action Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-green-600 text-white p-5 rounded-2xl shadow-lg">
                    <h4 className="text-[10px] font-bold mb-1 uppercase opacity-70">
                      Received Value
                    </h4>
                    <div className="text-3xl font-bold tracking-tight leading-none">
                      Rs {totalAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-4 space-y-3 rounded-2xl shadow-sm">
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={() => handleSave("SUBMITTED")}
                      loading={saving}
                      className="h-12 rounded-xl font-bold"
                    >
                      Submit for Review
                    </Button>
                    <Button
                      size="large"
                      block
                      onClick={() => handleSave("DRAFT")}
                      disabled={saving}
                      className="h-12 rounded-xl font-bold border-gray-100 bg-gray-50"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      block
                      onClick={() => navigate("/inventory/grn")}
                      disabled={saving}
                      className="border-none text-gray-400 text-xs hover:text-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-800 font-bold leading-relaxed">
                    GRN will be sent for approval. Inventory will only be updated once approved by an authorized manager.
                  </div>
                </div>
              </div>
            )}

            {!selectedPO && !loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <IconPackage size={40} className="text-gray-300 mb-2" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Select an order to begin
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CreateGRNPage;
