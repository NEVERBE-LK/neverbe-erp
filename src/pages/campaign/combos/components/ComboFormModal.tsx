import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { ComboProduct, ComboItem } from "@/model/ComboProduct";
import {
  IconPackage,
  IconCurrencyDollar,
  IconCalendarEvent,
  IconUpload,
  IconPlus,
  IconTrash,
  IconLayersDifference,
} from "@tabler/icons-react";

import toast from "react-hot-toast";
import AIDescriptionTextarea from "@/components/AIDescriptionTextarea";
import { DropdownOption } from "../../../master/products/page";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  DatePicker,
  Row,
  Col,
  Card,
  Button,
  Upload,
  Typography,
  Space,
  Divider,
  Alert,
  Tooltip,
  Tag,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  combo: ComboProduct | null;
}

const emptyCombo: Partial<ComboProduct> = {
  name: "",
  description: "",
  items: [],
  originalPrice: 0,
  comboPrice: 0,
  savings: 0,
  type: "BUNDLE",
  status: "ACTIVE",
  thumbnail: undefined,
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const ComboFormModal: React.FC<Props> = ({ open, onClose, onSave, combo }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [productVariants, setProductVariants] = useState<{
    [productId: string]: { variantId: string; variantName: string }[];
  }>({});

  const isEditing = !!combo;

  // -- Data Fetching --
  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/products/dropdown");
      setProducts(res.data || []);
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const fetchVariantsForProduct = async (productId: string) => {
    if (!productId || productVariants[productId]) return;
    try {
      const res = await api.get(`/api/v1/erp/master/products/${productId}`);
      const product = res.data;
      const variants = (product?.variants || []).map((v: any) => ({
        variantId: v.variantId,
        variantName: v.variantName || v.variantId,
      }));
      setProductVariants((prev) => ({ ...prev, [productId]: variants }));
    } catch (e) {
      console.error("Failed to fetch variants for product", productId, e);
    }
  };

  // -- Effects --
  useEffect(() => {
    if (open) {
      fetchProducts();
      if (combo) {
        const parseDate = (d: any): Dayjs | null => {
          if (!d) return null;
          if (d.toDate) return dayjs(d.toDate());
          if (typeof d === "string") {
            const parsed = dayjs(d);
            if (parsed.isValid()) return parsed;
            return null;
          }
          if (d.seconds) return dayjs(new Date(d.seconds * 1000));
          return dayjs(d);
        };

        form.setFieldsValue({
          ...combo,
          startDate: parseDate(combo.startDate),
          endDate: parseDate(combo.endDate),
        });

        if (combo.thumbnail?.url) {
          setThumbnailPreview(combo.thumbnail.url);
        }

        // Prefetch variants for existing items
        combo.items?.forEach((item) => {
          if (item.productId) fetchVariantsForProduct(item.productId);
        });
      } else {
        form.setFieldsValue({ ...emptyCombo, startDate: null, endDate: null });
        setThumbnailPreview("");
      }
      setThumbnailFile(null);
    } else {
      form.resetFields();
    }
  }, [open, combo, form]);

  // -- Handlers --
  const handleBeforeUpload = (file: File) => {
    const isAllowed =
      ALLOWED_FILE_TYPES.includes(file.type) ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");
    if (!isAllowed) {
      toast.error("Invalid file type. Use JPEG, PNG, WEBP, or HEIC.");
      return Upload.LIST_IGNORE;
    }
    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      toast.error("Image must be smaller than 20MB!");
      return Upload.LIST_IGNORE;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    return false; // Prevent auto upload
  };

  const calculateSavings = () => {
    const original = form.getFieldValue("originalPrice") || 0;
    const comboPrice = form.getFieldValue("comboPrice") || 0;
    return Math.max(0, original - comboPrice);
  };

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = new FormData();

      // Basic fields
      if (values.name) payload.append("name", values.name);
      if (values.description) payload.append("description", values.description);
      if (values.type) payload.append("type", values.type);
      payload.append("status", values.status || "ACTIVE");
      payload.append("originalPrice", String(values.originalPrice || 0));
      payload.append("comboPrice", String(values.comboPrice || 0));
      payload.append(
        "savings",
        String((values.originalPrice || 0) - (values.comboPrice || 0)),
      );

      if (values.buyQuantity)
        payload.append("buyQuantity", String(values.buyQuantity));
      if (values.getQuantity)
        payload.append("getQuantity", String(values.getQuantity));
      if (values.getDiscount)
        payload.append("getDiscount", String(values.getDiscount));

      // Dates
      if (values.startDate)
        payload.append("startDate", values.startDate.toISOString());
      if (values.endDate)
        payload.append("endDate", values.endDate.toISOString());

      // Items
      const items = (values.items || []).map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        variantId: i.variantId || null,
      }));
      payload.append("items", JSON.stringify(items));

      // File
      if (thumbnailFile) {
        payload.append("file", thumbnailFile);
      }

      const url =
        isEditing && combo
          ? `/api/v1/erp/master/combos/${combo.id}`
          : "/api/v1/erp/master/combos";
      const method = isEditing && combo ? "PUT" : "POST";

      await api({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.error(isEditing ? "COMBO UPDATED" : "COMBO CREATED");
      onSave();
    } catch (e: any) {
      console.error("Save failed", e);
      toast(e.response?.data?.message || "FAILED TO SAVE");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <IconPackage size={24} className="text-green-600" />
          <span>{isEditing ? "Edit Bundle" : "New Bundle"}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Bundle"
      width={1100}
      maskClosable={false}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={emptyCombo}
      >
        <Row gutter={24}>
          {/* Left Column: Basic Info & Items */}
          <Col xs={24} lg={14}>
            <Card title="Bundle Info" size="small" className="mb-4">
              <Form.Item
                name="name"
                label="Bundle Name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input size="large" placeholder="E.G. WEEKEND STARTER PACK" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="type" label="Type">
                    <Select>
                      <Option value="BUNDLE">STANDARD BUNDLE</Option>
                      <Option value="BOGO">BUY X GET Y</Option>
                      <Option value="MULTI_BUY">MULTI-BUY</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Status">
                    <Select>
                      <Option value="ACTIVE">ACTIVE</Option>
                      <Option value="INACTIVE">INACTIVE</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Thumbnail">
                <div className="flex items-center gap-4">
                  <Upload
                    beforeUpload={handleBeforeUpload}
                    showUploadList={false}
                    accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                  >
                    <Button icon={<IconUpload size={16} />}>
                      Select Image
                    </Button>
                  </Upload>
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail"
                      width={60}
                      height={60}
                      className="object-cover rounded border border-gray-200"
                    />
                  )}
                </div>
              </Form.Item>

              <Form.Item name="description" label="Description">
                <AIDescriptionTextarea
                  aiContext={{
                    name: form.getFieldValue("name"),
                    category: "Bundle/Combo",
                  }}
                  rows={2}
                  placeholder="Bundle details..."
                  disabled={saving}
                />
              </Form.Item>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconLayersDifference size={18} /> Items
                </div>
              }
              size="small"
              className="mb-4"
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const items = form.getFieldValue("items") || [];
                    form.setFieldsValue({
                      items: [
                        ...items,
                        {
                          quantity: 1,
                          required: true,
                          variantMode: "ALL_VARIANTS",
                        },
                      ],
                    });
                  }}
                >
                  Add Product
                </Button>
              }
            >
              <Form.List name="items">
                {(fields, { remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50 relative"
                      >
                        <Row gutter={16} align="middle">
                          <Col span={14}>
                            <Form.Item
                              {...restField}
                              name={[name, "productId"]}
                              label="Product"
                              rules={[{ required: true, message: "Required" }]}
                              className="mb-2"
                            >
                              <Select
                                showSearch
                                optionFilterProp="children"
                                onChange={(val) => fetchVariantsForProduct(val)}
                              >
                                {products.map((p) => (
                                  <Option key={p.id} value={p.id}>
                                    {p.label}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "quantity"]}
                              label="Qty"
                              rules={[{ required: true, message: "Required" }]}
                              className="mb-2"
                            >
                              <InputNumber min={1} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col span={4} className="flex justify-end pt-2">
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Col>
                        </Row>

                        {/* Nested Variant Configuration */}
                        <Form.Item
                          shouldUpdate={(prev, curr) =>
                            prev.items?.[name]?.productId !==
                            curr.items?.[name]?.productId
                          }
                          noStyle
                        >
                          {({ getFieldValue }) => {
                            const productId = getFieldValue([
                              "items",
                              name,
                              "productId",
                            ]);
                            return productId ? (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <Form.Item
                                  {...restField}
                                  name={[name, "variantMode"]}
                                  label={
                                    <span className="text-xs text-gray-500 font-bold">
                                      VARIANT RESTRICTION
                                    </span>
                                  }
                                  className="mb-2"
                                >
                                  <Select size="small">
                                    <Option value="ALL_VARIANTS">
                                      All Variants
                                    </Option>
                                    <Option value="SPECIFIC_VARIANTS">
                                      Specific Variants
                                    </Option>
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  shouldUpdate={(prev, curr) =>
                                    prev.items?.[name]?.variantMode !==
                                    curr.items?.[name]?.variantMode
                                  }
                                  noStyle
                                >
                                  {({ getFieldValue }) =>
                                    getFieldValue([
                                      "items",
                                      name,
                                      "variantMode",
                                    ]) === "SPECIFIC_VARIANTS" ? (
                                      <Form.Item
                                        {...restField}
                                        name={[name, "variantIds"]}
                                        className="mb-0"
                                      >
                                        <Select
                                          mode="multiple"
                                          placeholder="Select variants"
                                          maxTagCount="responsive"
                                          size="small"
                                        >
                                          {(
                                            productVariants[productId] || []
                                          ).map((v) => (
                                            <Option
                                              key={v.variantId}
                                              value={v.variantId}
                                            >
                                              {v.variantName}
                                            </Option>
                                          ))}
                                        </Select>
                                      </Form.Item>
                                    ) : null
                                  }
                                </Form.Item>
                              </div>
                            ) : null;
                          }}
                        </Form.Item>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <Text type="secondary" className="block text-center py-4">
                        No items added to this bundle.
                      </Text>
                    )}
                  </div>
                )}
              </Form.List>
            </Card>
          </Col>

          {/* Right Column: Pricing & Timeline */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconCurrencyDollar size={18} /> Pricing Logic
                </div>
              }
              size="small"
              className="mb-4 shadow-sm border-gray-200"
              headStyle={{ backgroundColor: "#f6ffed", color: "#389e0d" }}
            >
              <Form.Item
                name="originalPrice"
                label="Total Original Price (Calculated Reference)"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  prefix="LKR"
                  placeholder="0.00"
                />
              </Form.Item>

              <Divider plain>Sold At</Divider>

              <Form.Item name="comboPrice" label="Bundle Price">
                <InputNumber
                  style={{ width: "100%" }}
                  prefix="LKR"
                  size="large"
                  className="font-bold text-green-700"
                />
              </Form.Item>

              <div className="bg-gray-50 p-3 rounded flex justify-between items-center border border-gray-100">
                <Text type="secondary" strong>
                  Estimated Savings
                </Text>
                <Form.Item shouldUpdate noStyle>
                  {() => {
                    const savings = calculateSavings();
                    return (
                      <Text strong type="success">
                        LKR {savings.toLocaleString()}
                      </Text>
                    );
                  }}
                </Form.Item>
              </div>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconCalendarEvent size={18} /> Validity
                </div>
              }
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="startDate" label="Start Date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="endDate" label="Expiry Date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ComboFormModal;
