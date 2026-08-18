import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Table, Select, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPlus,
  IconTrash,
  IconAdjustments,
  IconPackage,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconRotateDot,
  IconArrowsExchange,
} from "@tabler/icons-react";
import api from "@/lib/api";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// Fluid label style
const labelClass =
  "block text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Product {
  id: string;
  label: string;
  variants: {
    variantId: string;
    variantName: string;
    sizes: string[];
    images?: { url: string; file?: string; order?: number }[];
  }[];
  availableSizes: string[];
  buyingPrice?: number;
  sellingPrice?: number;
  thumbnail?: { url: string; file: string; order: number };
  brand?: string;
  category?: string;
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

const TYPE_CONFIG: Record<
  AdjustmentType,
  { label: string; icon: React.ReactNode; color: string; activeClass: string }
> = {
  add: {
    label: "Stock Addition",
    icon: <IconTrendingUp size={16} />,
    color: "emerald",
    activeClass:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-xs",
  },
  remove: {
    label: "Stock Removal",
    icon: <IconTrendingDown size={16} />,
    color: "rose",
    activeClass:
      "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-xs",
  },
  damage: {
    label: "Damaged Goods",
    icon: <IconAlertTriangle size={16} />,
    color: "amber",
    activeClass:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-xs",
  },
  return: {
    label: "Customer Return",
    icon: <IconRotateDot size={16} />,
    color: "blue",
    activeClass:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-xs",
  },
  transfer: {
    label: "Stock Transfer",
    icon: <IconArrowsExchange size={16} />,
    color: "purple",
    activeClass:
      "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700 shadow-xs",
  },
};

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
  const [currentStockQty, setCurrentStockQty] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  useEffect(() => {
    const fetchQty = async () => {
      if (!selectedProduct || !size || !stockId) {
        setCurrentStockQty(null);
        return;
      }
      setLoadingStock(true);
      try {
        const response = await api.get("/api/v1/erp/inventory/check-quantity", {
          params: {
            productId: selectedProduct,
            variantId: selectedVariant || undefined,
            size,
            stockId,
          },
        });
        setCurrentStockQty(response.data?.quantity ?? 0);
      } catch {
        setCurrentStockQty(0);
      } finally {
        setLoadingStock(false);
      }
    };
    fetchQty();
  }, [selectedProduct, selectedVariant, size, stockId]);

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
      setCurrentStockQty(null);
      setLoadingStock(false);
    }
  }, [open]);

  const handleAddItem = () => {
    if (!selectedProduct || !size || quantity <= 0 || !stockId) {
      toast.error("Please fill all item fields");
      return;
    }

    if (type === "transfer" && !destinationStockId) {
      toast.error("Please select destination stock location for transfer");
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
      toast.error("Please enter a reason");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
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
          const now = new Date().toISOString();
          const creatorName =
            currentUser?.username || currentUser?.email || "System User";
          const creatorId = currentUser?.userId || "system";

          fd.append(
            "data",
            JSON.stringify({
              type,
              reason,
              notes,
              items,
              status,
              adjustedBy: creatorId,
              adjustedByName: creatorName,
              createdAt: now,
              updatedAt: now,
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

  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProduct) || null;
  }, [selectedProduct, products]);

  const currentVariant = useMemo(() => {
    if (!currentProduct || !selectedVariant) return null;
    return currentProduct.variants.find((v) => v.variantId === selectedVariant) || null;
  }, [selectedVariant, currentProduct]);

  const showVariantSelect =
    !!(currentProduct &&
    currentProduct.variants &&
    currentProduct.variants.length > 0);
  const availableSizes = getAvailableSizes();

  const columns: ColumnsType<AdjustmentItem> = [
    {
      title: "Product / Variant",
      key: "product",
      render: (_, i) => {
        const prod = products.find((p) => p.id === i.productId);
        const variant = prod?.variants.find((v) => v.variantId === i.variantId);
        const imageUrl = variant?.images?.[0]?.url || prod?.thumbnail?.url;

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={i.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconPackage className="text-slate-400 dark:text-slate-600" size={18} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{i.productName}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {i.variantName ? `${i.variantName} / ` : ""}
                {i.size}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Qty",
      key: "qty",
      render: (_, item) => (
        <span
          className={`font-bold text-xs ${type === "add" || type === "return" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
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
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">
            {item.stockName}
          </span>
          {type === "transfer" && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400">
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
        <button
          type="button"
          onClick={() => handleRemoveItem(idx as number)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border-none bg-transparent cursor-pointer"
        >
          <IconTrash size={15} />
        </button>
      ),
    },
  ];

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      width={1050}
      footer={null}
      closable={false}
      centered
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!bg-white [&_.ant-modal-content]:dark:!bg-slate-900 [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-200/80 [&_.ant-modal-content]:dark:!border-slate-800"
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
              Stock Adjustment Builder
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none m-0">
              New Inventory Adjustment
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <IconX size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Top Segment: Adjustment Type Selector */}
          <div>
            <label className={labelClass}>Select Adjustment Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(Object.keys(TYPE_CONFIG) as AdjustmentType[]).map((tKey) => {
                const conf = TYPE_CONFIG[tKey];
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => {
                      setType(tKey);
                      setItems([]);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? conf.activeClass
                        : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{conf.icon}</span>
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Item Builder & Item List Table */}
            <div className="lg:col-span-7 space-y-6">
              {/* Item Builder Box */}
              <div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 mb-2">
                  <span className="w-1.5 h-3.5 bg-slate-900 dark:bg-slate-100 rounded-full" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono m-0">
                    Item Builder
                  </h4>
                </div>

                {/* Product Live Preview Header */}
                {currentProduct && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex gap-3 items-center shadow-xs">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-center">
                      {currentVariant?.images?.[0]?.url || currentProduct?.thumbnail?.url ? (
                        <img
                          src={currentVariant?.images?.[0]?.url || currentProduct?.thumbnail?.url}
                          alt={currentProduct.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconPackage className="text-slate-400 dark:text-slate-600" size={20} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate m-0 leading-tight">
                        {currentProduct.label}
                      </h5>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {currentVariant && (
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                            {currentVariant.variantName}
                          </span>
                        )}
                        {size && (
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Size: {size}
                          </span>
                        )}
                        {currentStockQty !== null && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${currentStockQty > 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"}`}>
                            Current Stock: {currentStockQty}
                          </span>
                        )}
                        {loadingStock && <Spinner size="small" />}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Product</label>
                    <Select
                      className="w-full rounded-xl"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
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
                        className="w-full rounded-xl"
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toString()
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
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
                      className="w-full rounded-xl"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
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
                      className="w-full rounded-xl"
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(Number(val))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Source Stock Location</label>
                    <Select
                      className="w-full rounded-xl"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      placeholder="Select Location"
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
                        Destination Location
                      </label>
                      <Select
                        className="w-full rounded-xl"
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toString()
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        placeholder="Select Destination"
                        value={destinationStockId || undefined}
                        onChange={setDestinationStockId}
                        options={stocks
                          .filter((s) => s.id !== stockId)
                          .map((s) => ({ value: s.id, label: s.label }))}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all border-none"
                  >
                    <IconPlus size={16} />
                    Add Item to Adjustment
                  </button>
                </div>
              </div>

              {/* Items Table Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                    Items List ({items.length})
                  </span>
                </div>

                <Table
                  bordered={false}
                  scroll={{ y: 220, x: 500 }}
                  columns={columns}
                  dataSource={items}
                  size="small"
                  rowKey={(_, idx) => idx as number}
                  pagination={false}
                  className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:dark:!text-slate-400 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3"
                />
              </div>
            </div>

            {/* Right Panel: Reason, Notes & Actions */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                {/* General Info Card */}
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="w-1.5 h-3.5 bg-slate-900 dark:bg-slate-100 rounded-full" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono m-0">
                      Reason & Audit Notes
                    </h4>
                  </div>

                  <div>
                    <label className={labelClass}>Stated Reason *</label>
                    <Input
                      className="h-10 rounded-xl"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Physical count correction"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Auditor Notes</label>
                    <Input.TextArea
                      rows={3}
                      className="rounded-xl"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional additional notes..."
                    />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      Selected Type
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {TYPE_CONFIG[type].label}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      Items Count
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {items.length} SKUs
                    </span>
                  </div>
                </div>

                {/* Notice */}
                <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed flex gap-2">
                  <span className="text-sm leading-none shrink-0">⚠️</span>
                  <span>
                    Stock level updates require approval review before physical stock values change.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSave("SUBMITTED")}
                  disabled={saving}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all border-none disabled:opacity-50"
                >
                  <IconAdjustments size={17} />
                  SUBMIT ADJUSTMENT
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave("DRAFT")}
                    disabled={saving}
                    className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NewAdjustmentModal;

