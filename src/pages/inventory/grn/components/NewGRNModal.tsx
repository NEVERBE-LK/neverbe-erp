import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Spin,
  Table,
  Button,
  Select,
  Input,
  InputNumber,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPackage, IconShoppingCart } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// Fluid label style
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

interface NewGRNModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPOId?: string;
}

const NewGRNModal: React.FC<NewGRNModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialPOId,
}) => {
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [selectedPOId, setSelectedPOId] = useState(initialPOId || "");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Default fields
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
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
        receivedQuantity: item.quantity - (item.receivedQuantity || 0), // Default to remaining qty
        unitCost: item.unitCost,
        stockId: defaultStockId,
      }));

      setItems(grnItems);
    },
    [],
  );

  useEffect(() => {
    if (!open || !currentUser) return;

    const initData = async () => {
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

        const targetId = selectedPOId || initialPOId;
        if (targetId) {
          const po = posRes.data.find((p) => p.id === targetId);
          if (po) loadPOItems(po, stocksRes.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [open, currentUser, initialPOId]); // Added initialPOId but removed fetchData and state deps

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPOId("");
      setSelectedPO(null);
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setItems([]);
    }
  }, [open]);

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

  const handleSave = async () => {
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

    showConfirmation({
      title: "CONFIRM GRN CREATION?",
      message: `Are you sure you want to receive these goods? Total Value: Rs ${totalAmount.toLocaleString()}. This will update inventory levels.`,
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

          toast.success("GRN CREATED SUCCESSFULLY");
          onSuccess();
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
      title: "Rem.",
      key: "rem",
      align: "center",
      render: (_, i) => (
        <span className="text-[10px] font-bold text-gray-400">
          {i.orderedQuantity - i.previouslyReceived}
        </span>
      ),
    },
    {
      title: "Receiving",
      key: "receiving",
      render: (_, item, index) => {
        const remaining = item.orderedQuantity - item.previouslyReceived;
        return (
          <InputNumber
            min={0}
            max={remaining}
            value={item.receivedQuantity}
            onChange={(val) => handleQuantityChange(index, Number(val))}
            className="w-20"
            size="small"
          />
        );
      },
    },
    {
      title: "Location",
      key: "location",
      render: (_, item, index) => (
        <Select
          className="w-32"
          size="small"
          placeholder="Location"
          value={item.stockId || undefined}
          onChange={(val) => handleStockChange(index, val)}
          options={stocks.map((s) => ({ value: s.id, label: s.label }))}
        />
      ),
    },
    {
      title: "Total",
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
    <Modal
      title={
        <div className="flex items-center gap-2">
          <IconPackage size={20} className="text-green-600" />
          <span className="text-xl font-bold tracking-tight">
            Receive Goods (GRN)
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={null}
      centered
      bodyStyle={{ padding: "24px", maxHeight: "85vh", overflowY: "auto" }}
      className="fluid-modal"
    >
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
                  className="w-full"
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
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400 transition-colors bg-[#f5f5f5]"
                />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  size="small"
                />
              </div>
            </div>
          </div>

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
                    icon={<IconPackage size={18} />}
                    onClick={handleSave}
                    loading={saving}
                    className="h-14 rounded-xl font-bold"
                  >
                    CONFIRM RECEIPT
                  </Button>
                  <Button
                    block
                    onClick={onClose}
                    disabled={saving}
                    className="border-none text-gray-400 text-xs hover:text-gray-600"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-800 font-bold leading-relaxed">
                  Receipt will update inventory levels and mark items as
                  received in the PO.
                </div>
              </div>
            </div>
          )}

          {!selectedPO && !loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <IconShoppingCart size={40} className="text-gray-300 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Select an order to begin
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default NewGRNModal;
