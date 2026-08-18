import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/pages/master/products/page";
import { ProductDropdownOption } from "../page";
import api from "@/lib/api";
import { InventoryItem } from "@/model/InventoryItem";
import Spinner from "@/pages/components/shared/Spinner";
import { Modal, Form, Select, InputNumber, Row, Col, Space, Typography } from "antd";
import { IconBox, IconMapPin, IconScale, IconPackage } from "@tabler/icons-react";

const { Option } = Select;
const { Text } = Typography;

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string; // variantId
  label: string; // variantName
  sizes: string[];
  images?: { url: string; file?: string; order?: number }[];
}

interface StockFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  item: InventoryItem | null;
  products: ProductDropdownOption[];
  sizes: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const InventoryFormModal: React.FC<StockFormModalProps> = ({
  open,
  onClose,
  onSave,
  item,
  products,
  stockLocations,
}) => {
  const [variants, setVariants] = useState<VariantDropdownOption[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<VariantDropdownOption | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuantity, setLoadingQuantity] = useState(false);

  const [form] = Form.useForm();
  const isEditing = !!item;
  const productIdValue = Form.useWatch("productId", form);
  const variantIdValue = Form.useWatch("variantId", form);
  const sizeValue = Form.useWatch("size", form);
  const stockIdValue = Form.useWatch("stockId", form);

  useEffect(() => {
    if (open) {
      setSaving(false);
      setLoadingQuantity(false);

      if (item) {
        // Edit Mode
        fetchVariants(item.productId, item.variantId);
        form.setFieldsValue({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          stockId: item.stockId,
          quantity: item.quantity,
        });

        // Check quantity async
        const fetchQty = async () => {
          setLoadingQuantity(true);
          try {
            const response = await api.get(
              "/api/v1/erp/inventory/check-quantity",
              {
                params: {
                  productId: item.productId,
                  variantId: item.variantId,
                  size: item.size,
                  stockId: item.stockId,
                },
              },
            );
            form.setFieldsValue({
              quantity: response.data.quantity ?? item.quantity,
            });
          } catch {
            // ignore — keep existing quantity
          } finally {
            setLoadingQuantity(false);
          }
        };
        fetchQty();
      } else {
        // New Mode
        form.resetFields();
        setVariants([]);
        setSelectedVariant(null);
      }
    }
  }, [item, open, form]);

  const fetchVariants = async (
    pid: string | null,
    preselectVariantId?: string,
  ) => {
    if (!pid) {
      setVariants([]);
      setSelectedVariant(null);
      return;
    }
    setLoadingVariants(true);
    try {
      const response = await api.get(
        `/api/v1/erp/master/products/${pid}/variants/dropdown`,
      );
      const fetchedVariants: VariantDropdownOption[] = response.data || [];
      setVariants(fetchedVariants);
      if (preselectVariantId) {
        const v = fetchedVariants.find((v) => v.id === preselectVariantId);
        if (v) setSelectedVariant(v);
      }
    } catch {
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Watch for Product Change to load variants
  const handleProductChange = (value: string) => {
    form.setFieldsValue({ variantId: null, size: null });
    fetchVariants(value);
  };

  // Watch for Variant Change to set Size Options
  const handleVariantChange = (value: string) => {
    const selected = variants.find((v) => v.id === value) || null;
    setSelectedVariant(selected);
    form.setFieldsValue({ size: null });
  };

  const selectedProduct = useMemo(() => {
    if (!productIdValue) return null;
    return products.find((p) => p.id === productIdValue) || null;
  }, [productIdValue, products]);

  const availableSizes = useMemo(() => {
    if (!selectedVariant || !selectedVariant.sizes) return [];
    return selectedVariant.sizes;
  }, [selectedVariant]);

  // Check Quantity Logic for NEW items
  useEffect(() => {
    const checkQty = async () => {
      if (
        !open ||
        isEditing ||
        !productIdValue ||
        !variantIdValue ||
        !sizeValue ||
        !stockIdValue
      )
        return;
      setLoadingQuantity(true);
      try {
        const response = await api.get("/api/v1/erp/inventory/check-quantity", {
          params: {
            productId: productIdValue,
            variantId: variantIdValue,
            size: sizeValue,
            stockId: stockIdValue,
          },
        });
        const currentQuantity = response.data?.quantity ?? 0;
        if (currentQuantity > 0)
          form.setFieldsValue({ quantity: currentQuantity });
      } catch {
        // ignore
      } finally {
        setLoadingQuantity(false);
      }
    };
    checkQty();
  }, [
    productIdValue,
    variantIdValue,
    sizeValue,
    stockIdValue,
    open,
    isEditing,
    form,
  ]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const saveData = {
        ...(item || {}),
        ...values,
        quantity: Number(values.quantity),
      };
      await onSave(saveData);
    } catch (error) {
      console.error("Save failed in modal:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700">
            <IconBox size={18} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {isEditing ? "Edit Stock Document" : "New Stock Entry"}
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">
              Inventory Control
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Stock"
      okButtonProps={{ className: "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 border-none h-10 px-5 rounded-xl text-xs font-semibold shadow-xs" }}
      cancelButtonProps={{ className: "h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700" }}
      maskClosable={false}
      centered
      styles={{ body: { padding: "16px 0 8px 0" } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={saving}
        className="px-1"
      >
        {selectedProduct && (
          <div className="mb-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex gap-4 items-center relative overflow-hidden transition-all duration-300">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 flex items-center justify-center relative group">
              {selectedVariant?.images?.[0]?.url || selectedProduct?.thumbnail?.url ? (
                <img
                  src={selectedVariant?.images?.[0]?.url || selectedProduct?.thumbnail?.url}
                  alt={selectedProduct.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <IconPackage className="text-slate-300 dark:text-slate-600" size={28} />
              )}
              {selectedVariant?.images?.[0]?.url && (
                <span className="absolute bottom-1 right-1 bg-slate-900/80 text-[8px] font-bold text-white px-1 py-0.5 rounded uppercase tracking-wider">
                  Variant
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 items-center mb-1">
                {selectedProduct.brand && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 font-mono">
                    {selectedProduct.brand}
                  </span>
                )}
                {selectedProduct.category && (
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
                    {selectedProduct.category}
                  </span>
                )}
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                {selectedProduct.label}
              </h3>
              
              <div className="flex items-baseline gap-4 mt-2">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Buying Price</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">LKR {selectedProduct.buyingPrice?.toLocaleString() || "0"}</span>
                </div>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 self-center" />
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Selling Price</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">LKR {selectedProduct.sellingPrice?.toLocaleString() || "0"}</span>
                </div>
                {selectedVariant && (
                  <>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 self-center" />
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Variant</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px] block font-mono">
                        {selectedVariant.label}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <Form.Item
          name="productId"
          label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product</span>}
          rules={[{ required: true, message: "Please select a product" }]}
        >
          <Select
            onChange={handleProductChange}
            disabled={isEditing}
            placeholder="Select Product..."
            showSearch
            optionFilterProp="children"
            className="w-full rounded-xl"
          >
            {products.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="variantId"
          label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Variant</span>}
          rules={[{ required: true, message: "Please select a variant" }]}
        >
          <Select
            onChange={handleVariantChange}
            disabled={isEditing || !productIdValue}
            placeholder="Select Variant..."
            loading={loadingVariants}
            className="w-full rounded-xl"
          >
            {variants.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="size"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Size</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                disabled={isEditing || !variantIdValue}
                placeholder="Size..."
                className="w-full rounded-xl"
              >
                {availableSizes.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stockId"
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                disabled={isEditing}
                placeholder="Warehouse..."
                className="w-full rounded-xl"
              >
                {stockLocations.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 mt-2">
          <Form.Item
            name="quantity"
            label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Physical Stock Count</span>}
            rules={[{ required: true, message: "Required" }]}
            className="!mb-0"
          >
            <InputNumber
              min={0}
              className="w-full h-11 flex items-center rounded-xl"
              size="large"
              addonAfter={<span className="font-bold text-xs text-slate-500 font-mono">UNITS</span>}
              disabled={loadingQuantity}
            />
          </Form.Item>

          {loadingQuantity && (
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-semibold">
              <Spinner size="small" /> Checking current database records...
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default InventoryFormModal;
