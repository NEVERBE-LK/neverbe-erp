import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Table,
  Select,
  Input,
  InputNumber,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPlus, IconTrash, IconShoppingCart, IconTruck } from "@tabler/icons-react";
import Spinner from "@/pages/components/shared/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import dayjs from "dayjs";

// Fluid label style
const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono";

interface Supplier {
  id: string;
  label: string;
}

interface Product {
  id: string;
  label: string;
  buyingPrice?: number;
}

interface Stock {
  id: string;
  label: string;
}

interface Variant {
  id: string;
  label: string;
  sizes?: string[];
}

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface NewPOModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewPOModal: React.FC<NewPOModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { showConfirmation } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [availableVariants, setAvailableVariants] = useState<Variant[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [globalSizes, setGlobalSizes] = useState<string[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [stockId, setStockId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([]);

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [suppliersRes, productsRes, stocksRes, sizesRes] =
        await Promise.all([
          api.get<Supplier[]>(
            "/api/v1/erp/procurement/suppliers?dropdown=true",
          ),
          api.get<Product[]>("/api/v1/erp/master/products/dropdown"),
          api.get<Stock[]>("/api/v1/erp/master/stocks/dropdown"),
          api.get<{ id: string; label: string }[]>(
            "/api/v1/erp/master/sizes/dropdown",
          ),
        ]);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
      setStocks(stocksRes.data);

      const allSizes = sizesRes.data.map((s) => s.label);
      setGlobalSizes(allSizes);
      setAvailableSizes(allSizes);

      const map: Record<string, Product> = {};
      productsRes.data.forEach((p) => {
        map[p.id] = p;
      });
      setProductsMap(map);
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

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!open) {
      setSupplierId("");
      setSupplierName("");
      setStockId("");
      setExpectedDate("");
      setNotes("");
      setItems([]);
      setSelectedProduct("");
      setSelectedVariant("");
      setSelectedSize("");
      setQuantity(1);
      setUnitCost(0);
    }
  }, [open]);

  // Fetch variants when product changes
  useEffect(() => {
    const fetchVariants = async () => {
      setAvailableVariants([]);
      if (selectedProduct) {
        try {
          const variantsRes = await api.get<Variant[]>(
            `/api/v1/erp/master/products/${selectedProduct}/variants/dropdown`,
          );
          setAvailableVariants(variantsRes.data || []);
        } catch (e) {
          console.error("Failed to fetch product variants", e);
        }
      }
    };

    if (selectedProduct) {
      fetchVariants();
    } else {
      setAvailableVariants([]);
    }
    setSelectedVariant("");
    setSelectedSize("");
    setAvailableSizes(globalSizes);
  }, [selectedProduct, globalSizes]);

  // Update sizes when variant changes
  useEffect(() => {
    if (selectedVariant && availableVariants.length > 0) {
      const variant = availableVariants.find((v) => v.id === selectedVariant);
      if (variant && variant.sizes && variant.sizes.length > 0) {
        setAvailableSizes(variant.sizes);
      } else {
        setAvailableSizes(globalSizes);
      }
    } else {
      setAvailableSizes(globalSizes);
    }
  }, [selectedVariant, availableVariants, globalSizes]);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const supplier = suppliers.find((s) => s.id === id);
    setSupplierName(supplier?.label || "");
  };

  const handleProductChange = (id: string) => {
    setSelectedProduct(id);
    const product = productsMap[id];
    setUnitCost(product?.buyingPrice || 0);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize || quantity <= 0) {
      toast("Please select Product, Size and valid Quantity");
      return;
    }

    const product = productsMap[selectedProduct];
    if (!product) return;

    const variant = availableVariants.find((v) => v.id === selectedVariant);

    const newItem: POItem = {
      productId: product.id,
      productName: product.label,
      variantId: selectedVariant || undefined,
      variantName: variant?.label,
      size: selectedSize,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
    };

    setItems([...items, newItem]);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!supplierId) {
      toast("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast("Please add at least one item");
      return;
    }

    const action = status === "DRAFT" ? "Save Draft" : "Submit";

    showConfirmation({
      title: `${action.toUpperCase()} PURCHASE ORDER?`,
      message: `Are you sure you want to ${
        status === "DRAFT" ? "save this draft" : "submit this order"
      }? Total amount: Rs ${totalAmount.toLocaleString()}`,
      variant: "default",
      onSuccess: async () => {
        setSaving(true);
        try {
          const fd = new FormData();
          fd.append(
            "data",
            JSON.stringify({
              supplierId,
              supplierName,
              stockId,
              expectedDate,
              notes,
              items,
              status,
            }),
          );

          await api.post("/api/v1/erp/procurement/purchase-orders", fd);
          toast.success(
            status === "DRAFT" ? "PO SAVED AS DRAFT" : "PO SUBMITTED",
          );
          onSuccess();
        } catch (error) {
          console.error(error);
          toast.error("Failed to create PO");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ColumnsType<POItem> = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{text}</span>
      ),
    },
    {
      title: "Variant/Size",
      key: "variantSize",
      render: (_, item) => (
        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase">
          {item.variantName ? `${item.variantName} / ` : ""}
          {item.size}
        </span>
      ),
    },
    {
      title: "Unit Cost",
      dataIndex: "unitCost",
      key: "unitCost",
      align: "right",
      render: (cost) => <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">Rs {cost.toLocaleString()}</span>,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty) => <span className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{qty}</span>,
    },
    {
      title: "Subtotal",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (total) => (
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Rs {total.toLocaleString()}</span>
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
          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors cursor-pointer"
        >
          <IconTrash size={15} />
        </button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-1.5 h-6 bg-slate-900 dark:bg-slate-100 rounded-full" />
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              New Purchase Order
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-mono">
              Procurement & Supplier Order
            </div>
          </div>
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
          <Spinner size="large" tip="Loading PO parameters..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Item configuration & Selected list */}
          <div className="lg:col-span-8 space-y-6">
            {/* Add Items Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <IconPlus size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Add Purchase Order Items
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Select Product</label>
                  <Select
                    className="w-full rounded-xl"
                    showSearch
                    optionFilterProp="children"
                    placeholder="Search and choose product..."
                    value={selectedProduct || undefined}
                    onChange={handleProductChange}
                    options={products.map((p) => ({
                      value: p.id,
                      label: p.label,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Variant</label>
                    <Select
                      className="w-full rounded-xl"
                      placeholder="Select Variant"
                      value={selectedVariant || undefined}
                      onChange={setSelectedVariant}
                      disabled={availableVariants.length === 0}
                      options={availableVariants.map((v) => ({
                        value: v.id,
                        label: v.label,
                      }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Size</label>
                    <Select
                      className="w-full rounded-xl"
                      placeholder="Select Size"
                      value={selectedSize || undefined}
                      onChange={setSelectedSize}
                      disabled={!selectedProduct}
                      options={availableSizes.map((s) => ({
                        value: s,
                        label: s,
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Unit Cost (Rs)</label>
                    <InputNumber
                      className="w-full flex items-center rounded-xl"
                      min={0}
                      value={unitCost}
                      onChange={(val) => setUnitCost(val || 0)}
                      placeholder="Cost"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantity (Units)</label>
                    <InputNumber
                      className="w-full flex items-center rounded-xl"
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(Math.max(1, val || 0))}
                      placeholder="Quantity"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl py-2.5 shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <IconPlus size={16} />
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Added Items List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Order Line Items
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2.5 py-0.5 rounded-full">
                  {items.length} unique items
                </span>
              </div>
              <Table
                size="small"
                scroll={{ y: 280, x: 700 }}
                columns={columns}
                dataSource={items}
                rowKey={(_, idx) => idx as number}
                pagination={false}
                className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Logistics & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logistics Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <IconTruck size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Logistics & Route
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Supplier *</label>
                  <Select
                    className="w-full rounded-xl"
                    showSearch
                    optionFilterProp="children"
                    placeholder="Choose Supplier"
                    value={supplierId || undefined}
                    onChange={handleSupplierChange}
                    options={suppliers.map((s) => ({
                      value: s.id,
                      label: s.label,
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Destination Warehouse</label>
                  <Select
                    className="w-full rounded-xl"
                    placeholder="Choose Location"
                    value={stockId || undefined}
                    onChange={setStockId}
                    options={stocks.map((s) => ({ value: s.id, label: s.label }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expected Delivery Date</label>
                  <DatePicker
                    className="w-full rounded-xl"
                    placeholder="Choose Delivery Date"
                    value={expectedDate ? dayjs(expectedDate) : null}
                    onChange={(_, dateString) =>
                      setExpectedDate(
                        Array.isArray(dateString) ? dateString[0] : dateString,
                      )
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Order Notes</label>
                  <Input.TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any supplier instructions..."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Total and Actions Card */}
            <div className="space-y-4">
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-2xl shadow-xs relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-2 translate-y-2 text-slate-400">
                  <IconShoppingCart size={120} />
                </div>
                <h4 className="text-[10px] font-bold mb-1 uppercase tracking-widest text-slate-400 font-mono">
                  Total Order Amount
                </h4>
                <div className="text-3xl font-black tracking-tight leading-none text-emerald-400 font-mono">
                  Rs {(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 rounded-2xl shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSave("SUBMITTED")}
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-11 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Submit Order
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("DRAFT")}
                  disabled={saving}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl h-11 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-semibold transition-all cursor-pointer py-2 text-center"
                >
                  Discard Changes
                </button>
              </div>

              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed flex gap-2">
                <div>⚠️</div>
                <div>
                  Ensure correct supplier and unit costs are reviewed. Stock will only adjust once goods are received (GRN).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NewPOModal;

