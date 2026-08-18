import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Table,
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  DatePicker,
  Descriptions,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPackage, IconShoppingCart, IconInfoCircle } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { dayjs } from "@/utils/dateUtils";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import Spinner from "@/pages/components/shared/Spinner";

// Fluid label style
const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2";

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
  }, [open, currentUser, initialPOId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPOId("");
      setSelectedPO(null);
      setReceivedDate(dayjs().format("YYYY-MM-DD"));
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
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{i.productName}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
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
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
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
            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100"
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
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
          Rs {(item.receivedQuantity * item.unitCost).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-1.5 h-6 bg-slate-900 dark:bg-slate-100 rounded-full" />
          <IconPackage size={20} className="text-slate-700 dark:text-slate-300" />
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Receive Goods (GRN)
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={null}
      centered
      styles={{ body: { padding: "24px 0", maxHeight: "85vh", overflowY: "auto" } }}
      className="fluid-modal"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
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
                  className="w-full h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100"
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
                  className="rounded-lg h-10 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* PO Summary Card */}
          {selectedPO && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <IconInfoCircle size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider font-mono">
                  Purchase Order Details
                </span>
              </div>
              <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} className="p-2">
                <Descriptions.Item label={<span className="font-semibold text-slate-500 dark:text-slate-400">PO Number</span>}>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPO.poNumber}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="font-semibold text-slate-500 dark:text-slate-400">Supplier</span>}>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPO.supplierName}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="font-semibold text-slate-500 dark:text-slate-400">Expected Date</span>}>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPO.expectedDate || "Not Specified"}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* Items Table */}
          {selectedPO && items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden min-h-[200px] [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                      Items to Receive
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                      {items.length} Items
                    </span>
                  </div>
                  <Table
                    bordered={false}
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
                <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-5 rounded-2xl shadow-xs">
                  <h4 className="text-[10px] font-bold mb-1 uppercase opacity-80 font-mono tracking-wider">
                    Received Value
                  </h4>
                  <div className="text-3xl font-bold tracking-tight leading-none">
                    Rs {totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 rounded-2xl shadow-xs">
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => handleSave("SUBMITTED")}
                    loading={saving}
                    className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-12 shadow-xs cursor-pointer transition-all border-none"
                  >
                    Submit for Review
                  </Button>
                  <Button
                    size="large"
                    block
                    onClick={() => handleSave("DRAFT")}
                    disabled={saving}
                    className="h-12 rounded-xl font-semibold text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    block
                    onClick={onClose}
                    disabled={saving}
                    className="border-none text-slate-400 dark:text-slate-500 text-xs hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl text-[10px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                  GRN will be sent for approval. Inventory will only be updated once approved by an authorized manager.
                </div>
              </div>
            </div>
          )}

          {!selectedPO && !loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-medium">
              <IconShoppingCart size={40} className="text-slate-300 dark:text-slate-600 mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest font-mono">
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

