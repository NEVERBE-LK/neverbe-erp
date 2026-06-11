import React, { useState, useEffect } from "react";
import { ProductVariant } from "@/model/ProductVariant";
import { DropdownOption } from "../page";
import { IconPhotoPlus, IconX } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  Modal,
  Form,
  Input,
  Button,
  Upload,
  Switch,
  Divider,
  Space,
  Select,
} from "antd";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface VariantFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
  variant: ProductVariant | null;
  sizes: DropdownOption[];
  productId: string;
}

const VariantFormModal: React.FC<VariantFormModalProps> = ({
  open,
  onClose,
  onSave,
  variant,
  sizes,
  productId,
}) => {
  const [form] = Form.useForm();
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImages, setCurrentImages] = useState<any[]>([]);


  const isEditing = !!variant;
  const isNewVariant =
    !isEditing || (variant && variant.variantId.startsWith("var_"));

  useEffect(() => {
    if (open) {
      if (variant) {
        form.setFieldsValue(variant);
        setCurrentImages(variant.images || []);
      } else {
        form.resetFields();
        form.setFieldsValue({
          variantId: `var_${Date.now()}`,
          status: true,
          sizes: [],
        });
        setCurrentImages([]);
      }
      setNewImageFiles([]);
      setIsSaving(false);
    }
  }, [variant, open, form]);

  const beforeUpload = (file: File) => {
    if (
      !ALLOWED_FILE_TYPES.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".heic") &&
      !file.name.toLowerCase().endsWith(".heif")
    ) {
      toast.error(`${file.name}: Invalid Type`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name}: Too Large (>20MB)`);
      return Upload.LIST_IGNORE;
    }
    setNewImageFiles((prev) => [...prev, file]);
    return false;
  };

  const removeNewFile = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };



  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const formDataPayload = new FormData();
      const data = {
        variantId: String(values.variantId || variant?.variantId),
        variantName: String(values.variantName),
        sizes: values.sizes || [],
        images: currentImages || [],
        status: values.status ?? true,
      };

      formDataPayload.append("data", JSON.stringify(data));

      newImageFiles.forEach((file) => {
        formDataPayload.append("attachment", file, file.name); // Standardized to 'attachment' or multiple? Usually 'attachment' for single, but here it's multiple. Backend should handle 'newImages' or similar.
      });

      const varId = String(values.variantId || variant?.variantId);
      const url = isNewVariant
        ? `/api/v1/erp/master/products/${productId}/variants`
        : `/api/v1/erp/master/products/${productId}/variants/${varId}`;

      const response = isNewVariant
        ? await api.post(url, formDataPayload)
        : await api.put(url, formDataPayload);

      onSave(response.data);
      toast.success(`Variant ${isNewVariant ? "added" : "updated"}`);
      onClose();
    } catch (error: unknown) {
      console.error("Failed to save variant:", error);
      toast.error("Failed to save variant");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Variant" : "Add Variant"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSaving}
      width={600}
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="variantId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="variantName"
          label="Variant Name"
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g. Red / Limited Edition" />
        </Form.Item>

        <Form.Item label="Size Availability" name="sizes">
          <Select
            mode="multiple"
            placeholder="Select available sizes..."
            style={{ width: "100%" }}
            allowClear
          >
            {sizes.map((s) => (
              <Select.Option key={s.id} value={s.label}>
                {s.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="status" label="Active Status" valuePropName="checked">
          <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
        </Form.Item>

        <Divider orientation={"left" as any}>Gallery</Divider>

        <div className="mb-4">
          <Upload beforeUpload={beforeUpload} multiple showUploadList={false}>
            <Button icon={<IconPhotoPlus size={16} />}>Add Images</Button>
          </Upload>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Existing Images */}
          {currentImages.map((img, i) => (
            <div key={i} className="relative w-20 h-20 border border-gray-200">
              <img
                src={img.url}
                className="w-full h-full object-cover"
                alt="cloud"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}

          {/* New Images */}
          {newImageFiles.map((file, i) => (
            <div key={i} className="relative w-20 h-20 border border-gray-200">
              <img
                src={URL.createObjectURL(file)}
                className="w-full h-full object-cover opacity-80"
                alt="local"
              />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  );
};

export default VariantFormModal;
