import React, { useState, useEffect } from "react";
import { Product } from "@/model/Product";
import { DropdownOption } from "../page";
import { ProductVariant } from "@/model/ProductVariant";
import VariantList from "./VariantList";
import VariantFormModal from "./VariantFormModal";
import MarkdownDescriptionEditor from "@/components/MarkdownDescriptionEditor";
import { useAIChat } from "@/contexts/AIChatContext";

import toast from "react-hot-toast";
import { IconUpload, IconPackage } from "@tabler/icons-react";
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
  const { setContextData, setContextTitle, clearContext } = useAIChat();
  const [form] = Form.useForm();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Watch fields for calculations
  const sellingPrice = Form.useWatch("sellingPrice", form) || 0;
  const discount = Form.useWatch("discount", form) || 0;
  const watchedName = Form.useWatch("name", form) || "";
  const watchedCategory = Form.useWatch("category", form) || "";
  const watchedBrand = Form.useWatch("brand", form) || "";
  const watchedGender = Form.useWatch("gender", form) || [];
  const allValues = Form.useWatch([], form);

  const isEditing = !!product;

  useEffect(() => {
    if (open) {
      setContextTitle(
        isEditing
          ? `Product: ${watchedName || "Loading..."}`
          : "New Product Draft",
      );
    } else {
      clearContext();
    }
  }, [open, isEditing, watchedName, setContextTitle, clearContext]);

  useEffect(() => {
    if (open && allValues) {
      setContextData({
        ...allValues,
        variants: variants, // Variants are managed in state, not form directly
      });
    }
  }, [open, allValues, variants, setContextData]);

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
        title={isEditing ? "Modify Product" : "New Entry"}
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
          <Row gutter={[24, 24]}>
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

              <div className="flex justify-between items-center mt-4 md:mt-0 mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  Description
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Add "Non-Genuine" Disclaimer
                  </span>
                  <Switch
                    size="small"
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
                            description: currentDesc + disclaimer,
                          });
                        }
                      } else {
                        form.setFieldsValue({
                          description: currentDesc.replace(disclaimer, ""),
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <Form.Item name="description" className="mb-6">
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

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
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
                <Col xs={24} md={12}>
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
              </Row>

              <Form.Item
                name="gender"
                label="Target Audience"
                className="mt-4 md:mt-0"
              >
                <Select mode="multiple" placeholder="Select Target">
                  <Option value="men">Men</Option>
                  <Option value="women">Women</Option>
                  <Option value="kids">Kids</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Pricing</Divider>
          <div className="bg-gray-50 p-6 rounded-md border border-gray-100 mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="sellingPrice"
                  label="Selling Price"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="marketPrice" label="Market Price">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="buyingPrice" label="Cost Price">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="discount" label="Discount %">
                  <InputNumber style={{ width: "100%" }} min={0} max={100} />
                </Form.Item>
              </Col>
            </Row>
            {discount > 0 && sellingPrice > 0 && (
              <div className="text-right text-green-600 font-bold">
                Discounted Price: Rs.{" "}
                {Math.round((sellingPrice * (1 - discount / 100)) / 10) * 10}
              </div>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="listing"
                label="Public Listing"
                valuePropName="checked"
              >
                <Switch checkedChildren="VISIBLE" unCheckedChildren="HIDDEN" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="status"
                label="Active Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
              </Form.Item>
            </Col>
          </Row>

          {isEditing && (
            <>
              <Divider orientation="left">Variants</Divider>
              <VariantList
                variants={variants}
                onAddVariant={handleOpenAddVariant}
                onEditVariant={handleOpenEditVariant}
                onDeleteVariant={handleDeleteVariant}
              />
            </>
          )}
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
