import React, { useState, useEffect } from "react";
import { Product } from "@/model/Product";
import { DropdownOption } from "../page";
import { ProductVariant } from "@/model/ProductVariant";
import VariantList from "./VariantList";
import VariantFormModal from "./VariantFormModal";
import MarkdownDescriptionEditor from "@/components/MarkdownDescriptionEditor";
import { suggestProductAttributes } from "@/actions/aiActions";
import toast from "react-hot-toast";
import { IconUpload, IconPackage, IconSparkles } from "@tabler/icons-react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Upload,
  Divider,
  Tabs,
  Tag,
  Spin,
} from "antd";

const { Option } = Select;

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyProduct: Omit<Product, "itemId"> & {
  itemId: string | null;
  productId: string;
} = {
  itemId: null,
  productId: "",
  name: "",
  category: "",
  brand: "",
  description: "",
  thumbnail: { order: 0, url: "", file: "" },
  variants: [],
  weight: 0,
  buyingPrice: 0,
  sellingPrice: 0,
  marketPrice: 0,
  discount: 0,
  listing: true,
  status: true,
  tags: [],
  gender: [],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product, file: File | null) => void;
  product: Product | null;
  brands: DropdownOption[];
  categories: DropdownOption[];
  sizes: DropdownOption[];
  saving: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSave,
  product,
  brands,
  categories,
  sizes,
  saving,
}) => {
  const [form] = Form.useForm();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Watch fields for calculations
  const sellingPrice = Form.useWatch("sellingPrice", form) || 0;
  const buyingPrice = Form.useWatch("buyingPrice", form) || 0;
  const discount = Form.useWatch("discount", form) || 0;
  const watchedName = Form.useWatch("name", form) || "";
  const watchedCategory = Form.useWatch("category", form) || "";
  const watchedBrand = Form.useWatch("brand", form) || "";
  const watchedGender = Form.useWatch("gender", form) || [];
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggestAttributes = async () => {
    const name = form.getFieldValue("name");
    if (!name) {
      toast.error("Please fill in the product name first");
      return;
    }
    setSuggesting(true);
    try {
      const category = form.getFieldValue("category");
      const brand = form.getFieldValue("brand");
      const description = form.getFieldValue("description");

      const suggestions = await suggestProductAttributes({
        name,
        category,
        brand,
        description,
      });

      form.setFieldsValue({
        gender: suggestions.gender || [],
        occasion: suggestions.occasion || [],
        style: suggestions.style || [],
        season: suggestions.season || [],
        fit: suggestions.fit || undefined,
        material: suggestions.material || undefined,
      });

      toast.success("AI suggested attributes applied!");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message ?? "Failed to auto-select attributes");
    } finally {
      setSuggesting(false);
    }
  };

  const isEditing = !!product;

  useEffect(() => {
    if (open) {
      if (product) {
        form.setFieldsValue({
          ...product,
          gender: product.gender || [],
        });
        setVariants(product.variants || []);
      } else {
        form.resetFields();
        form.setFieldsValue({
          listing: true,
          status: true,
          weight: 0,
          sellingPrice: 0,
          buyingPrice: 0,
          marketPrice: 0,
          discount: 0,
          gender: [],
        });
        setVariants([]);
      }
      setThumbnailFile(null);
    }
  }, [product, open, form]);

  const handleValidSubmit = async (values: Record<string, any>) => {
    // Manual Validation for Thumbnail
    if (!isEditing && !thumbnailFile) {
      toast.error("Thumbnail is required for new products");
      return;
    }

    const finalProductData = {
      ...(product || {}),
      ...values,
      variants: variants || [],
    };

    onSave(finalProductData as Product, thumbnailFile);
  };

  const handleFileChange = (file: File) => {
    if (
      !ALLOWED_FILE_TYPES.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".heic") &&
      !file.name.toLowerCase().endsWith(".heif")
    ) {
      toast.error("Invalid file type (JPG/PNG/WEBP/HEIC only)");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large (>20MB)");
      return false;
    }
    setThumbnailFile(file);
    return false; // Prevent auto upload
  };

  // --- Variant Handlers ---
  const handleOpenAddVariant = () => {
    setEditingVariantIndex(null);
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (index: number) => {
    setEditingVariantIndex(index);
    setIsVariantModalOpen(true);
  };

  const handleDeleteVariant = async (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveVariant = (variantData: ProductVariant) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      const variantIdToUpdate = variantData.variantId;

      const existingIndex = newVariants.findIndex(
        (v) => v.variantId === variantIdToUpdate,
      );

      if (existingIndex !== -1) {
        newVariants[existingIndex] = variantData;
      } else if (
        editingVariantIndex !== null &&
        editingVariantIndex < newVariants.length
      ) {
        newVariants[editingVariantIndex] = variantData;
      } else {
        newVariants.push(variantData);
      }
      return newVariants;
    });
  };

  const editingVariant =
    isEditing &&
    editingVariantIndex !== null &&
    variants &&
    editingVariantIndex < variants.length
      ? variants[editingVariantIndex]
      : null;

  return (
    <>
      <Modal
        open={open}
        title={isEditing ? (product?.productId ? "Modify Product" : "Duplicate Product") : "New Entry"}
        onCancel={onClose}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Save Product"
        width={1000}
        maskClosable={false}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleValidSubmit}
          disabled={saving}
        >
          <Tabs
            defaultActiveKey="1"
            type="card"
            className="product-tabs pt-2"
            items={[
              {
                key: "1",
                label: "General Info",
                children: (
                  <Row gutter={[24, 24]} className="pt-2">
                    <Col xs={24} lg={8}>
                      <Form.Item label="Main Visual" required={!isEditing}>
                        <Upload
                          beforeUpload={handleFileChange}
                          maxCount={1}
                          showUploadList={false} // Custom preview
                        >
                          <Button icon={<IconUpload size={16} />} block>
                            Select Image
                          </Button>
                        </Upload>

                        <div className="mt-4 border border-gray-200 bg-gray-50 h-64 flex items-center justify-center relative overflow-hidden rounded-md">
                          {thumbnailFile ? (
                            <img
                              src={URL.createObjectURL(thumbnailFile)}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                          ) : isEditing && product?.thumbnail?.url ? (
                            <img
                              src={product.thumbnail.url}
                              alt="Current"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-center px-4">
                              <IconPackage
                                size={48}
                                className="mx-auto mb-2 opacity-20"
                              />
                              <span className="text-xs">No Image Selected</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-2 text-center">
                          {thumbnailFile
                            ? thumbnailFile.name
                            : isEditing
                              ? "Current Image"
                              : ""}
                        </div>
                      </Form.Item>
                    </Col>

                    <Col xs={24} lg={16}>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={16}>
                            <Form.Item
                              name="name"
                              label="Product Name"
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Enter product name..." size="large" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="weight"
                              label="Weight (g)"
                              rules={[{ required: true }]}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                size="large"
                                min={0}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="category"
                              label="Category"
                              rules={[{ required: true }]}
                            >
                              <Select showSearch optionFilterProp="children">
                                {categories.map((c) => (
                                  <Option key={c.id} value={c.label}>
                                    {c.label}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="brand"
                              label="Brand"
                              rules={[{ required: true }]}
                            >
                              <Select showSearch optionFilterProp="children">
                                {brands.map((b) => (
                                  <Option key={b.id} value={b.label}>
                                    {b.label}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="material"
                              label="Material"
                            >
                              <Select placeholder="Select Material">
                                <Option value="cotton">Cotton</Option>
                                <Option value="polyester">Polyester</Option>
                                <Option value="linen">Linen</Option>
                                <Option value="nylon">Nylon</Option>
                                <Option value="spandex">Spandex / Lycra</Option>
                                <Option value="viscose">Viscose</Option>
                                <Option value="rayon">Rayon</Option>
                                <Option value="satin">Satin</Option>
                                <Option value="velvet">Velvet</Option>
                                <Option value="fleece">Fleece</Option>
                                <Option value="knitwear">Knitwear / Acrylic</Option>
                                <Option value="leather">Leather / Faux Leather</Option>
                                <Option value="suede">Suede</Option>
                                <Option value="canvas">Canvas</Option>
                                <Option value="chiffon">Chiffon</Option>
                                <Option value="silk">Silk</Option>
                                <Option value="wool">Wool</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                          <Col xs={12}>
                            <Form.Item
                              name="listing"
                              label="Public Listing"
                              valuePropName="checked"
                              className="mb-0"
                            >
                              <Switch checkedChildren="VISIBLE" unCheckedChildren="HIDDEN" />
                            </Form.Item>
                          </Col>
                          <Col xs={12}>
                            <Form.Item
                              name="status"
                              label="Active Status"
                              valuePropName="checked"
                              className="mb-0"
                            >
                              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                )
              },
              {
                key: "2",
                label: "Financials",
                children: (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 my-2">
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          name="sellingPrice"
                          label="Selling Price"
                          rules={[{ required: true }]}
                        >
                          <InputNumber style={{ width: "100%" }} min={0} size="large" prefix="Rs." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="marketPrice" label="Market Price">
                          <InputNumber style={{ width: "100%" }} min={0} size="large" prefix="Rs." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="buyingPrice" label="Cost Price">
                          <InputNumber style={{ width: "100%" }} min={0} size="large" prefix="Rs." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="discount" label="Discount %">
                          <InputNumber style={{ width: "100%" }} min={0} max={100} size="large" suffix="%" />
                        </Form.Item>
                      </Col>
                    </Row>
                    {(sellingPrice > 0 || buyingPrice > 0) && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">Net Revenue</span>
                            <span className="font-bold text-gray-800 text-sm">
                              Rs. {Math.round((sellingPrice * (1 - discount / 100)) / 10) * 10}
                            </span>
                          </div>
                          {buyingPrice > 0 && (
                            <>
                              <div className="w-[1px] bg-gray-200 h-8 self-center" />
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">Est. Profit</span>
                                <span className={`font-bold text-sm ${(sellingPrice * (1 - discount / 100) - buyingPrice) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                  Rs. {Math.round((sellingPrice * (1 - discount / 100) - buyingPrice))}
                                </span>
                              </div>
                              <div className="w-[1px] bg-gray-200 h-8 self-center" />
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">Margin</span>
                                {(() => {
                                  const netRev = sellingPrice * (1 - discount / 100);
                                  const profit = netRev - buyingPrice;
                                  const marginPercent = netRev > 0 ? Math.round((profit / netRev) * 100) : 0;
                                  
                                  let marginColor = "red";
                                  if (marginPercent >= 40) marginColor = "green";
                                  else if (marginPercent >= 20) marginColor = "orange";
                                  
                                  return (
                                    <Tag color={marginColor} className="m-0 font-bold mt-0.5">
                                      {marginPercent}%
                                    </Tag>
                                  );
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                        {buyingPrice > 0 && sellingPrice > 0 && (sellingPrice * (1 - discount / 100) < buyingPrice) && (
                          <div className="text-xs text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 uppercase">
                            Negative Margin Warning
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: "3",
                label: "Categorization Details",
                children: (
                  <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100/50 my-2">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                        Target Attributes & Demographics
                      </span>
                      <Button
                        type="primary"
                        size="small"
                        icon={suggesting ? <Spin size="small" /> : <IconSparkles size={13} />}
                        onClick={handleSuggestAttributes}
                        loading={suggesting}
                        className="flex items-center gap-1 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-100 h-8 px-4 rounded-xl transition-all hover:scale-[1.02]"
                      >
                        {suggesting ? "ANALYZING..." : "AI Auto Select"}
                      </Button>
                    </div>
                    <Row gutter={[24, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="gender"
                          label="Target Gender"
                          className="mb-0"
                        >
                          <Select mode="multiple" placeholder="Select Gender Tags" size="large">
                            <Option value="men">Men</Option>
                            <Option value="women">Women</Option>
                            <Option value="kids">Kids</Option>
                            <Option value="unisex">Unisex</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="occasion"
                          label="Occasion"
                          className="mb-0"
                        >
                          <Select mode="multiple" placeholder="Select Occasions" size="large">
                            <Option value="casual">Casual</Option>
                            <Option value="formal">Formal</Option>
                            <Option value="business-casual">Business Casual</Option>
                            <Option value="sport">Sport / Activewear</Option>
                            <Option value="party">Party / Evening</Option>
                            <Option value="office">Office / Workwear</Option>
                            <Option value="beach">Beachwear</Option>
                            <Option value="lounge">Lounge / Home</Option>
                            <Option value="travel">Travel / Outdoor</Option>
                            <Option value="gym">Gym / Workout</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="style"
                          label="Style"
                          className="mb-0"
                        >
                          <Select mode="multiple" placeholder="Select Styles" size="large">
                            <Option value="modern">Modern</Option>
                            <Option value="vintage">Vintage</Option>
                            <Option value="streetwear">Streetwear</Option>
                            <Option value="minimalist">Minimalist</Option>
                            <Option value="boho">Boho</Option>
                            <Option value="athleisure">Athleisure</Option>
                            <Option value="classic">Classic / Preppy</Option>
                            <Option value="grunge">Grunge</Option>
                            <Option value="chic">Chic</Option>
                            <Option value="casual">Casual / Smart Casual</Option>
                            <Option value="high-fashion">High Fashion</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="season"
                          label="Season"
                          className="mb-0"
                        >
                          <Select mode="multiple" placeholder="Select Seasons" size="large">
                            <Option value="summer">Summer</Option>
                            <Option value="winter">Winter</Option>
                            <Option value="spring">Spring</Option>
                            <Option value="autumn">Autumn</Option>
                            <Option value="monsoon">Monsoon / Rainy</Option>
                            <Option value="all-season">All Season</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="fit"
                          label="Fit"
                          className="mb-0"
                        >
                          <Select placeholder="Select Fit" size="large">
                            <Option value="regular">Regular Fit</Option>
                            <Option value="slim">Slim Fit</Option>
                            <Option value="oversized">Oversized</Option>
                            <Option value="loose">Loose Fit</Option>
                            <Option value="skinny">Skinny Fit</Option>
                            <Option value="relaxed">Relaxed Fit</Option>
                            <Option value="athletic">Athletic Fit</Option>
                            <Option value="tailored">Tailored Fit</Option>
                            <Option value="boxy">Boxy Fit</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: "4",
                label: "Description",
                children: (
                  <div className="bg-white p-6 rounded-xl border border-gray-100 my-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                        Product Content
                      </span>
                      <div className="flex items-center gap-3 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <span className="text-xs text-red-600 font-bold">
                          NON-GENUINE DISCLAIMER
                        </span>
                        <Switch
                          size="small"
                          checked={(form.getFieldValue("description") || "").includes(
                            "high-quality replica product",
                          )}
                          onChange={(checked) => {
                            const currentDesc =
                              form.getFieldValue("description") || "";
                            const disclaimer =
                              '\n\n<u style="color:red; font-weight:bold;">Disclaimer: This is a high-quality replica product, not a genuine original.</u>';

                            if (checked) {
                              if (
                                !currentDesc.includes("high-quality replica product")
                              ) {
                                form.setFieldsValue({
                                  description: currentDesc.trim()
                                    ? currentDesc.trim() + disclaimer
                                    : disclaimer.trim(),
                                });
                                toast.success("Disclaimer added");
                              }
                            } else {
                              form.setFieldsValue({
                                description: currentDesc
                                  .replace(disclaimer, "")
                                  .replace(disclaimer.trim(), "")
                                  .trim(),
                              });
                              toast.success("Disclaimer removed");
                            }
                          }}
                        />
                      </div>
                    </div>
                    <Form.Item name="description" className="mb-0">
                      <MarkdownDescriptionEditor
                        productContext={{
                          name: watchedName,
                          category: watchedCategory,
                          brand: watchedBrand,
                          gender: watchedGender,
                        }}
                        disabled={saving}
                      />
                    </Form.Item>
                  </div>
                )
              },
              {
                key: "5",
                label: "Variants",
                children: (isEditing && product?.productId) ? (
                  <div className="pt-2">
                    <VariantList
                      variants={variants}
                      onAddVariant={handleOpenAddVariant}
                      onEditVariant={handleOpenEditVariant}
                      onDeleteVariant={handleDeleteVariant}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl my-2">
                    <p className="text-gray-500 font-medium mb-1">
                      Configure Variants After Saving
                    </p>
                    <p className="text-xs text-gray-400">
                      To manage colors, sizes, and specific stock lists, please save the product first, then edit it.
                    </p>
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Modal>

      {isEditing && product && (
        <VariantFormModal
          open={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          onSave={handleSaveVariant}
          variant={editingVariant}
          sizes={sizes}
          productId={product.productId}
        />
      )}
    </>
  );
};

export default ProductFormModal;
