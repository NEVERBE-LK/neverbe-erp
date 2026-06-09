import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/pages/master/products/page";
import api from "@/lib/api";
import { InventoryItem } from "@/model/InventoryItem";
import { Modal, Form, Select, InputNumber, Row, Col, Space, Typography, Spin } from "antd";
import { IconBox, IconMapPin, IconScale, IconPackage } from "@tabler/icons-react";

const { Option } = Select;
const { Text } = Typography;

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
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <IconBox size={22} className="text-green-600 animate-pulse" />
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {isEditing ? "Edit Stock Document" : "New Stock Entry"}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Inventory Control
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Stock"
      okButtonProps={{ className: "bg-black hover:bg-gray-800 border-none h-10 px-5 rounded-lg text-sm font-bold shadow-none" }}
      cancelButtonProps={{ className: "h-10 rounded-lg" }}
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
        <Form.Item
          name="productId"
          label={<span className="text-xs font-bold text-gray-500">Product</span>}
          rules={[{ required: true, message: "Please select a product" }]}
        >
          <Select
            onChange={handleProductChange}
            disabled={isEditing}
            placeholder="Select Product..."
            showSearch
            optionFilterProp="children"
            className="w-full h-10 rounded-lg"
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
          label={<span className="text-xs font-bold text-gray-500">Variant</span>}
          rules={[{ required: true, message: "Please select a variant" }]}
        >
          <Select
            onChange={handleVariantChange}
            disabled={isEditing || !productIdValue}
            placeholder="Select Variant..."
            loading={loadingVariants}
            className="w-full h-10 rounded-lg"
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
              label={<span className="text-xs font-bold text-gray-500">Size</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                disabled={isEditing || !variantIdValue}
                placeholder="Size..."
                className="w-full h-10 rounded-lg"
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
              label={<span className="text-xs font-bold text-gray-500">Location</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                disabled={isEditing}
                placeholder="Warehouse..."
                className="w-full h-10 rounded-lg"
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

        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mt-2">
          <Form.Item
            name="quantity"
            label={<span className="text-xs font-bold text-gray-500">Physical Stock Count</span>}
            rules={[{ required: true, message: "Required" }]}
            className="!mb-0"
          >
            <InputNumber
              min={0}
              className="w-full h-12 flex items-center rounded-xl"
              size="large"
              addonAfter={<span className="font-bold text-xs text-gray-500">UNITS</span>}
              disabled={loadingQuantity}
            />
          </Form.Item>

          {loadingQuantity && (
            <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5 font-semibold">
              <Spin size="small" /> Checking current database records...
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default InventoryFormModal;
