import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { ShippingRule } from "@/model/ShippingRule";
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Switch,
  InputNumber,
  Checkbox,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import { IconPlus, IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";

const ShippingSettingsPage = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [form] = Form.useForm();
  const isIncremental = Form.useWatch("isIncremental", form);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/procurement/shipping-rules");
      res.data.sort(
        (a: ShippingRule, b: ShippingRule) => a.minWeight - b.minWeight,
      );
      setRules(res.data);
    } catch (error: Error | unknown) {
      console.error(error);
      toast.error("Error fetching rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenDialog = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule);
      form.setFieldsValue({
        name: rule.name,
        minWeight: rule.minWeight,
        maxWeight: rule.maxWeight,
        rate: rule.rate,
        isActive: rule.isActive,
        isIncremental: rule.isIncremental || false,
        baseWeight: rule.baseWeight || 1,
        perKgRate: rule.perKgRate || 0,
      });
    } else {
      setEditingRule(null);
      form.resetFields();
      form.setFieldsValue({
        minWeight: 0,
        maxWeight: 0,
        rate: 0,
        isActive: true,
        baseWeight: 1,
        perKgRate: 0,
      });
    }
    setOpen(true);
  };

  const handleSave = async (values: Record<string, any>) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        minWeight: parseFloat(values.minWeight),
        maxWeight: parseFloat(values.maxWeight),
        rate: parseFloat(values.rate),
        isActive: values.isActive,
        isIncremental: values.isIncremental,
        baseWeight: values.isIncremental
          ? parseFloat(values.baseWeight)
          : undefined,
        perKgRate: values.isIncremental
          ? parseFloat(values.perKgRate)
          : undefined,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      if (editingRule) {
        await api.put(
          `/api/v1/erp/procurement/shipping-rules/${editingRule.id}`,
          formData,
        );
        toast.success("RULE UPDATED");
      } else {
        await api.post("/api/v1/erp/procurement/shipping-rules", formData);
        toast.success("RULE CREATED");
      }
      setOpen(false);
      fetchRules();
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
      await api.delete(`/api/v1/erp/procurement/shipping-rules/${id}`);
      toast.success("RULE DELETED");
      fetchRules();
    } catch (error: Error | unknown) {
      toast.error("Error deleting rule");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">{text}</span>
      ),
    },
    {
      title: "Calculation",
      key: "calculation",
      render: (_: any, record: ShippingRule) => (
        <div className="flex flex-col font-mono">
          <span className="text-xs text-text-main dark:text-text-main-dark">
            {record.isIncremental ? "Incremental Rate" : "Flat Rate"}
          </span>
          <span className="text-[10px] text-text-sub dark:text-slate-500">
            {record.minWeight}kg – {record.maxWeight}kg
          </span>
        </div>
      ),
    },
    {
      title: "Rates",
      key: "rates",
      render: (_: any, record: ShippingRule) =>
        record.isIncremental ? (
          <div className="flex flex-col font-mono text-xs text-text-main dark:text-text-main-dark">
            <span>
              Base: Rs {record.rate} <span className="text-[10px] text-text-sub">(up to {record.baseWeight}kg)</span>
            </span>
            <span className="text-[10px] text-text-sub dark:text-slate-400">
              + Rs {record.perKgRate}/kg (extra)
            </span>
          </div>
        ) : (
          <span className="font-bold font-mono text-xs text-text-main dark:text-text-main-dark">
            Rs {record.rate.toLocaleString()}
          </span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (active: boolean) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
            active
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: any, record: ShippingRule) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Rule",
            onClick: () => handleOpenDialog(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
            label: <span className="font-semibold text-rose-600 dark:text-rose-400">Delete Rule</span>,
            onClick: () => handleDelete(record.id!),
          },
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Shipping Rates">
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
                  Shipping Rates & Logistics
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {rules.length} Rules
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
            New Rule
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 800 }}
              columns={columns}
              dataSource={rules}
              rowKey="id"
              loading={loading}
              locale={{ emptyText: "No Active Rules" }}
              pagination={false}
            />
          </div>
        </div>

        {/* Create / Edit Modal */}
        <Modal
          open={open}
          title={
            <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
              {editingRule ? "Edit Shipping Rule" : "New Shipping Rule"}
            </span>
          }
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Rule"
          okButtonProps={{ className: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs" }}
          cancelButtonProps={{ className: "h-10 px-4 rounded-xl text-xs font-semibold" }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              isActive: true,
              minWeight: 0,
              maxWeight: 0,
              rate: 0,
              isIncremental: false,
            }}
            className="py-2 space-y-3 font-mono text-xs"
          >
            <Form.Item
              name="name"
              label="Rule Name"
              rules={[{ required: true }]}
              className="!mb-3"
            >
              <Input placeholder="e.g. STANDARD DELIVERY" className="h-10 rounded-xl text-xs" />
            </Form.Item>

            <Form.Item name="isIncremental" valuePropName="checked" className="!mb-3">
              <Checkbox>Incremental Calculation (Base + Per Kg)</Checkbox>
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                name="minWeight"
                label="Min Weight (kg)"
                rules={[{ required: true }]}
                className="!mb-3"
              >
                <InputNumber min={0} step={0.01} className="w-full h-10 rounded-xl text-xs" />
              </Form.Item>
              <Form.Item
                name="maxWeight"
                label="Max Weight (kg)"
                rules={[{ required: true }]}
                className="!mb-3"
              >
                <InputNumber min={0} step={0.01} className="w-full h-10 rounded-xl text-xs" />
              </Form.Item>
            </div>

            <Form.Item
              name="rate"
              label={isIncremental ? "Base Rate (LKR)" : "Flat Rate (LKR)"}
              rules={[{ required: true }]}
              className="!mb-3"
            >
              <InputNumber min={0} className="w-full h-10 rounded-xl text-xs" />
            </Form.Item>

            {isIncremental && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-card-border dark:border-card-border-dark space-y-3">
                <Form.Item
                  name="baseWeight"
                  label="Base Weight Limit (kg)"
                  rules={[{ required: isIncremental }]}
                  className="!mb-2"
                >
                  <InputNumber min={0} step={0.1} className="w-full h-10 rounded-xl text-xs" />
                </Form.Item>
                <Form.Item
                  name="perKgRate"
                  label="Extra Cost Per Kg (LKR)"
                  rules={[{ required: isIncremental }]}
                  className="!mb-0"
                >
                  <InputNumber min={0} className="w-full h-10 rounded-xl text-xs" />
                </Form.Item>
              </div>
            )}

            <Form.Item
              name="isActive"
              label="Active Status"
              valuePropName="checked"
              className="!mb-0"
            >
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default ShippingSettingsPage;
