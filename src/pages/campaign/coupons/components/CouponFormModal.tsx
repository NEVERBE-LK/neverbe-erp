import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/model/Coupon";
import {
  IconTicket,
  IconCalendarEvent,
  IconTag,
  IconUser,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import AIDescriptionTextarea from "@/components/AIDescriptionTextarea";
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
  Typography,
  Card,
  Divider,
  Space,
} from "antd";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  coupon: Coupon | null;
}

const emptyCoupon: Partial<Coupon> = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  maxDiscount: 0,
  minOrderAmount: 0,
  isActive: true,
  usageLimit: 0,
  perUserLimit: 1,
  firstOrderOnly: false,
};

const CouponFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  coupon,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEditing = !!coupon;

  useEffect(() => {
    if (open) {
      if (coupon) {
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
          ...coupon,
          startDate: parseDate(coupon.startDate),
          endDate: parseDate(coupon.endDate),
        });
      } else {
        form.setFieldsValue({
          ...emptyCoupon,
          startDate: dayjs(),
          endDate: null,
        });
      }
    } else {
      form.resetFields();
    }
  }, [open, coupon, form]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        code: values.code?.toUpperCase(),
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        usageLimit: Number(values.usageLimit),
        perUserLimit: Number(values.perUserLimit),
        minOrderAmount: Number(values.minOrderAmount),
        discountValue: Number(values.discountValue),
        maxDiscount: values.maxDiscount
          ? Number(values.maxDiscount)
          : undefined,
      };

      if (isEditing && coupon) {
        await api.put(`/api/v1/erp/master/coupons/${coupon.id}`, payload);
        toast.success("COUPON UPDATED");
      } else {
        await api.post("/api/v1/erp/master/coupons", payload);
        toast.success("COUPON CREATED");
      }
      onSave();
    } catch (e: any) {
      console.error("Save failed", e);
      toast.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <IconTicket size={24} className="text-green-600" />
          <span>{isEditing ? "Edit Coupon" : "New Coupon"}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Coupon"
      width={1000}
      maskClosable={false}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={emptyCoupon}
      >
        <Row gutter={24}>
          {/* Left Column: Basic Details */}
          <Col xs={24} md={12}>
            <Card title="Coupon Details" size="small" className="mb-4">
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[{ required: true, message: "Code is required" }]}
              >
                <Input
                  placeholder="E.G. SUMMER20"
                  size="large"
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                />
              </Form.Item>

              <Form.Item name="name" label="Internal Name">
                <Input placeholder="e.g. Summer Sale" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description (Customer Facing)"
              >
                <AIDescriptionTextarea
                  aiContext={{
                    name:
                      form.getFieldValue("name") || form.getFieldValue("code"),
                    category: "Coupon",
                  }}
                  rows={2}
                  placeholder="GET 20% OFF YOUR NEXT ORDER"
                  disabled={saving}
                />
              </Form.Item>

              <Form.Item name="isActive" label="Status" valuePropName="checked">
                <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
              </Form.Item>
            </Card>

            <Card title="Validity Period" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="startDate"
                    label="Start Date"
                    rules={[
                      { required: true, message: "Start date is required" },
                    ]}
                  >
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

          {/* Right Column: Config & Limits */}
          <Col xs={24} md={12}>
            <Card
              title="Discount Logic"
              size="small"
              className="mb-4 bg-gray-50 border-gray-200"
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="discountType" label="Discount Type">
                    <Select>
                      <Option value="PERCENTAGE">PERCENTAGE %</Option>
                      <Option value="FIXED">FIXED AMOUNT</Option>
                      <Option value="FREE_SHIPPING">FREE SHIPPING</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="discountValue" label="Value">
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      className="font-bold text-green-600"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, current) =>
                      prev.discountType !== current.discountType
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("discountType") === "PERCENTAGE" ? (
                        <Form.Item
                          name="maxDiscount"
                          label="Max Cap (Optional)"
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            placeholder="Optional"
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="minOrderAmount" label="Min Order Amount">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Usage Limits" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="usageLimit" label="Global Limit (0 = ∞)">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="perUserLimit" label="User Limit">
                    <InputNumber style={{ width: "100%" }} min={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Form.Item name="firstOrderOnly" valuePropName="checked" noStyle>
                <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded hover:border-gray-200 transition-colors">
                  <Form.Item
                    name="firstOrderOnly"
                    valuePropName="checked"
                    noStyle
                  >
                    <Switch size="small" />
                  </Form.Item>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      New Customers Only
                    </span>
                    <span className="text-xs text-gray-400">
                      Valid for first order
                    </span>
                  </div>
                </label>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CouponFormModal;
