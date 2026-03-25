import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Promotion } from "@/model/Promotion";

import {
  IconTag,
  IconSettings,
  IconUpload,
  IconBolt,
  IconCalendarEvent,
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
  Slider,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

dayjs.extend(customParseFormat);

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (promotion: Promotion) => void;
  promotion: Promotion | null;
}

const emptyPromotion: Partial<Promotion> = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  isActive: true,
  conditions: [],
  actions: [{ type: "PERCENTAGE_OFF", value: 0 }],
  usageLimit: 0,
  usageCount: 0,
  perUserLimit: 0,
  stackable: false,
  priority: 1,
};

const PromotionFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  promotion,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [productVariants, setProductVariants] = useState<{
    [productId: string]: { variantId: string; variantName: string }[];
  }>({});
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const isEditing = !!promotion;

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
      // Silently fail or log
      console.log("No variants or error fetching", e);
    }
  };

  // -- Effects --
  useEffect(() => {
    if (open) {
      fetchProducts();
      setBannerFile(null);
      if (promotion) {
        const parseDate = (d: any): Dayjs | null => {
          if (!d) return null;
          if (d.toDate) return dayjs(d.toDate());
          if (typeof d === "string") {
            // First try strict format from our DatePicker (DD/MM/YYYY)
            let parsed = dayjs(d, "DD/MM/YYYY", true);
            if (!parsed.isValid()) {
              // Try ISO or loose parsing as fallback
              parsed = dayjs(d);
            }
            if (parsed.isValid()) return parsed;
            return null;
          }
          if (d.seconds) return dayjs(new Date(d.seconds * 1000));
          return dayjs(d);
        };

        // Deep copy needed for AntD Form to handle nested arrays properly logic sometimes
        // But here we rely on standard form handling
        form.setFieldsValue({
          ...promotion,
          startDate: parseDate(promotion.startDate),
          endDate: parseDate(promotion.endDate),
        });

        setBannerPreview(promotion.bannerUrl || "");

        // Prefetch variants for conditions
        promotion.conditions?.forEach((cond) => {
          if (cond.type === "SPECIFIC_PRODUCT" && cond.value) {
            fetchVariantsForProduct(cond.value as string);
          }
        });
      } else {
        form.setFieldsValue({
          ...emptyPromotion,
          startDate: dayjs(),
          endDate: null,
        });
        setBannerPreview("");
      }
    } else {
      form.resetFields();
    }
  }, [open, promotion, form]);

  // -- Handlers --
  const handleBannerUpload = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const isHeic =
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");
    if (!allowedTypes.includes(file.type) && !isHeic) {
      toast.error(`${file.name}: Invalid Type (JPG/PNG/WEBP/HEIC only)`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(`${file.name}: Too Large (>20MB)`);
      return Upload.LIST_IGNORE;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    return false; // Prevent auto upload
  };

  const handleSubmit = async (values: any) => {
    // Basic Validations
    if (
      values.endDate &&
      values.startDate &&
      values.endDate < values.startDate
    ) {
      toast.error("End date must be after start date");
      return;
    }

    if (values.actions?.[0]?.value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const payloadObj = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        priority: Number(values.priority),
        usageLimit: Number(values.usageLimit),
        perUserLimit: Number(values.perUserLimit),
        actions: values.actions?.map((a: any) => ({
          ...a,
          value: Number(a.value),
          maxDiscount: a.maxDiscount ? Number(a.maxDiscount) : undefined,
        })),
        conditions: values.conditions?.map((c: any) => ({
          ...c,
          // Ensure array type for variantIds
          variantIds: c.variantIds || [],
        })),
      };

      const formDataToSend = new FormData();
      if (bannerFile) {
        formDataToSend.append("banner", bannerFile);
      }

      // Send the entire payload as a JSON string under the 'data' key
      // This preserves data types (numbers, booleans) better than individual FormData strings
      formDataToSend.append("data", JSON.stringify(payloadObj));

      let savedPromotion: Promotion;
      if (isEditing && promotion) {
        const res = await api.put(
          `/api/v1/erp/master/promotions/${promotion.id}`,
          formDataToSend,
        );
        savedPromotion = res.data;
        toast.success("PROMOTION UPDATED");
      } else {
        const res = await api.post("/api/v1/erp/master/promotions", formDataToSend);
        savedPromotion = res.data;
        toast.success("PROMOTION CREATED");
      }
      onSave(savedPromotion);
    } catch (e: any) {
      console.error("Save failed", e);
      toast.error(e.response?.data?.message || "FAILED TO SAVE");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <IconTag size={24} className="text-green-600" />
          <span>{isEditing ? "Edit Promotion" : "New Campaign"}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Campaign"
      width={1200}
      maskClosable={false}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={emptyPromotion}
      >
        <Row gutter={24}>
          {/* Left Column: Details & Schedule */}
          <Col xs={24} lg={14}>
            <Card title="Campaign Details" size="small" className="mb-4">
              <Form.Item label="Marketing Banner">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Upload
                    beforeUpload={handleBannerUpload}
                    showUploadList={false}
                    accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                  >
                    <Button icon={<IconUpload size={16} />}>
                      Select Image
                    </Button>
                  </Upload>
                  {bannerPreview && (
                    <img
                      src={bannerPreview}
                      alt="Banner"
                      width={100}
                      height={50}
                      className="object-cover rounded border border-gray-200"
                    />
                  )}
                </div>
              </Form.Item>

              <Form.Item
                name="name"
                label="Campaign Name"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input size="large" placeholder="E.G. AIR MAX DAY SALE" />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <AIDescriptionTextarea
                  aiContext={{
                    name: form.getFieldValue("name"),
                    category: "Promotion",
                  }}
                  rows={2}
                  placeholder="Internal or customer facing notes..."
                  disabled={saving}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="PERCENTAGE">PERCENTAGE</Option>
                      <Option value="FIXED">FIXED AMOUNT</Option>
                      <Option value="BOGO">BUY ONE GET ONE</Option>
                      <Option value="FREE_SHIPPING">FREE SHIP</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="ACTIVE"
                      unCheckedChildren="INACTIVE"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex items-start gap-3 mb-4">
                <Form.Item name="stackable" valuePropName="checked" noStyle>
                  <Switch
                    size="small"
                    className="mt-1"
                    checkedChildren={<IconBolt size={12} />}
                    unCheckedChildren={<IconBolt size={12} />}
                  />
                </Form.Item>
                <div className="flex flex-col">
                  <span className="font-bold text-xs">
                    Stackable Promotion
                  </span>
                  <span className="text-xs text-gray-500">
                    Can be combined with other discounts
                  </span>
                </div>
              </div>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconCalendarEvent size={18} /> Timeline
                </div>
              }
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="startDate"
                    label="Start Date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="endDate"
                    label="End Date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Right Column: Reward Config & Rules */}
          <Col xs={24} lg={10}>
            <Card
              title="Reward Configuration"
              size="small"
              className="mb-4 bg-gray-50 border-gray-200"
              headStyle={{ color: "#135200" }}
            >
              <Form.List name="actions">
                {(fields) =>
                  fields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Form.Item
                        {...restField}
                        name={[name, "type"]}
                        label="Action Type"
                        rules={[{ required: true }]}
                      >
                        <Select className="bg-white">
                          <Option value="PERCENTAGE_OFF">PERCENTAGE OFF</Option>
                          <Option value="FIXED_OFF">FIXED AMOUNT OFF</Option>
                          <Option value="FREE_SHIPPING">FREE SHIPPING</Option>
                          <Option value="BOGO">BUY X GET Y</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        shouldUpdate={(prev, curr) =>
                          prev.actions?.[name]?.type !==
                          curr.actions?.[name]?.type
                        }
                        noStyle
                      >
                        {({ getFieldValue }) => {
                          const type = getFieldValue(["actions", name, "type"]);
                          return (
                            <Form.Item
                              {...restField}
                              name={[name, "value"]}
                              label={
                                type === "PERCENTAGE_OFF"
                                  ? "Percentage Value %"
                                  : "Discount Amount"
                              }
                              rules={[{ required: true }]}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                size="large"
                                className="font-bold text-green-700"
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>

                      <Form.Item shouldUpdate noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue(["actions", name, "type"]) ===
                            "PERCENTAGE_OFF" && (
                            <Form.Item
                              {...restField}
                              name={[name, "maxDiscount"]}
                              label="Max Cap (Optional)"
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                placeholder="E.G. 1000"
                              />
                            </Form.Item>
                          )
                        }
                      </Form.Item>
                    </div>
                  ))
                }
              </Form.List>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconSettings size={18} /> Rules
                </div>
              }
              size="small"
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const current = form.getFieldValue("conditions") || [];
                    form.setFieldsValue({
                      conditions: [
                        ...current,
                        { type: "MIN_AMOUNT", value: 0 },
                      ],
                    });
                  }}
                >
                  Add Rule
                </Button>
              }
              className="mb-4"
            >
              <Form.List name="conditions">
                {(fields, { remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="p-3 bg-gray-50 border border-gray-200 rounded relative"
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          className="absolute right-1 top-1 z-10"
                          onClick={() => remove(name)}
                        />
                        <Row gutter={8}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "type"]}
                              label="Type"
                              className="mb-2"
                            >
                              <Select size="small">
                                <Option value="MIN_AMOUNT">Min Amount</Option>
                                <Option value="MIN_QUANTITY">Min Qty</Option>
                                <Option value="SPECIFIC_PRODUCT">
                                  Specific Product
                                </Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item shouldUpdate noStyle>
                              {({ getFieldValue }) => {
                                const type = getFieldValue([
                                  "conditions",
                                  name,
                                  "type",
                                ]);
                                if (type === "SPECIFIC_PRODUCT") {
                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, "value"]}
                                      label="Product"
                                      className="mb-2"
                                    >
                                      <Select
                                        size="small"
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={(val) =>
                                          fetchVariantsForProduct(val)
                                        }
                                      >
                                        {products.map((p) => (
                                          <Option key={p.id} value={p.id}>
                                            {p.label}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  );
                                }
                                return (
                                  <Form.Item
                                    {...restField}
                                    name={[name, "value"]}
                                    label="Value"
                                    className="mb-2"
                                  >
                                    <Input size="small" />
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Variant Logic for Conditions */}
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const type = getFieldValue([
                              "conditions",
                              name,
                              "type",
                            ]);
                            const productId = getFieldValue([
                              "conditions",
                              name,
                              "value",
                            ]);

                            if (type === "SPECIFIC_PRODUCT" && productId) {
                              return (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <Form.Item
                                    {...restField}
                                    name={[name, "variantMode"]}
                                    label="Variant Restriction"
                                    initialValue="ALL_VARIANTS"
                                    className="mb-1"
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

                                  <Form.Item shouldUpdate noStyle>
                                    {({ getFieldValue }) =>
                                      getFieldValue([
                                        "conditions",
                                        name,
                                        "variantMode",
                                      ]) === "SPECIFIC_VARIANTS" && (
                                        <Form.Item
                                          {...restField}
                                          name={[name, "variantIds"]}
                                          className="mb-0"
                                        >
                                          <Select
                                            mode="multiple"
                                            size="small"
                                            placeholder="Select variants"
                                            maxTagCount="responsive"
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
                                      )
                                    }
                                  </Form.Item>
                                </div>
                              );
                            }
                            return null;
                          }}
                        </Form.Item>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <Text
                        type="secondary"
                        className="block text-center text-xs"
                      >
                        Applies globally unless rules are added
                      </Text>
                    )}
                  </div>
                )}
              </Form.List>
            </Card>

            <Card title="Limits & Priority" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="usageLimit" label="Global (0=∞)">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="perUserLimit" label="Per User">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="priority"
                label="Priority (Higher applies first)"
              >
                <Slider min={1} max={10} marks={{ 1: "1", 10: "10" }} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default PromotionFormModal;
