import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  DatePicker,
  Row,
  Col,
  Button,
  Upload,
  Slider,
} from "antd";
import {
  IconTag,
  IconSettings,
  IconUpload,
  IconBolt,
  IconCalendarEvent,
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { Promotion } from "@/model/Promotion";
import PageContainer from "@/pages/components/container/PageContainer";
import AIDescriptionTextarea from "@/components/AIDescriptionTextarea";
import { DropdownOption } from "@/pages/master/products/page";
import { dayjs } from "@/utils/dateUtils";
import toast from "react-hot-toast";

const { Option } = Select;

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

const CreatePromotionPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const watchedName = Form.useWatch("name", form);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [productVariants, setProductVariants] = useState<{
    [productId: string]: { variantId: string; variantName: string }[];
  }>({});
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  useEffect(() => {
    fetchProducts();
    form.setFieldsValue({
      ...emptyPromotion,
      startDate: dayjs(),
      endDate: null,
    });
  }, [form]);

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
      console.log("No variants or error fetching", e);
    }
  };

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
    return false;
  };

  const handleSubmit = async (values: any) => {
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
          variantIds: c.variantIds || [],
        })),
      };

      const formDataToSend = new FormData();
      if (bannerFile) {
        formDataToSend.append("banner", bannerFile);
      }
      formDataToSend.append("data", JSON.stringify(payloadObj));

      await api.post("/api/v1/erp/master/promotions", formDataToSend);
      toast.success("PROMOTION CREATED");
      navigate("/campaign/promotions");
    } catch (e: any) {
      console.error("Save failed", e);
      toast.error(e.response?.data?.message || "FAILED TO SAVE");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="New Campaign | Promotions">
      <div className="w-full space-y-6 pb-24">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/campaign/promotions")}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark cursor-pointer"
            >
              <IconArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Campaign Management
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                Create New Promotion
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/campaign/promotions")}
              className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => form.submit()}
              icon={<IconDeviceFloppy size={16} />}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              Save Campaign
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={emptyPromotion}
        >
          <Row gutter={[24, 24]}>
            {/* Left Column: Details & Timeline */}
            <Col xs={24} lg={14}>
              <div className="space-y-6">
                {/* General Info Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconTag size={18} className="text-text-main dark:text-text-main-dark" />
                    <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">General Campaign Details</span>
                  </div>

                  <Form.Item label="Marketing Banner">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <Upload
                        beforeUpload={handleBannerUpload}
                        showUploadList={false}
                        accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                      >
                        <Button icon={<IconUpload size={14} />} className="h-9 px-4 rounded-xl text-xs font-bold">
                          Select Banner Image
                        </Button>
                      </Upload>
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          className="w-32 h-16 object-cover rounded-xl border border-card-border dark:border-card-border-dark"
                        />
                      )}
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="name"
                    label="Campaign Name"
                    rules={[{ required: true, message: "Campaign name is required" }]}
                  >
                    <Input placeholder="e.g. SUMMER MEGA SALE 2026" className="h-10 rounded-xl font-mono text-xs" />
                  </Form.Item>

                  <Form.Item name="description" label="Description">
                    <AIDescriptionTextarea
                      aiContext={{
                        name: watchedName,
                        category: "Promotion",
                      }}
                      rows={3}
                      placeholder="Internal or customer facing promotional details..."
                      disabled={saving}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="type" label="Discount Type" rules={[{ required: true }]}>
                        <Select className="h-10">
                          <Option value="PERCENTAGE">PERCENTAGE DISCOUNTS</Option>
                          <Option value="FIXED">FIXED AMOUNT OFF</Option>
                          <Option value="BOGO">BUY ONE GET ONE (BOGO)</Option>
                          <Option value="FREE_SHIPPING">FREE SHIPPING</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex items-center gap-3 pt-2">
                    <Form.Item name="stackable" valuePropName="checked" noStyle>
                      <Switch
                        size="small"
                        checkedChildren={<IconBolt size={12} />}
                        unCheckedChildren={<IconBolt size={12} />}
                      />
                    </Form.Item>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-text-main dark:text-text-main-dark">
                        Stackable Promotion
                      </span>
                      <span className="text-xs text-text-sub dark:text-slate-400">
                        Can be combined with other discount codes at checkout
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
                    <IconCalendarEvent size={18} className="text-text-main dark:text-text-main-dark" />
                    <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">Campaign Schedule & Validity</span>
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                        <DatePicker format="DD/MM/YYYY" className="w-full h-10 rounded-xl font-mono text-xs" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
                        <DatePicker format="DD/MM/YYYY" className="w-full h-10 rounded-xl font-mono text-xs" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>

            {/* Right Column: Reward Config & Eligibility Rules */}
            <Col xs={24} lg={10}>
              <div className="space-y-6">
                {/* Reward Config Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
                  <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono block pb-3 border-b border-card-border dark:border-card-border-dark">
                    Reward Configuration
                  </span>

                  <Form.List name="actions">
                    {(fields) =>
                      fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="space-y-3">
                          <Form.Item
                            {...restField}
                            name={[name, "type"]}
                            label="Reward Action"
                            rules={[{ required: true }]}
                          >
                            <Select className="h-10">
                              <Option value="PERCENTAGE_OFF">PERCENTAGE OFF (%)</Option>
                              <Option value="FIXED_OFF">FIXED AMOUNT OFF (RS)</Option>
                              <Option value="FREE_SHIPPING">FREE SHIPPING</Option>
                              <Option value="BOGO">BUY X GET Y</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            shouldUpdate={(prev, curr) =>
                              prev.actions?.[name]?.type !== curr.actions?.[name]?.type
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
                                      ? "Percentage Discount (%)"
                                      : "Discount Amount (Rs)"
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <InputNumber
                                    className="w-full h-10 rounded-xl font-mono font-bold text-xs"
                                    min={0}
                                  />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>

                          <Form.Item shouldUpdate noStyle>
                            {({ getFieldValue }) =>
                              getFieldValue(["actions", name, "type"]) === "PERCENTAGE_OFF" && (
                                <Form.Item
                                  {...restField}
                                  name={[name, "maxDiscount"]}
                                  label="Maximum Discount Cap (Optional)"
                                >
                                  <InputNumber
                                    className="w-full h-10 rounded-xl font-mono text-xs"
                                    placeholder="e.g. 5000"
                                  />
                                </Form.Item>
                              )
                            }
                          </Form.Item>
                        </div>
                      ))
                    }
                  </Form.List>
                </div>

                {/* Rules Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-card-border dark:border-card-border-dark">
                    <div className="flex items-center gap-2 font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
                      <IconSettings size={18} /> Eligibility Rules
                    </div>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<IconPlus size={14} />}
                      onClick={() => {
                        const current = form.getFieldValue("conditions") || [];
                        form.setFieldsValue({
                          conditions: [...current, { type: "MIN_AMOUNT", value: 0 }],
                        });
                      }}
                      className="rounded-lg text-xs font-semibold"
                    >
                      Add Rule
                    </Button>
                  </div>

                  <Form.List name="conditions">
                    {(fields, { remove }) => (
                      <div className="space-y-3">
                        {fields.map(({ key, name, ...restField }) => (
                          <div
                            key={key}
                            className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-card-border dark:border-card-border-dark rounded-xl relative space-y-3"
                          >
                            <button
                              type="button"
                              onClick={() => remove(name)}
                              className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer border-none bg-transparent"
                            >
                              <IconTrash size={15} />
                            </button>
                            <Row gutter={12}>
                              <Col span={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "type"]}
                                  label="Rule Criteria"
                                  className="!mb-0"
                                >
                                  <Select className="h-9">
                                    <Option value="MIN_AMOUNT">Min Order Amount</Option>
                                    <Option value="MIN_QUANTITY">Min Item Quantity</Option>
                                    <Option value="SPECIFIC_PRODUCT">Specific Product</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item shouldUpdate noStyle>
                                  {({ getFieldValue }) => {
                                    const type = getFieldValue(["conditions", name, "type"]);
                                    if (type === "SPECIFIC_PRODUCT") {
                                      return (
                                        <Form.Item
                                          {...restField}
                                          name={[name, "value"]}
                                          label="Product"
                                          className="!mb-0"
                                        >
                                          <Select
                                            className="h-9"
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
                                      );
                                    }
                                    return (
                                      <Form.Item
                                        {...restField}
                                        name={[name, "value"]}
                                        label="Threshold Value"
                                        className="!mb-0"
                                      >
                                        <Input className="h-9 font-mono text-xs" />
                                      </Form.Item>
                                    );
                                  }}
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* Variant Restrictions */}
                            <Form.Item shouldUpdate noStyle>
                              {({ getFieldValue }) => {
                                const type = getFieldValue(["conditions", name, "type"]);
                                const productId = getFieldValue(["conditions", name, "value"]);

                                if (type === "SPECIFIC_PRODUCT" && productId) {
                                  return (
                                    <div className="pt-2 border-t border-card-border dark:border-card-border-dark space-y-2">
                                      <Form.Item
                                        {...restField}
                                        name={[name, "variantMode"]}
                                        label="Variant Restriction"
                                        initialValue="ALL_VARIANTS"
                                        className="!mb-0"
                                      >
                                        <Select className="h-8 text-xs">
                                          <Option value="ALL_VARIANTS">All Product Variants</Option>
                                          <Option value="SPECIFIC_VARIANTS">Specific Variants Only</Option>
                                        </Select>
                                      </Form.Item>

                                      <Form.Item shouldUpdate noStyle>
                                        {({ getFieldValue }) =>
                                          getFieldValue(["conditions", name, "variantMode"]) === "SPECIFIC_VARIANTS" && (
                                            <Form.Item
                                              {...restField}
                                              name={[name, "variantIds"]}
                                              className="!mb-0"
                                            >
                                              <Select
                                                mode="multiple"
                                                className="w-full text-xs"
                                                placeholder="Select variants"
                                                maxTagCount="responsive"
                                              >
                                                {(productVariants[productId] || []).map((v) => (
                                                  <Option key={v.variantId} value={v.variantId}>
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
                          <span className="text-xs text-text-sub text-center block py-2 font-mono">
                            No rules configured (Applies globally to all orders)
                          </span>
                        )}
                      </div>
                    )}
                  </Form.List>
                </div>

                {/* Usage Limits & Priority Card */}
                <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
                  <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono block pb-3 border-b border-card-border dark:border-card-border-dark">
                    Usage Limits & Priority
                  </span>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="usageLimit" label="Global Usage Limit (0=∞)">
                        <InputNumber className="w-full h-10 rounded-xl font-mono text-xs" min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="perUserLimit" label="Per User Limit">
                        <InputNumber className="w-full h-10 rounded-xl font-mono text-xs" min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="priority" label="Evaluation Priority (Higher applies first)">
                    <Slider min={1} max={10} marks={{ 1: "1", 10: "10" }} />
                  </Form.Item>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </PageContainer>
  );
};

export default CreatePromotionPage;
