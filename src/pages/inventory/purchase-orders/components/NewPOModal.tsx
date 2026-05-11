import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Spin,
  Button,
  Table,
  Select,
  Input,
  InputNumber,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPlus, IconTrash, IconShoppingCart } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// Fluid label style
const labelClass = "block text-xs font-bold text-gray-500 mb-2";

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
        <span className="font-bold text-black text-xs">{text}</span>
      ),
    },
    {
      title: "Variant/Size",
      key: "variantSize",
      render: (_, item) => (
        <span className="text-gray-600 text-[10px]">
          {item.variantName ? `${item.variantName} / ` : ""}
          {item.size}
        </span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty) => <span className="font-bold text-xs">{qty}</span>,
    },
    {
      title: "Total",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (total) => (
        <span className="font-bold text-xs">Rs {total.toLocaleString()}</span>
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
          <IconShoppingCart size={20} className="text-green-600" />
          <span className="text-xl font-bold tracking-tight">
            New Purchase Order
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
          {/* Logistics */}
          <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-50 pb-2">
              Logistics & Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Supplier *</label>
                <Select
                  className="w-full"
                  showSearch
                  optionFilterProp="children"
                  placeholder="Select Supplier"
                  value={supplierId || undefined}
                  onChange={handleSupplierChange}
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.label,
                  }))}
                />
              </div>
              <div>
                <label className={labelClass}>Receive to Stock</label>
                <Select
                  className="w-full"
                  placeholder="Select Warehouse"
                  value={stockId || undefined}
                  onChange={setStockId}
                  options={stocks.map((s) => ({ value: s.id, label: s.label }))}
                />
              </div>
              <div>
                <label className={labelClass}>Expected Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                size="small"
              />
            </div>
          </div>

          {/* Item Entry & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-50 p-5 border border-gray-100 rounded-2xl">
                <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Add Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className={labelClass}>Product</label>
                    <Select
                      className="w-full"
                      showSearch
                      optionFilterProp="children"
                      placeholder="Product..."
                      value={selectedProduct || undefined}
                      onChange={handleProductChange}
                      options={products.map((p) => ({
                        value: p.id,
                        label: p.label,
                      }))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>Variant</label>
                    <Select
                      className="w-full"
                      placeholder="Variant"
                      value={selectedVariant || undefined}
                      onChange={setSelectedVariant}
                      disabled={availableVariants.length === 0}
                      options={availableVariants.map((v) => ({
                        value: v.id,
                        label: v.label,
                      }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Size</label>
                    <Select
                      className="w-full"
                      placeholder="Size"
                      value={selectedSize || undefined}
                      onChange={setSelectedSize}
                      disabled={!selectedProduct}
                      options={availableSizes.map((s) => ({
                        value: s,
                        label: s,
                      }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="primary"
                      icon={<IconPlus size={16} />}
                      onClick={handleAddItem}
                      block
                      className="rounded-lg h-9"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Unit Cost (Rs)</label>
                    <InputNumber
                      className="w-full"
                      min={0}
                      value={unitCost}
                      onChange={(val) => setUnitCost(val || 0)}
                      size="small"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <InputNumber
                      className="w-full"
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(Math.max(1, val || 0))}
                      size="small"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[200px]">
                <Table
                  bordered
                  size="small"
                  scroll={{ y: 300, x: 800 }}
                  columns={columns}
                  dataSource={items}
                  rowKey={(_, idx) => idx as number}
                  pagination={false}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-green-600 text-white p-6 rounded-2xl shadow-lg">
                <h4 className="text-[10px] font-bold mb-1 uppercase opacity-70">
                  Order Total
                </h4>
                <div className="text-3xl font-bold tracking-tight leading-none">
                  Rs {totalAmount.toLocaleString()}
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-5 space-y-3 rounded-2xl shadow-sm">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handleSave("SUBMITTED")}
                  loading={saving}
                  className="h-12 rounded-xl font-bold"
                >
                  Submit
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
                Confirm all items before sending. Distinct GRNs will be required
                for receiving.
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NewPOModal;
