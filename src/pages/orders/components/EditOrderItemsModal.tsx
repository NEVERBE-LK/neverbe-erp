import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Table, Button, InputNumber, Select, Row, Col, Divider, Tag, Space, Alert } from "antd";
import { IconPackage, IconPlus, IconTrash, IconCoin, IconAlertCircle } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import { OrderItem } from "@/model/OrderItem";
import type { ColumnsType } from "antd/es/table";

interface EditOrderItemsModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductDropdownItem {
  id: string;
  label: string;
  sellingPrice: number;
  buyingPrice?: number;
  variants?: Array<{
    variantId?: string;
    id?: string;
    variantName?: string;
    label?: string;
    name?: string;
    color?: string;
    availableSizes?: string[];
    sizes?: string[];
    images?: Array<{ url: string }>;
  }>;
  availableSizes?: string[];
  thumbnail?: { url: string };
}

export const EditOrderItemsModal: React.FC<EditOrderItemsModalProps> = ({
  open,
  order,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Products master data
  const [products, setProducts] = useState<ProductDropdownItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Item addition state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("STD");
  const [addQty, setAddQty] = useState<number>(1);
  const [addPrice, setAddPrice] = useState<number>(0);

  // Reset and initialize when order changes or modal opens
  useEffect(() => {
    if (order && open) {
      setItems(
        (order.items || []).map((item) => ({
          ...item,
          discount: item.discount || 0,
        }))
      );
      setDiscount(order.discount || 0);
      setShippingFee(order.shippingFee || 0);
      setFee(order.fee || 0);

      // Reset adder
      setSelectedProductId("");
      setSelectedVariantId("");
      setSelectedSize("STD");
      setAddQty(1);
      setAddPrice(0);

      fetchProducts();
    }
  }, [order, open]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/api/v1/erp/master/products/dropdown");
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.products || res.data?.dataList || res.data?.data || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch products dropdown", err);
      toast.error("Failed to load product catalog");
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const availableVariants = useMemo(() => {
    return selectedProduct?.variants || [];
  }, [selectedProduct]);

  const selectedVariant = useMemo(() => {
    return availableVariants.find((v) => (v.variantId || v.id) === selectedVariantId) || null;
  }, [availableVariants, selectedVariantId]);

  const availableSizes = useMemo(() => {
    if (selectedVariant?.availableSizes && selectedVariant.availableSizes.length > 0) {
      return selectedVariant.availableSizes;
    }
    if (selectedVariant?.sizes && selectedVariant.sizes.length > 0) {
      return selectedVariant.sizes;
    }
    if (selectedProduct?.availableSizes && selectedProduct.availableSizes.length > 0) {
      return selectedProduct.availableSizes;
    }
    return ["S", "M", "L", "XL", "XXL", "STD"];
  }, [selectedVariant, selectedProduct]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAddPrice(prod.sellingPrice || 0);
      const vars = prod.variants || [];
      if (vars.length > 0) {
        const firstVarId = vars[0].variantId || vars[0].id || "";
        setSelectedVariantId(firstVarId);
        const sizes = vars[0].availableSizes || vars[0].sizes || prod.availableSizes || ["STD"];
        setSelectedSize(sizes[0] || "STD");
      } else {
        setSelectedVariantId("");
        setSelectedSize(prod.availableSizes?.[0] || "STD");
      }
    }
  };

  const handleVariantChange = (varId: string) => {
    setSelectedVariantId(varId);
    const vr = availableVariants.find((v) => (v.variantId || v.id) === varId);
    if (vr) {
      const sizes = vr.availableSizes || vr.sizes || selectedProduct?.availableSizes || ["STD"];
      setSelectedSize(sizes[0] || "STD");
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    if (addQty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const varName =
      selectedVariant?.variantName ||
      selectedVariant?.label ||
      selectedVariant?.name ||
      selectedVariant?.color ||
      "";

    const newItem: OrderItem = {
      itemId: selectedProduct.id,
      productId: selectedProduct.id,
      variantId: selectedVariantId || "",
      variantName: varName,
      size: selectedSize || "STD",
      name: selectedProduct.label,
      quantity: addQty,
      price: addPrice,
      discount: 0,
      buyingPrice: selectedProduct.buyingPrice || 0,
      bPrice: selectedProduct.buyingPrice || 0,
    };

    setItems((prev) => [...prev, newItem]);
    toast.success(`Added ${selectedProduct.label} to items list`);

    // Reset fields
    setSelectedProductId("");
    setSelectedVariantId("");
    setSelectedSize("STD");
    setAddQty(1);
    setAddPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("An order must have at least one line item");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, qty: number | null) => {
    const validQty = Math.max(1, qty || 1);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: validQty };
      return updated;
    });
  };

  const handleUpdateItemPrice = (index: number, newPrice: number | null) => {
    const validPrice = Math.max(0, newPrice || 0);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price: validPrice };
      return updated;
    });
  };

  // Financial Computations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const linePrice = item.price - (item.discount || 0);
      return acc + Math.max(0, linePrice) * (item.quantity || 1);
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const calc = subtotal + Number(shippingFee || 0) + Number(fee || 0) - Number(discount || 0);
    return Math.max(0, calc);
  }, [subtotal, shippingFee, fee, discount]);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Cannot save order with no items");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        items: items.map((item) => ({
          itemId: item.itemId || item.productId,
          productId: item.productId || item.itemId,
          variantId: item.variantId || "",
          variantName: item.variantName || "",
          size: item.size || "STD",
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          buyingPrice: item.buyingPrice || item.bPrice || 0,
          bPrice: item.buyingPrice || item.bPrice || 0,
        })),
        subtotal,
        discount: Number(discount || 0),
        shippingFee: Number(shippingFee || 0),
        fee: Number(fee || 0),
        total: grandTotal,
      };

      await api.patch(`/api/v1/erp/orders/${order?.orderId}/items`, payload);
      toast.success(`Order items & financials for #${order?.orderId} updated successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update order items", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to update order items";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Product Item",
      key: "item",
      render: (_, record) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{record.name}</div>
          {record.variantName && (
            <div className="text-[10px] text-slate-500 font-mono">
              Variant: <span className="font-semibold">{record.variantName}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      render: (size) => (
        <Tag className="rounded-md font-mono text-[10px] font-bold uppercase">
          {size || "STD"}
        </Tag>
      ),
    },
    {
      title: "Unit Price (Rs)",
      key: "price",
      width: 140,
      render: (_, record, idx) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(val) => handleUpdateItemPrice(idx, val)}
          className="w-full font-mono rounded-lg h-8"
        />
      ),
    },
    {
      title: "Qty",
      key: "quantity",
      width: 90,
      render: (_, record, idx) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleUpdateItemQty(idx, val)}
          className="w-full font-mono rounded-lg h-8"
        />
      ),
    },
    {
      title: "Line Subtotal",
      key: "lineSubtotal",
      align: "right",
      width: 130,
      render: (_, record) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          Rs. {(((record.price - (record.discount || 0))) * record.quantity).toLocaleString()}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      align: "center",
      render: (_, __, idx) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<IconTrash size={15} />}
          onClick={() => handleRemoveItem(idx)}
          className="hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Save Items & Financials"
      cancelText="Cancel"
      width={860}
      title={
        <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <IconPackage size={20} />
          </div>
          <div>
            <div className="leading-tight">Edit Order Items & Financials</div>
            <div className="text-xs font-mono text-slate-400 font-normal">
              Order #{order.orderId} • Inventory diffs will be reconciled automatically
            </div>
          </div>
        </div>
      }
      okButtonProps={{
        className: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-white font-bold text-xs h-10 px-6 rounded-xl border-none shadow-xs cursor-pointer",
      }}
      cancelButtonProps={{
        className: "h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700",
      }}
      destroyOnClose
    >
      <div className="py-2 space-y-5">
        {/* Section 1: Add New Product Item */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <IconPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Add Item to Order
            </span>
          </div>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={10}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Select Product</div>
              <Select
                showSearch
                placeholder="Search product..."
                value={selectedProductId || undefined}
                onChange={handleProductChange}
                loading={loadingProducts}
                className="w-full h-10"
                filterOption={(input, option) =>
                  String(option?.label || "").toLowerCase().includes(input.toLowerCase())
                }
                options={products.map((p) => ({
                  value: p.id,
                  label: `${p.label} (Rs. ${p.sellingPrice?.toLocaleString()})`,
                }))}
              />
            </Col>

            <Col xs={24} sm={6}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Variant</div>
              {availableVariants.length > 0 ? (
                <Select
                  placeholder="Select Variant"
                  value={selectedVariantId || undefined}
                  onChange={handleVariantChange}
                  className="w-full h-10"
                  options={availableVariants.map((v) => ({
                    value: v.variantId || v.id,
                    label: v.variantName || v.label || v.name || v.color || "Standard",
                  }))}
                />
              ) : (
                <div className="h-10 flex items-center px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 font-mono">
                  Standard
                </div>
              )}
            </Col>

            <Col xs={12} sm={4}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Size</div>
              <Select
                placeholder="Size"
                value={selectedSize}
                onChange={setSelectedSize}
                className="w-full h-10 font-mono"
                options={availableSizes.map((s) => ({ value: s, label: s }))}
              />
            </Col>

            <Col xs={12} sm={4}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Quantity</div>
              <InputNumber
                min={1}
                value={addQty}
                onChange={(val) => setAddQty(val || 1)}
                className="w-full h-10 font-mono rounded-xl"
              />
            </Col>
          </Row>

          <Row gutter={[12, 12]} align="bottom" justify="space-between" className="pt-1">
            <Col xs={24} sm={8}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Unit Price (Rs)</div>
              <InputNumber
                min={0}
                value={addPrice}
                onChange={(val) => setAddPrice(val || 0)}
                className="w-full h-10 font-mono rounded-xl"
                addonBefore="Rs."
              />
            </Col>
            <Col xs={24} sm={8} className="flex justify-end">
              <Button
                type="primary"
                icon={<IconPlus size={16} />}
                onClick={handleAddItem}
                disabled={!selectedProductId}
                className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs border-none"
              >
                Add to List
              </Button>
            </Col>
          </Row>
        </div>

        {/* Section 2: Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Order Line Items ({items.length})
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            rowKey={(_, idx) => `item_${idx}`}
            pagination={false}
            scroll={{ x: 600 }}
            size="small"
            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
          />
        </div>

        {/* Section 3: Financials Summary & Adjustments */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <IconCoin size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Financial Breakdown & Overrides
            </span>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Total Discount (Rs)</div>
              <InputNumber
                min={0}
                value={discount}
                onChange={(val) => setDiscount(val || 0)}
                className="w-full h-10 font-mono rounded-xl"
                addonBefore="Rs."
              />
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Shipping Fee (Rs)</div>
              <InputNumber
                min={0}
                value={shippingFee}
                onChange={(val) => setShippingFee(val || 0)}
                className="w-full h-10 font-mono rounded-xl"
                addonBefore="Rs."
              />
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">Handling / COD Fee (Rs)</div>
              <InputNumber
                min={0}
                value={fee}
                onChange={(val) => setFee(val || 0)}
                className="w-full h-10 font-mono rounded-xl"
                addonBefore="Rs."
              />
            </Col>
          </Row>

          <Divider className="my-2 border-slate-200 dark:border-slate-700" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs font-mono text-slate-500 space-x-3">
              <span>Subtotal: <strong className="text-slate-700 dark:text-slate-300">Rs. {subtotal.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Discount: <strong className="text-rose-600">- Rs. {Number(discount || 0).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Fees: <strong className="text-slate-700 dark:text-slate-300">+ Rs. {(Number(shippingFee || 0) + Number(fee || 0)).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total:</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Rs. {grandTotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
