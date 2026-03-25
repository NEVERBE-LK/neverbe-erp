import React, { useState, useEffect, useCallback } from "react";
import { Modal, Spin, Button, Table, Select, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPlus, IconTrash, IconAdjustments } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// Fluid label style
const labelClass = "block text-xs font-bold text-gray-500 mb-2";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Product {
  id: string;
  label: string;
  variants: {
    variantId: string;
    variantName: string;
    sizes: string[];
  }[];
  availableSizes: string[];
}

interface Stock {
  id: string;
  label: string;
}

interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

const TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: "add", label: "Stock Addition" },
  { value: "remove", label: "Stock Removal" },
  { value: "damage", label: "Damaged Goods" },
  { value: "return", label: "Customer Return" },
  { value: "transfer", label: "Stock Transfer" },
];

interface NewAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAdjustmentModal: React.FC<NewAdjustmentModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { showConfirmation } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown Data
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  // Form State
  const [type, setType] = useState<AdjustmentType>("add");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<AdjustmentItem[]>([]);

  // Item Form State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [stockId, setStockId] = useState("");
  const [destinationStockId, setDestinationStockId] = useState("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [productsRes, stocksRes] = await Promise.all([
        api.get<Product[]>("/api/v1/erp/master/products/dropdown"),
        api.get<Stock[]>("/api/v1/erp/master/stocks/dropdown"),
      ]);
      setProducts(productsRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && currentUser) fetchData();
  }, [open, currentUser, fetchData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setType("add");
      setReason("");
      setNotes("");
      setItems([]);
      setSelectedProduct("");
      setSelectedVariant("");
      setSize("");
      setQuantity(1);
      setStockId("");
      setDestinationStockId("");
    }
  }, [open]);

  const handleAddItem = () => {
    if (!selectedProduct || !size || quantity <= 0 || !stockId) {
      toast("Please fill all item fields");
      return;
    }

    if (type === "transfer" && !destinationStockId) {
      toast.error("Please select destination stock for transfer");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    const stock = stocks.find((s) => s.id === stockId);
    const destStock = stocks.find((s) => s.id === destinationStockId);

    let variantName = "";
    if (selectedVariant && product) {
      const v = product.variants.find((v) => v.variantId === selectedVariant);
      if (v) variantName = v.variantName;
    }

    if (!product || !stock) return;

    const newItem: AdjustmentItem = {
      productId: product.id,
      productName: product.label,
      variantId: selectedVariant || undefined,
      variantName: variantName || undefined,
      size,
      quantity,
      stockId: stock.id,
      stockName: stock.label,
      ...(type === "transfer" && destStock
        ? {
            destinationStockId: destStock.id,
            destinationStockName: destStock.label,
          }
        : {}),
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setSize("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!reason.trim()) {
      toast("Please enter a reason");
      return;
    }
    if (items.length === 0) {
      toast("Please add at least one item");
      return;
    }

    const actionText = status === "DRAFT" ? "SAVE DRAFT" : "SUBMIT ADJUSTMENT";

    showConfirmation({
      title: `${actionText}?`,
      message: `Are you sure you want to ${status === "DRAFT" ? "save this as a draft" : "submit this adjustment"}? Total items: ${items.length}`,
      variant: "default",
      onSuccess: async () => {
        setSaving(true);
        try {
          const fd = new FormData();
          fd.append(
            "data",
            JSON.stringify({
              type,
              reason,
              notes,
              items,
              status,
            }),
          );
          await api.post("/api/v1/erp/inventory/adjustments", fd);
          toast.success(
            `Adjustment ${status === "DRAFT" ? "saved as draft" : "submitted"}`,
          );
          onSuccess();
        } catch (error) {
          console.error(error);
          toast.error("Failed to create adjustment");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const getAvailableSizes = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return [];

    if (selectedVariant) {
      const v = product.variants.find((v) => v.variantId === selectedVariant);
      return v ? v.sizes : [];
    }

    if (product.variants && product.variants.length > 0) return [];
    return product.availableSizes || [];
  };

  const currentProduct = products.find((p) => p.id === selectedProduct);
  const showVariantSelect =
    currentProduct &&
    currentProduct.variants &&
    currentProduct.variants.length > 0;
  const availableSizes = getAvailableSizes();

  const columns: ColumnsType<AdjustmentItem> = [
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
      title: "Qty",
      key: "qty",
      render: (_, item) => (
        <span
          className={`font-bold text-xs ${type === "add" || type === "return" ? "text-green-600" : "text-red-600"}`}
        >
          {type === "add" || type === "return" ? "+" : "-"}
          {item.quantity}
        </span>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-900">
            {item.stockName}
          </span>
          {type === "transfer" && (
            <span className="text-[10px] text-purple-600">
              → {item.destinationStockName}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, __, idx) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<IconTrash size={14} />}
          onClick={() => handleRemoveItem(idx as number)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <IconAdjustments size={20} className="text-green-600" />
          <span className="text-xl font-bold tracking-tight">
            New Inventory Adjustment
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1000}
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
          {/* Header Info */}
          <div className="bg-white p-5 border border-gray-100 rounded-2xl">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-50 pb-2">
              Adjustment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Adjustment Type *</label>
                <Select
                  className="w-full"
                  value={type}
                  onChange={(val) => {
                    setType(val as AdjustmentType);
                    setItems([]); // Clear items if type changes to prevent confusion
                  }}
                  options={TYPE_OPTIONS}
                />
              </div>
              <div>
                <label className={labelClass}>Reason *</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Physical count correction"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional additional notes..."
                size="small"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Item Entry */}
              <div className="bg-gray-50 p-5 border border-gray-100 rounded-2xl">
                <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Add Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Product</label>
                    <Select
                      className="w-full"
                      showSearch
                      optionFilterProp="children"
                      placeholder="Select Product"
                      value={selectedProduct || undefined}
                      onChange={(val) => {
                        setSelectedProduct(val);
                        setSelectedVariant("");
                        setSize("");
                      }}
                      options={products.map((p) => ({
                        value: p.id,
                        label: p.label,
                      }))}
                    />
                  </div>
                  {showVariantSelect && (
                    <div>
                      <label className={labelClass}>Variant</label>
                      <Select
                        className="w-full"
                        placeholder="Select Variant"
                        value={selectedVariant || undefined}
                        onChange={(val) => {
                          setSelectedVariant(val);
                          setSize("");
                        }}
                        options={currentProduct?.variants.map((v) => ({
                          value: v.variantId,
                          label: v.variantName,
                        }))}
                      />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Size</label>
                    <Select
                      className="w-full"
                      placeholder="Select Size"
                      value={size || undefined}
                      onChange={setSize}
                      disabled={
                        !selectedProduct ||
                        (showVariantSelect && !selectedVariant)
                      }
                      options={availableSizes.map((s) => ({
                        value: s,
                        label: s,
                      }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <InputNumber
                      className="w-full"
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(Number(val))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Source Stock Location</label>
                    <Select
                      className="w-full"
                      placeholder="Select Stock"
                      value={stockId || undefined}
                      onChange={setStockId}
                      options={stocks.map((s) => ({
                        value: s.id,
                        label: s.label,
                      }))}
                    />
                  </div>
                  {type === "transfer" && (
                    <div>
                      <label className={labelClass}>
                        Destination Stock Location
                      </label>
                      <Select
                        className="w-full"
                        placeholder="Select To Stock"
                        value={destinationStockId || undefined}
                        onChange={setDestinationStockId}
                        options={stocks
                          .filter((s) => s.id !== stockId)
                          .map((s) => ({ value: s.id, label: s.label }))}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    type="primary"
                    icon={<IconPlus size={16} />}
                    onClick={handleAddItem}
                    block
                    className="h-10 rounded-xl"
                  >
                    Add Item to Adjustment
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden min-h-[200px]">
                <Table
                  bordered
                  scroll={{ y: 300, x: 800 }}
                  columns={columns}
                  dataSource={items}
                  size="small"
                  rowKey={(_, idx) => idx as number}
                  pagination={false}
                />
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-4">
              <div className="bg-green-600 text-white p-6 rounded-2xl">
                <h4 className="text-[10px] font-bold mb-1 uppercase opacity-70">
                  Total Items
                </h4>
                <div className="text-3xl font-bold tracking-tight leading-none">
                  {items.length}
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-5 space-y-3 rounded-2xl">
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<IconAdjustments size={18} />}
                  onClick={() => handleSave("SUBMITTED")}
                  loading={saving}
                  className="h-14 rounded-xl font-bold"
                >
                  SUBMIT ADJUSTMENT
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
                  onClick={onClose}
                  disabled={saving}
                  className="border-none text-gray-400 text-xs hover:text-gray-600"
                >
                  Discard Changes
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-800 font-bold leading-relaxed">
                Adjustments directly update inventory levels. Please ensure
                accuracy before submitting.
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NewAdjustmentModal;
