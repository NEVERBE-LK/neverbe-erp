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
  DatePicker,
  Card,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconPlus, IconTrash, IconShoppingCart, IconTruck, IconFileText, IconCalendar } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import dayjs from "dayjs";

// Fluid label style
const labelClass = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";

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
        <span className="font-bold text-gray-900 text-xs">{text}</span>
      ),
    },
    {
      title: "Variant/Size",
      key: "variantSize",
      render: (_, item) => (
        <span className="text-gray-500 text-[10px] font-semibold uppercase">
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
      render: (cost) => <span className="font-semibold text-xs text-gray-700">Rs {cost.toLocaleString()}</span>,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty) => <span className="font-bold text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{qty}</span>,
    },
    {
      title: "Subtotal",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (total) => (
        <span className="font-bold text-xs text-black">Rs {total.toLocaleString()}</span>
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
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <IconShoppingCart size={22} className="text-green-600 animate-pulse" />
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              New Purchase Order
            </div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Procurement & Supplier Requisition
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
          <Spin size="large" tip="Loading PO parameters..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Item configuration & Selected list */}
          <div className="lg:col-span-8 space-y-6">
            {/* Add Items Card */}
            <Card
              size="small"
              className="border border-gray-100 rounded-2xl shadow-sm bg-gray-50/50"
              title={
                <div className="flex items-center gap-2">
                  <IconPlus size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Add Items to Requisition
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Select Product</label>
                  <Select
                    className="w-full h-10 rounded-lg"
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
                      className="w-full h-10 rounded-lg"
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
                      className="w-full h-10 rounded-lg"
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
                      className="w-full h-10 flex items-center rounded-lg"
                      min={0}
                      value={unitCost}
                      onChange={(val) => setUnitCost(val || 0)}
                      placeholder="Cost"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantity (Units)</label>
                    <InputNumber
                      className="w-full h-10 flex items-center rounded-lg"
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(Math.max(1, val || 0))}
                      placeholder="Quantity"
                    />
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<IconPlus size={16} />}
                  onClick={handleAddItem}
                  block
                  className="h-10 rounded-xl bg-black hover:bg-gray-800 border-none font-bold"
                >
                  Add Line Item
                </Button>
              </div>
            </Card>

            {/* Added Items List */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Requisition Line Items
                </span>
                <span className="text-xs font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-0.5 rounded-full">
                  {items.length} unique items
                </span>
              </div>
              <Table
                bordered
                size="small"
                scroll={{ y: 280, x: 700 }}
                columns={columns}
                dataSource={items}
                rowKey={(_, idx) => idx as number}
                pagination={false}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Logistics & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logistics Card */}
            <Card
              size="small"
              className="border border-gray-100 rounded-2xl shadow-sm"
              title={
                <div className="flex items-center gap-2">
                  <IconTruck size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Logistics & Route
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Supplier *</label>
                  <Select
                    className="w-full h-10 rounded-lg"
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
                    className="w-full h-10 rounded-lg"
                    placeholder="Choose Location"
                    value={stockId || undefined}
                    onChange={setStockId}
                    options={stocks.map((s) => ({ value: s.id, label: s.label }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expected Delivery Date</label>
                  <DatePicker
                    className="w-full h-10 rounded-lg"
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
                  <label className={labelClass}>Requisition Notes</label>
                  <Input.TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any supplier instructions..."
                    rows={3}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </Card>

            {/* Total and Actions Card */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-2 translate-y-2">
                  <IconShoppingCart size={120} />
                </div>
                <h4 className="text-[10px] font-bold mb-1 uppercase tracking-widest opacity-70">
                  Total Requisition Cost
                </h4>
                <div className="text-3xl font-black tracking-tight leading-none">
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
                  className="h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 border-none shadow-none"
                >
                  Submit Order
                </Button>
                <Button
                  size="large"
                  block
                  onClick={() => handleSave("DRAFT")}
                  disabled={saving}
                  className="h-12 rounded-xl font-bold border-gray-100 bg-gray-50 text-gray-700 hover:text-black"
                >
                  Save as Draft
                </Button>
                <Button
                  block
                  onClick={onClose}
                  disabled={saving}
                  className="border-none text-gray-400 text-xs hover:text-gray-600 font-bold"
                >
                  Discard Changes
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-[10px] text-yellow-800 font-bold leading-relaxed flex gap-2">
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
