import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/pages/master/products/page";
import { ProductDropdownOption } from "../page";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Modal,
  Select,
  Button,
  Card,
  Typography,
  Row,
  Col,
  InputNumber,
  Tag,
} from "antd";
import Spinner from "@/pages/components/shared/Spinner";
import { IconStack2, IconScale, IconPackage, IconAlertCircle } from "@tabler/icons-react";

const { Title, Text } = Typography;
const { Option } = Select;

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string;
  label: string;
  sizes: string[];
  images?: { url: string; file?: string; order?: number }[];
}

interface BulkInventoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  products: ProductDropdownOption[];
  stockLocations: StockLocationOption[];
}

const BulkInventoryFormModal: React.FC<BulkInventoryFormModalProps> = ({
  open,
  onClose,
  onSave,
  products,
  stockLocations,
}) => {
  const [variants, setVariants] = useState<VariantDropdownOption[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<VariantDropdownOption | null>(null);

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(
    {},
  );
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({});

  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form selections
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [stockId, setStockId] = useState("");

  useEffect(() => {
    if (open) {
      setProductId("");
      setVariantId("");
      setStockId("");
      setVariants([]);
      setSelectedVariant(null);
      setSizeQuantities({});
      setCurrentStock({});
      setSaving(false);
    }
  }, [open]);

  // Fetch variants when product changes
  const fetchVariants = async (pid: string) => {
    if (!pid) {
      setVariants([]);
      return;
    }
    setLoadingVariants(true);
    setVariantId("");
    setSelectedVariant(null);
    try {
      const response = await api.get(
        `/api/v1/erp/master/products/${pid}/variants/dropdown`,
      );
      setVariants(response.data || []);
    } catch {
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Fetch current stock
  useEffect(() => {
    const fetchCurrentStock = async () => {
      if (!productId || !variantId || !stockId || !selectedVariant) {
        setCurrentStock({});
        return;
      }

      setLoadingStock(true);
      const stockData: Record<string, number> = {};
      try {
        const promises = selectedVariant.sizes.map(async (size) => {
          try {
            const response = await api.get(
              "/api/v1/erp/inventory/check-quantity",
              {
                params: { productId, variantId, size, stockId },
              },
            );
            stockData[size] = response.data?.quantity ?? 0;
          } catch {
            stockData[size] = 0;
          }
        });
        await Promise.all(promises);
        setCurrentStock(stockData);
        setSizeQuantities(stockData);
      } catch {
        // ignore
      } finally {
        setLoadingStock(false);
      }
    };

    fetchCurrentStock();
  }, [productId, variantId, stockId, selectedVariant]);

  const handleProductChange = (value: string) => {
    setProductId(value);
    fetchVariants(value);
  };

  const handleVariantChange = (value: string) => {
    setVariantId(value);
    const v = variants.find((i) => i.id === value) || null;
    setSelectedVariant(v);
    if (v) {
      const initial: Record<string, number> = {};
      v.sizes.forEach((s) => (initial[s] = 0));
      setSizeQuantities(initial);
    } else {
      setSizeQuantities({});
    }
    setCurrentStock({});
  };

  const handleQuantityChange = (size: string, value: number | null) => {
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: value || 0,
    }));
  };

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => p.id === productId) || null;
  }, [productId, products]);

  const changedCount = useMemo(() => {
    return Object.entries(sizeQuantities).filter(
      ([size, qty]) => qty !== (currentStock[size] ?? 0),
    ).length;
  }, [sizeQuantities, currentStock]);

  const handleSubmit = async () => {
    if (!productId || !variantId || !stockId) {
      toast("Missing Required Selections");
      return;
    }

    if (changedCount === 0) {
      toast("No changes detected");
      return;
    }

    setSaving(true);
    try {
      const data = {
        bulk: true,
        productId,
        variantId,
        stockId,
        sizeQuantities: Object.entries(sizeQuantities)
          .filter(([size, qty]) => qty !== (currentStock[size] ?? 0))
          .map(([size, quantity]) => ({ size, quantity })),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(data));

      const response = await api.post("/api/v1/erp/inventory", formData);
      toast.success(`Bulk entry success: ${response.data.success} updated`);
      onSave();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save");
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
            <IconStack2 size={18} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Bulk Stock Entry
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">
              Inventory Distribution Form
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      okText={`Save Updates (${changedCount})`}
      okButtonProps={{
        disabled: changedCount === 0,
        className: "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 border-none h-10 px-5 rounded-xl text-xs font-semibold shadow-xs",
      }}
      cancelButtonProps={{ className: "h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700" }}
      width={800}
      maskClosable={false}
      centered
      styles={{ body: { padding: "16px 0 8px 0" } }}
    >
      <div className="space-y-4">
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
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Product</span>
            <Select
              className="w-full rounded-xl"
              placeholder="Select Product..."
              value={productId || undefined}
              onChange={handleProductChange}
              showSearch
              optionFilterProp="children"
              disabled={saving}
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12}>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Variant</span>
            <Select
              className="w-full rounded-xl"
              placeholder="Select Variant..."
              value={variantId || undefined}
              onChange={handleVariantChange}
              loading={loadingVariants}
              disabled={saving || !productId}
            >
              {variants.map((v) => (
                <Option key={v.id} value={v.id}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Stock Location</span>
            <Select
              className="w-full rounded-xl"
              placeholder="Select Stock Location..."
              value={stockId || undefined}
              onChange={setStockId}
              disabled={saving}
            >
              {stockLocations.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <div className="pt-4 border-t border-gray-100">
          {loadingStock ? (
            <div className="text-center py-10">
              <Spinner />
            </div>
          ) : selectedVariant && stockId ? (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Size Distribution Grid
                </Text>
                <Tag color="cyan" className="rounded-full px-2.5 font-bold">
                  {changedCount} sizes changed
                </Tag>
              </div>

              {selectedVariant.sizes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedVariant.sizes.map((size) => {
                    const current = currentStock[size] ?? 0;
                    const newVal = sizeQuantities[size] ?? 0;
                    const isChanged = newVal !== current;

                    return (
                      <Card
                        key={size}
                        size="small"
                        className={`rounded-2xl border ${
                          isChanged
                            ? "border-green-200 bg-green-50/50 shadow-sm"
                            : "border-gray-100 bg-gray-50/50"
                        } transition-all duration-200`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Text className="text-xs font-bold text-gray-700">{size}</Text>
                          <Text type="secondary" className="text-[10px] font-bold">
                            Current: {current}
                          </Text>
                        </div>
                        <InputNumber
                          min={0}
                          className="w-full rounded-lg"
                          value={sizeQuantities[size]}
                          onChange={(val) => handleQuantityChange(size, val)}
                        />
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 font-semibold text-xs bg-gray-50 rounded-2xl border border-gray-100">
                  No sizes defined for this variant.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 font-bold text-xs border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center gap-2">
              <IconAlertCircle size={24} className="text-gray-300" />
              <span>SELECT PRODUCT, VARIANT AND STOCK LOCATION TO CONFIGURE SIZES</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkInventoryFormModal;
