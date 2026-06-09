import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCreditCard,
  IconPhoto,
  IconPercentage,
  IconWorld,
  IconBuildingStore,
  IconUpload,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { PaymentMethod } from "@/model/PaymentMethod";
import { auth } from "@/firebase/firebaseClient";
import api from "@/lib/api";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Tag,
  Switch,
  InputNumber,
  Space,
  Tooltip,
  Image,
  Upload,
  Divider,
  Row,
  Col,
  Card,
} from "antd";

const { TextArea } = Input;

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/finance/payment-methods");
      const validData = res.data.filter((m: PaymentMethod) => !m.isDeleted);
      setMethods(validData);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchMethods();
    }
  }, [auth.currentUser]);

  const handleOpenDialog = (method?: PaymentMethod) => {
    setImageFile(null);
    if (method) {
      setEditingMethod(method);
      setImagePreview(method.imageUrl || "");
      form.setFieldsValue({
        name: method.name,
        fee: method.fee,
        customerFee: method.customerFee || 0,
        status: method.status,
        description: method.description || "",
        paymentId: method.paymentId || "",
        available: method.available || ["Store"],
      });
    } else {
      setEditingMethod(null);
      setImagePreview("");
      form.resetFields();
      form.setFieldsValue({
        fee: 0,
        customerFee: 0,
        status: true,
        available: ["Store"],
      });
    }
    setOpen(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(values));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingMethod) {
        await api.put(
          `/api/v1/erp/finance/payment-methods/${editingMethod.id}`,
          formData,
        );
        toast.success("Payment method updated");
      } else {
        await api.post("/api/v1/erp/finance/payment-methods", formData);
        toast.success("Payment method created");
      }
      setOpen(false);
      setImageFile(null);
      setImagePreview("");
      fetchMethods();
    } catch (error: Error | unknown) {
      console.error(error);
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/erp/finance/payment-methods/${id}`);
      toast.success("Payment method deleted");
      fetchMethods();
    } catch (error) {
      toast.error("Error deleting method");
    } finally {
      setDeletingId(null);
    }
  };

  const getChannelIcon = (ch: string) => {
    if (ch === "Website") return <IconWorld size={12} />;
    return <IconBuildingStore size={12} />;
  };

  return (
    <PageContainer title="Payment Methods" description="Manage payment gateway and POS payment options">
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Settings / Finance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Payment Methods
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={() => handleOpenDialog()}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-xl text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            Add New Method
          </Button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Methods</span>
            <p className="text-2xl font-black text-gray-900 mt-1">{methods.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Active</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{methods.filter(m => m.status).length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">With Merchant Fee</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{methods.filter(m => m.fee > 0).length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Online</span>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {methods.filter(m => m.available?.includes("Website")).length}
            </p>
          </div>
        </div>

        {/* METHODS GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="text-xs font-bold text-gray-400">Loading payment methods...</span>
          </div>
        ) : methods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <IconCreditCard size={48} className="text-gray-200" />
            <span className="text-sm font-bold text-gray-400">No payment methods configured</span>
            <Button type="primary" onClick={() => handleOpenDialog()} className="bg-black border-none rounded-xl">
              Create First Method
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`relative bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${
                  method.status ? "border-gray-100" : "border-gray-200 opacity-60"
                }`}
              >
                {/* Status dot */}
                <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${method.status ? "bg-emerald-500" : "bg-gray-300"}`} />

                <div className="flex items-start gap-4 mb-4">
                  {/* Image or icon */}
                  {method.imageUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50">
                      <Image
                        src={method.imageUrl}
                        alt={method.name}
                        width={56}
                        height={56}
                        className="object-contain"
                        preview={{
                          mask: <span className="text-[8px] font-bold">View</span>,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <IconCreditCard size={24} className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-gray-900 truncate">{method.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-gray-400 block mt-0.5">
                      {method.paymentId || "—"}
                    </span>
                    {method.description && (
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{method.description}</p>
                    )}
                  </div>
                </div>

                {/* Fee info */}
                <div className="flex gap-2 mb-4">
                  {method.fee > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      <IconPercentage size={11} />
                      {method.fee}% Merchant Fee
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                      No Fee
                    </span>
                  )}
                  {(method.customerFee ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      Rs. {method.customerFee} Customer Fee
                    </span>
                  )}
                </div>

                {/* Channels */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {method.available?.map((ch) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-50 text-gray-600 border border-gray-100 uppercase tracking-wider"
                    >
                      {getChannelIcon(ch)} {ch}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<IconEdit size={15} className="text-gray-400 hover:text-emerald-600" />}
                      onClick={() => handleOpenDialog(method)}
                      className="hover:bg-emerald-50 rounded-lg"
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<IconTrash size={15} />}
                      loading={deletingId === method.id}
                      onClick={() => {
                        Modal.confirm({
                          title: "Delete Payment Method?",
                          content: `This will deactivate "${method.name}" across all channels.`,
                          okText: "Delete",
                          okButtonProps: { danger: true },
                          onOk: () => handleDelete(method.id!),
                        });
                      }}
                      className="hover:bg-red-50 rounded-lg"
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE/EDIT MODAL */}
        <Modal
          open={open}
          title={
            <div className="flex items-center gap-2 py-1">
              <IconCreditCard size={20} className="text-emerald-600" />
              <span className="font-black text-sm text-gray-800 uppercase tracking-wider">
                {editingMethod ? "Edit Payment Method" : "New Payment Method"}
              </span>
            </div>
          }
          onCancel={() => {
            setOpen(false);
            setImageFile(null);
            setImagePreview("");
          }}
          footer={
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => {
                  setOpen(false);
                  setImageFile(null);
                  setImagePreview("");
                }}
                className="h-10 rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={saving}
                className="bg-emerald-600 hover:bg-emerald-700 border-none h-10 rounded-xl font-bold px-6"
              >
                {editingMethod ? "Update Method" : "Create Method"}
              </Button>
            </div>
          }
          width={840}
          styles={{ body: { padding: "24px" } }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{ status: true, fee: 0, customerFee: 0, available: ["Store"] }}
          >
            {/* Image Upload */}
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center gap-3">
                {imagePreview ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-200 bg-gray-50 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <IconPhoto size={28} className="text-gray-300" />
                  </div>
                )}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    return false;
                  }}
                >
                  <Button
                    icon={<IconUpload size={14} />}
                    size="small"
                    className="text-[10px] font-bold rounded-lg"
                  >
                    {imagePreview ? "Change Image" : "Upload Logo"}
                  </Button>
                </Upload>
              </div>
            </div>

            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  name="name"
                  label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Method Name</span>}
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input className="h-10 rounded-lg border-gray-200" placeholder="e.g. Visa/Mastercard" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="paymentId"
                  label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment ID</span>}
                  rules={[{ required: true, message: "ID is required" }]}
                >
                  <Input
                    className="h-10 rounded-lg border-gray-200 font-mono"
                    placeholder="PM-001"
                    disabled={!!editingMethod}
                    onChange={(e) => {
                      form.setFieldsValue({
                        paymentId: e.target.value.toUpperCase(),
                      });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</span>}
            >
              <TextArea
                rows={2}
                placeholder="Brief description of this payment method..."
                className="rounded-lg border-gray-200"
              />
            </Form.Item>

            <Form.Item
              name="available"
              label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Channels</span>}
            >
              <Select
                mode="multiple"
                placeholder="Select channels"
                className="rounded-lg"
                options={[
                  { value: "Store", label: "🏪 In-Store / POS" },
                  { value: "Website", label: "🌐 Website / Online" },
                ]}
              />
            </Form.Item>

            <Divider className="my-4">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Fee Structure</span>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="fee"
                  label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Merchant Fee (%)</span>}
                  rules={[{ required: true }]}
                  tooltip="Fee percentage charged to us by the payment gateway (not visible to customers)"
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    className="w-full h-10 rounded-lg"
                    addonAfter="%"
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerFee"
                  label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Fee (Rs)</span>}
                  tooltip="Flat fee added to the customer's total when they select this payment method"
                >
                  <InputNumber
                    min={0}
                    step={1}
                    className="w-full h-10 rounded-lg"
                    addonBefore="Rs"
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="status"
              label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Status</span>}
              valuePropName="checked"
            >
              <Switch
                checkedChildren="ACTIVE"
                unCheckedChildren="INACTIVE"
                className="bg-gray-300"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default PaymentMethodsPage;
