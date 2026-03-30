import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/pages/master/products/page";
import api from "@/lib/api";
import { InventoryItem } from "@/model/InventoryItem";
import { Modal, Form, Select, InputNumber, Button, Spin, Row, Col, Badge } from "antd";

const { Option } = Select;

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string; // variantId
  label: string; // variantName
  sizes: string[];
}

interface StockFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  item: InventoryItem | null;
  products: DropdownOption[];
  sizes: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const emptyItem: Omit<InventoryItem, "id"> = {
  productId: "",
  variantId: "",
  size: "",
  stockId: "",
  quantity: 0,
};

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
  const [neuralData, setNeuralData] = useState<any>(null);

  const fetchNeuralPulse = async () => {
    try {
      const resp = await api.get('/api/v1/erp/ai/neural');
      if (resp.data.success) {
        setNeuralData(resp.data.data);
      }
    } catch (err) {
      console.error("Neural Fetch Err", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNeuralPulse();
    }
  }, [open]);

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
      title={isEditing ? "Edit Stock" : "Add Stock"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Stock"
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} disabled={saving}>
        <Form.Item
          name="productId"
          label="Product"
          rules={[{ required: true }]}
        >
          <Select
            onChange={handleProductChange}
            disabled={isEditing}
            placeholder="Select Product..."
            showSearch
            optionFilterProp="children"
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
          label="Variant"
          rules={[{ required: true }]}
        >
          <Select
            onChange={handleVariantChange}
            disabled={isEditing || !productIdValue}
            placeholder="Select Variant..."
            loading={loadingVariants}
          >
            {variants.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="size" label="Size" rules={[{ required: true }]}>
              <Select
                disabled={isEditing || !variantIdValue}
                placeholder="Select Size..."
              >
                {availableSizes.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="stockId"
              label="Stock Location"
              rules={[{ required: true }]}
            >
              <Select disabled={isEditing} placeholder="Select Location...">
                {stockLocations.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            className="w-full"
            size="large"
            addonAfter="UNITS"
            disabled={loadingQuantity}
          />
        </Form.Item>

        {productIdValue && neuralData?.reality?.neuralRisks?.find((r: any) => r.productId === productIdValue) && (
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Neural Forecasting Active</span>
             </div>
             <div className="text-sm font-black text-emerald-950 mb-1">
               Projected Shortfall Detected
             </div>
             <p className="text-xs text-emerald-800/60 leading-relaxed mb-4">
                This SKU is predicted to sell <strong>{neuralData.reality.neuralRisks.find((r: any) => r.productId === productIdValue).projectedDemand} units</strong> within the next 14 days. Your current stock is insufficient.
             </p>
             <div className="flex justify-between items-center py-2 border-t border-emerald-100/50">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Demand Spike Risk:</span>
                <Badge 
                  className="font-black" 
                  color={neuralData.reality.neuralRisks.find((r: any) => r.productId === productIdValue).riskLevel === 'CRITICAL' ? 'red' : 'orange'} 
                  text={neuralData.reality.neuralRisks.find((r: any) => r.productId === productIdValue).riskLevel} 
                />
             </div>
          </div>
        )}
        {loadingQuantity && (
          <div className="text-xs text-gray-500 mb-4">
            <Spin size="small" /> Checking existing stock...
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default InventoryFormModal;
