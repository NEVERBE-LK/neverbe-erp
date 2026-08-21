import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, InputNumber, Select, Card, Row, Col, Image, Form, Divider } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";
import { OrderItem } from "@/model/OrderItem";
import toast from "react-hot-toast";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import OrderSubNav from "../components/OrderSubNav";
import { IconPackage, IconPlus, IconTrash, IconDeviceFloppy, IconCoin } from "@tabler/icons-react";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

export const OrderItemsEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Product Selection state for adding new item
  const [products, setProducts] = useState<any[]>([]);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(1);
  const [addPrice, setAddPrice] = useState<number>(0);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchProducts();
    }
  }, [orderId]);

  useEffect(() => {
    if (selectedProduct) {
      fetchVariants(selectedProduct);
    } else {
      setAvailableVariants([]);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/products/dropdown");
      const list = Array.isArray(res.data) ? res.data : (res.data?.products || res.data?.dataList || res.data?.data || []);
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch products for dropdown", err);
      setProducts([]);
    }
  };

  const fetchVariants = async (productId: string) => {
    try {
      const res = await api.get(`/api/v1/erp/master/products/${productId}/variants/dropdown`);
      const list = Array.isArray(res.data) ? res.data : [];
      setAvailableVariants(list);
    } catch (err) {
      console.error("Failed to fetch variants for dropdown", err);
      setAvailableVariants([]);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      const data: Order = res.data;
      setOrder(data);

      const isWebsiteOrder = (data.from || "").toLowerCase() === "website";
      const isProcessingStatus = ["pending", "processing"].includes((data.status || "").toLowerCase());
      setIsReadOnly(!isWebsiteOrder || !isProcessingStatus);

      setItems(data.items || []);
      form.setFieldsValue({
        discount: data.discount || 0,
        shippingFee: data.shippingFee || 0,
        fee: data.fee || 0,
      });

      if (data.items && data.items.length > 0) {
        fetchItemImages(data.items);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const fetchItemImages = async (orderItems: OrderItem[]) => {
    try {
      const uniqueProductIds = Array.from(new Set(orderItems.map((item) => item.itemId).filter(Boolean)));
      const imageMap: Record<string, string> = {};

      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const res = await api.get(`/api/v1/erp/master/products/${productId}`);
            const product = res.data;
            if (product && product.variants) {
              product.variants.forEach((v: any) => {
                if (v.images && v.images.length > 0) {
                  imageMap[`${productId}_${v.variantId}`] = v.images[0].url;
                }
              });
              if (product.thumbnail?.url) {
                imageMap[`${productId}_fallback`] = product.thumbnail.url;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch product ${productId}`, err);
          }
        })
      );

      setItemImages(imageMap);
    } catch (error) {
      console.error("Failed to fetch item images", error);
    }
  };

  const handleQtyChange = (index: number, qty: number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: qty || 1 };
    setItems(updated);
  };

  const handlePriceChange = (index: number, price: number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], price: price || 0 };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    const prodObj = Array.isArray(products)
      ? products.find((p) => p.productId === selectedProduct || p.id === selectedProduct)
      : undefined;
    const variantObj = Array.isArray(availableVariants)
      ? availableVariants.find((v: any) => v.variantId === selectedVariant || v.id === selectedVariant)
      : undefined;

    const newItem: OrderItem = {
      productId: selectedProduct,
      itemId: selectedProduct,
      variantId: selectedVariant || "",
      variantName: variantObj?.variantName || variantObj?.label || variantObj?.color || "",
      size: selectedSize || "STD",
      name: prodObj?.label || prodObj?.title || prodObj?.name || "Product",
      quantity: addQty,
      price: addPrice || prodObj?.sellingPrice || 0,
      discount: 0,
      buyingPrice: prodObj?.buyingPrice || 0,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setSelectedSize("");
    setAddQty(1);
    setAddPrice(0);
    toast.success("Item added to list");
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price - (item.discount || 0)) * item.quantity, 0);

  const onSave = async () => {
    try {
      setSaving(true);
      const values = form.getFieldsValue();
      const discount = values.discount || 0;
      const shippingFee = values.shippingFee || 0;
      const fee = values.fee || 0;
      const total = Math.max(0, subtotal + Number(shippingFee) + Number(fee) - Number(discount));

      const payload = {
        items,
        subtotal,
        discount,
        shippingFee,
        fee,
        total,
      };

      await api.patch(`/api/v1/erp/orders/${orderId}/items`, payload);
      toast.success("Order items updated successfully");
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update order items");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Product Item",
      key: "name",
      render: (_, record) => {
        const imgKey = `${record.itemId}_${record.variantId}`;
        const imageUrl = itemImages[imgKey] || itemImages[`${record.itemId}_fallback`] || "";
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <Image src={imageUrl} width={40} height={40} className="object-cover rounded-lg border border-card-border" preview={false} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-sub">
                <IconPackage size={18} />
              </div>
            )}
            <div>
              <span className="font-semibold text-xs text-text-main dark:text-text-main-dark block">{record.name}</span>
              {record.variantName && (
                <span className="text-[10px] text-text-sub uppercase font-mono block">Variant: {record.variantName}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      render: (size) => (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-text-sub font-mono">
          {size || "—"}
        </span>
      ),
    },
    {
      title: "Unit Price (Rs)",
      key: "price",
      width: 140,
      render: (_, record, idx) =>
        isReadOnly ? (
          <span className="font-mono text-xs font-semibold text-text-main dark:text-text-main-dark">
            Rs {record.price?.toLocaleString()}
          </span>
        ) : (
          <InputNumber
            min={0}
            value={record.price}
            onChange={(val) => handlePriceChange(idx, val)}
            className="w-full rounded-xl font-mono"
          />
        ),
    },
    {
      title: "Qty",
      key: "quantity",
      width: 100,
      render: (_, record, idx) =>
        isReadOnly ? (
          <span className="font-mono text-xs font-semibold text-text-main dark:text-text-main-dark">
            {record.quantity}
          </span>
        ) : (
          <InputNumber
            min={1}
            value={record.quantity}
            onChange={(val) => handleQtyChange(idx, val)}
            className="w-full rounded-xl font-mono"
          />
        ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      align: "right",
      width: 120,
      render: (_, record) => (
        <span className="font-mono text-xs font-bold text-text-main dark:text-text-main-dark">
          Rs {((record.price - (record.discount || 0)) * record.quantity).toLocaleString()}
        </span>
      ),
    },
    ...(!isReadOnly
      ? [
          {
            title: "",
            key: "action",
            width: 50,
            align: "center" as const,
            render: (_: any, record: any, idx: number) => (
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconTrash size={16} />
              </button>
            ),
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <PageContainer title="Loading Order Items...">
        <div className="flex justify-center items-center py-24">
          <Spinner spinning={true} tip="Loading Order Items..." />
        </div>
      </PageContainer>
    );
  }

  const safeProductsList = Array.isArray(products) ? products : [];

  return (
    <PageContainer title={`Order Items | Order #${orderId}`}>
      <div className="w-full space-y-6">
        <OrderSubNav orderId={orderId!} order={order} />
        <Form form={form} layout="vertical" disabled={isReadOnly}>
          <div className="w-full flex flex-col gap-6">
            {/* Card 1: Add New Item Bar (Only in Edit Mode) */}
            {!isReadOnly && (
              <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
                  <div className="flex items-center gap-2">
                    <IconPlus size={18} className="text-brand dark:text-brand-dark" />
                    <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                      Add Product to Order
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    showSearch
                    placeholder="Search product by name or SKU..."
                    value={selectedProduct}
                    onChange={(val) => {
                      setSelectedProduct(val);
                      setSelectedVariant("");
                      setSelectedSize("");
                    }}
                    className="h-10 w-full"
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (Rs. ${p.price || 0})`,
                    }))}
                  />

                  {availableVariants.length > 0 ? (
                    <Select
                      placeholder="Select Variant..."
                      value={selectedVariant}
                      onChange={(val) => {
                        setSelectedVariant(val);
                        setSelectedSize("");
                      }}
                      className="h-10 w-full"
                      options={availableVariants.map((v) => ({
                        value: v.variantId,
                        label: v.name,
                      }))}
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-text-sub font-mono">
                      Standard Variant
                    </div>
                  )}

                  <Select
                    placeholder="Select Size..."
                    value={selectedSize || undefined}
                    onChange={(val) => setSelectedSize(val)}
                    className="h-10 w-full"
                    options={["S", "M", "L", "XL", "XXL", "STD"].map((s) => ({ value: s, label: s }))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <InputNumber min={1} value={addQty} onChange={(v) => setAddQty(v || 1)} className="w-28 h-10 rounded-xl font-mono" addonBefore="Qty" />
                    <InputNumber min={0} value={addPrice} onChange={(v) => setAddPrice(v || 0)} className="w-40 h-10 rounded-xl font-mono" addonBefore="Rs" />
                  </div>
                  <Button
                    type="primary"
                    icon={<IconPlus size={16} />}
                    onClick={handleAddItem}
                    className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            )}

            {/* Card 2: Items Table Card (Full Width) */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-card-border dark:border-card-border-dark">
                <IconPackage size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Order Items ({items.length})
                </h3>
              </div>

              <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
                <Table
                  columns={columns}
                  dataSource={items}
                  rowKey={(rec, idx) => `${rec.productId}_${idx}`}
                  pagination={false}
                  scroll={{ x: 600 }}
                />
              </div>
            </div>

            {/* Card 3: Financial Summary Card (Full Width) */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                <IconCoin size={18} className="text-brand dark:text-brand-dark" />
                <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wider font-mono">
                  Financial Summary
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs w-full">
                <div className="flex justify-between items-center">
                  <span className="text-text-sub font-semibold uppercase">Subtotal</span>
                  <span className="font-bold text-text-main dark:text-text-main-dark">Rs {subtotal.toLocaleString()}</span>
                </div>

                {isReadOnly ? (
                  <>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-text-sub font-semibold uppercase font-sans">Discount</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        - Rs {(order?.discount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-text-sub font-semibold uppercase font-sans">Shipping Fee</span>
                      <span className="font-semibold text-text-main dark:text-text-main-dark">
                        Rs {(order?.shippingFee || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-text-sub font-semibold uppercase font-sans">Handling Fee</span>
                      <span className="font-semibold text-text-main dark:text-text-main-dark">
                        Rs {(order?.fee || 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Form.Item label={<span className="text-xs font-semibold text-text-sub font-sans">Discount (Rs)</span>} name="discount" className="!mb-2">
                      <InputNumber min={0} className="w-full h-10 rounded-xl font-mono" />
                    </Form.Item>

                    <Form.Item label={<span className="text-xs font-semibold text-text-sub font-sans">Shipping Fee (Rs)</span>} name="shippingFee" className="!mb-2">
                      <InputNumber min={0} className="w-full h-10 rounded-xl font-mono" />
                    </Form.Item>

                    <Form.Item label={<span className="text-xs font-semibold text-text-sub font-sans">Handling Fee (Rs)</span>} name="fee" className="!mb-2">
                      <InputNumber min={0} className="w-full h-10 rounded-xl font-mono" />
                    </Form.Item>
                  </>
                )}

                <Divider className="my-3 border-card-border dark:border-card-border-dark" />

                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const discount = isReadOnly ? (order?.discount || 0) : (form.getFieldValue("discount") || 0);
                    const shippingFee = isReadOnly ? (order?.shippingFee || 0) : (form.getFieldValue("shippingFee") || 0);
                    const fee = isReadOnly ? (order?.fee || 0) : (form.getFieldValue("fee") || 0);
                    const grandTotal = Math.max(0, subtotal + Number(shippingFee) + Number(fee) - Number(discount));
                    return (
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-text-main dark:text-text-main-dark">Grand Total</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">Rs {grandTotal.toLocaleString()}</span>
                      </div>
                    );
                  }}
                </Form.Item>
              </div>

              {!isReadOnly && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="primary"
                    loading={saving}
                    icon={<IconDeviceFloppy size={18} />}
                    onClick={onSave}
                    className="h-11 px-8 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Save Items & Financials
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default OrderItemsEditPage;
