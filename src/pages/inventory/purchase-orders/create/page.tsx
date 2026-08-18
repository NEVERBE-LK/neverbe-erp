import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Select,
  Input,
  InputNumber,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPlus,
  IconTrash,
  IconShoppingCart,
  IconTruck,
  IconPackage,
  IconSend,
  IconSearch,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import dayjs from "dayjs";

const labelClass =
  "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono";

interface Supplier {
  id: string;
  label: string;
}

interface Product {
  id: string;
  label: string;
  name?: string;
  thumbnail?: { url: string };
  buyingPrice?: number;
}

interface Stock {
  id: string;
  label: string;
  name?: string;
}

interface Variant {
  id: string;
  label: string;
  name?: string;
  images?: { url: string }[];
  sizes?: string[];
}

interface POItem {
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

const CreatePurchaseOrderPage = () => {
  const navigate = useNavigate();
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
  const [pageSize, setPageSize] = useState(5);

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const selectedProductObj = useMemo(() => {
    return selectedProduct ? productsMap[selectedProduct] : null;
  }, [selectedProduct, productsMap]);

  const selectedVariantObj = useMemo(() => {
    return selectedVariant
      ? availableVariants.find((v) => v.id === selectedVariant)
      : null;
  }, [selectedVariant, availableVariants]);

  const previewImage = useMemo(() => {
    return (
      selectedVariantObj?.images?.[0]?.url ||
      selectedProductObj?.thumbnail?.url
    );
  }, [selectedVariantObj, selectedProductObj]);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = useCallback(async () => {
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
      setSuppliers(suppliersRes.data || []);
      setProducts(productsRes.data || []);
      setStocks(stocksRes.data || []);

      const allSizes = (sizesRes.data || []).map((s) => s.label);
      setGlobalSizes(allSizes);
      setAvailableSizes(allSizes);

      const map: Record<string, Product> = {};
      (productsRes.data || []).forEach((p) => {
        map[p.id] = p;
      });
      setProductsMap(map);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load requisition data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, fetchData]);

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
    const productImage = variant?.images?.[0]?.url || product?.thumbnail?.url;

    const newItem: POItem = {
      productId: product.id,
      productName: product.label || product.name || "Product",
      productImage,
      variantId: selectedVariant || undefined,
      variantName: variant?.label || variant?.name,
      size: selectedSize,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
    };

    setItems([...items, newItem]);
    setQuantity(1);
    toast.success("Line item added to requisition");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalCost, 0);
  }, [items]);

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!supplierId) {
      toast("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast("Please add at least one line item");
      return;
    }

    const action = status === "DRAFT" ? "Save Draft" : "Submit";

    showConfirmation({
      title: `${action.toUpperCase()} PURCHASE ORDER?`,
      message: `Are you sure you want to ${
        status === "DRAFT" ? "save this draft" : "submit this order"
      }? Total amount: Rs ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
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
            status === "DRAFT" ? "PO SAVED AS DRAFT" : "PO SUBMITTED SUCCESSFULLY",
          );
          navigate("/inventory/purchase-orders");
        } catch (error) {
          console.error(error);
          toast.error("Failed to create purchase order");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ColumnsType<POItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center">
            {item.productImage ? (
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <IconPackage className="text-slate-400 dark:text-slate-600" size={16} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
              {item.productName}
            </span>
            {item.variantName && (
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {item.variantName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center",
      render: (size: string) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
          {size || "—"}
        </span>
      ),
    },
    {
      title: "Unit Cost",
      dataIndex: "unitCost",
      key: "unitCost",
      align: "right",
      render: (cost: number) => (
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 font-mono">
          Rs {(cost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty: number) => (
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          {qty}
        </span>
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (total: number) => (
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
          Rs {(total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
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
          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
          title="Remove line item"
        >
          <IconTrash size={15} />
        </button>
      ),
    },
  ];

  return (
    <PageContainer title="New Purchase Order">
      <div className="w-full space-y-6">
        {/* Header Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-1.5 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
              Procurement
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none font-mono">
              Create Purchase Order
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Spinner size="large" tip="Loading Procurement Parameters..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Data Entry Cards */}
            <div className="lg:col-span-6 space-y-6">
              {/* 1. Supplier & Logistics Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <IconTruck size={16} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Supplier & Logistics
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Supplier *</label>
                      <Select
                        className="w-full rounded-xl"
                        showSearch
                        placeholder="Type to search supplier..."
                        value={supplierId || undefined}
                        onChange={handleSupplierChange}
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
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
                        showSearch
                        placeholder="Type to search warehouse..."
                        value={stockId || undefined}
                        onChange={setStockId}
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={stocks.map((s) => ({
                          value: s.id,
                          label: s.label || s.name || s.id,
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Expected Delivery Date</label>
                    <DatePicker
                      className="w-full rounded-xl"
                      placeholder="Select Date"
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
                      placeholder="Add instructions for supplier or internal notes..."
                      rows={2}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Add Line Item Entry Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <IconSearch size={16} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Product Search & Item Entry
                  </span>
                </div>
                <div className="space-y-4">
                  {selectedProductObj && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-center">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={selectedProductObj.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconPackage className="text-slate-400 dark:text-slate-500" size={22} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {selectedProductObj.label || selectedProductObj.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {selectedVariantObj && (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {selectedVariantObj.label || selectedVariantObj.name}
                              </span>
                            )}
                            {selectedSize && (
                              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                Size: {selectedSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold">
                          Item Subtotal
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                          Rs. {(quantity * unitCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Text Search Product *</label>
                    <Select
                      className="w-full rounded-xl"
                      showSearch
                      placeholder="Type product name to search..."
                      value={selectedProduct || undefined}
                      onChange={handleProductChange}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={products.map((p) => ({
                        value: p.id,
                        label: p.label || p.name || "Product",
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Variant</label>
                      <Select
                        className="w-full rounded-xl"
                        showSearch
                        placeholder="Select Variant"
                        value={selectedVariant || undefined}
                        onChange={setSelectedVariant}
                        disabled={availableVariants.length === 0}
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={availableVariants.map((v) => ({
                          value: v.id,
                          label: v.label || v.name || "Variant",
                        }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Size *</label>
                      <Select
                        className="w-full rounded-xl"
                        showSearch
                        placeholder="Select Size"
                        value={selectedSize || undefined}
                        onChange={setSelectedSize}
                        disabled={!selectedProduct}
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={availableSizes.map((s) => ({
                          value: s,
                          label: s,
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Unit Cost (Rs)</label>
                      <InputNumber
                        className="w-full flex items-center rounded-xl font-mono"
                        min={0}
                        value={unitCost}
                        onChange={(val) => setUnitCost(val || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity (Units) *</label>
                      <InputNumber
                        className="w-full flex items-center rounded-xl font-mono"
                        min={1}
                        value={quantity}
                        onChange={(val) => setQuantity(Math.max(1, val || 0))}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl py-2.5 shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 border-none"
                  >
                    <IconPlus size={16} />
                    Add Line Item
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Table Summary & Primary Actions */}
            <div className="lg:col-span-6 space-y-6">
              {/* Order Line Items Table Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Order Line Items ({items.length})
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    Total: Rs. {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Table
                  size="middle"
                  scroll={{ x: 600 }}
                  columns={columns}
                  dataSource={items}
                  rowKey={(_, idx) => idx as number}
                  pagination={{
                    pageSize: pageSize,
                    onShowSizeChange: (_current, size) => setPageSize(size),
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20", "50"],
                    position: ["bottomRight"],
                  }}
                  className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
                />
              </div>

              {/* Total Order Amount Banner & Action Card */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                      Total Order Amount
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      <IconShoppingCart size={18} />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                    Rs. {(totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 rounded-2xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSave("SUBMITTED")}
                    disabled={saving}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl h-11 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 border-none disabled:opacity-50"
                  >
                    {saving ? <Spinner size="small" /> : <IconSend size={16} />}
                    Submit Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave("DRAFT")}
                    disabled={saving}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl h-11 transition-all cursor-pointer border-none flex items-center justify-center disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/inventory/purchase-orders")}
                    disabled={saving}
                    className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-semibold transition-all cursor-pointer py-2 text-center bg-transparent border-none"
                  >
                    Discard & Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CreatePurchaseOrderPage;
