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
  IconDotsVertical,
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
  Switch,
  InputNumber,
  Upload,
  Row,
  Col,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";

const { TextArea } = Input;

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <PageContainer title="Payment Methods">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                System Administration
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Payment Gateway Methods
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {methods.length} Total
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={() => handleOpenDialog()}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Add New Method
          </Button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-text-sub">Total Methods</span>
            <p className="text-xl font-bold text-text-main dark:text-text-main-dark mt-1">{methods.length}</p>
          </div>
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Active</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{methods.filter(m => m.status).length}</p>
          </div>
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">With Merchant Fee</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{methods.filter(m => m.fee > 0).length}</p>
          </div>
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-text-sub">Online Enabled</span>
            <p className="text-xl font-bold text-text-main dark:text-text-main-dark mt-1">
              {methods.filter(m => m.available?.includes("Website")).length}
            </p>
          </div>
        </div>

        {/* METHODS GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="text-xs font-mono font-bold text-text-sub">Loading payment methods...</span>
          </div>
        ) : methods.length === 0 ? (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-12 text-center rounded-2xl shadow-xs space-y-3">
            <IconCreditCard size={48} className="mx-auto text-text-sub" />
            <p className="text-xs font-bold text-text-sub">No payment methods configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((method) => {
              const menuItems: MenuProps["items"] = [
                {
                  key: "edit",
                  icon: <IconEdit size={14} />,
                  label: "Edit Method",
                  onClick: () => handleOpenDialog(method),
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
                  label: <span className="font-semibold text-rose-600 dark:text-rose-400">Delete Method</span>,
                  onClick: () => handleDelete(method.id!),
                },
              ];

              return (
                <div
                  key={method.id}
                  className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {method.imageUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-card-border dark:border-card-border-dark bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                            <img
                              src={method.imageUrl}
                              alt={method.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-card-border dark:border-card-border-dark text-text-sub">
                            <IconCreditCard size={20} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-text-main dark:text-text-main-dark truncate">{method.name}</h3>
                          <span className="text-[10px] font-mono text-text-sub block mt-0.5">
                            {method.paymentId || "—"}
                          </span>
                        </div>
                      </div>

                      <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <IconDotsVertical size={16} />
                        </button>
                      </Dropdown>
                    </div>

                    {method.description && (
                      <p className="text-xs text-text-sub dark:text-slate-400 mb-3 line-clamp-2">{method.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3 font-mono">
                      {method.fee > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          <IconPercentage size={10} />
                          {method.fee}% Merchant Fee
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          No Fee
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-card-border dark:border-card-border-dark font-mono">
                    <div className="flex flex-wrap gap-1">
                      {method.available?.map((ch) => (
                        <span
                          key={ch}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-text-sub border border-card-border dark:border-card-border-dark uppercase"
                        >
                          {getChannelIcon(ch)} {ch}
                        </span>
                      ))}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                        method.status
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${method.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {method.status ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE/EDIT MODAL */}
        <Modal
          open={open}
          title={
            <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
              {editingMethod ? "Edit Payment Method" : "New Payment Method"}
            </span>
          }
          onCancel={() => {
            setOpen(false);
            setImageFile(null);
            setImagePreview("");
          }}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Method"
          okButtonProps={{ className: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs" }}
          cancelButtonProps={{ className: "h-10 px-4 rounded-xl text-xs font-semibold" }}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{ status: true, fee: 0, customerFee: 0, available: ["Store"] }}
            className="py-2 space-y-3 font-mono text-xs"
          >
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center gap-2">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-card-border dark:border-card-border-dark bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-card-border dark:border-card-border-dark bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <IconPhoto size={24} className="text-text-sub" />
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
                    {imagePreview ? "Change Logo" : "Upload Logo"}
                  </Button>
                </Upload>
              </div>
            </div>

            <Row gutter={16}>
              <Col span={14}>
                <Form.Item name="name" label="Method Name" rules={[{ required: true }]} className="!mb-3">
                  <Input placeholder="e.g. Visa/Mastercard" className="h-10 rounded-xl text-xs font-sans" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="paymentId" label="Payment ID" rules={[{ required: true }]} className="!mb-3">
                  <Input placeholder="PM-001" disabled={!!editingMethod} className="h-10 rounded-xl text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description" className="!mb-3">
              <TextArea rows={2} placeholder="Brief description..." className="rounded-xl text-xs font-sans" />
            </Form.Item>

            <Form.Item name="available" label="Available Channels" className="!mb-3">
              <Select
                mode="multiple"
                placeholder="Select channels"
                className="w-full rounded-xl"
                options={[
                  { value: "Store", label: "In-Store / POS" },
                  { value: "Website", label: "Website / Online" },
                ]}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="fee" label="Merchant Fee (%)" rules={[{ required: true }]} className="!mb-3">
                  <InputNumber min={0} step={0.01} className="w-full h-10 rounded-xl text-xs" addonAfter="%" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="customerFee" label="Customer Fee (%)" rules={[{ required: true }]} className="!mb-3">
                  <InputNumber min={0} step={0.01} className="w-full h-10 rounded-xl text-xs" addonAfter="%" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="status" label="Active Status" valuePropName="checked" className="!mb-0">
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default PaymentMethodsPage;
