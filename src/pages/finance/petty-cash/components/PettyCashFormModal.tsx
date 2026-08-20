import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { IconUpload, IconPaperclip } from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import toast from "react-hot-toast";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Upload,
  Alert,
  Row,
  Col,
  DatePicker,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface PettyCashFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  entry: PettyCash | null;
}

const PettyCashFormModal: React.FC<PettyCashFormModalProps> = ({
  open,
  onClose,
  onSave,
  entry,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string }[]>([]);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  const isEditing = !!entry;
  const isDisabled = isEditing && entry?.status === "APPROVED";
  const typeValue = Form.useWatch("type", form);
  const paymentMethodValue = Form.useWatch("paymentMethod", form);

  useEffect(() => {
    if (open) {
      if (entry) {
        form.setFieldsValue({
          voucherNo: entry.voucherNo || `PCV-${entry.id?.slice(-6).toUpperCase()}`,
          payee: entry.payee || "",
          amount: entry.amount,
          category: entry.category,
          note: entry.note,
          paymentMethod: entry.paymentMethod || "cash",
          type: entry.type || "expense",
          bankAccountId: entry.bankAccountId,
          date: entry.date ? dayjs(entry.date) : dayjs(),
        });
      } else {
        form.resetFields();
        const randId = Math.floor(1000 + Math.random() * 9000);
        form.setFieldsValue({
          voucherNo: `PCV-${dayjs().format("YYMM")}-${randId}`,
          paymentMethod: "cash",
          type: "expense",
          date: dayjs(),
        });
      }
      setFile(null);
      setSaving(false);
      fetchBankAccounts();
    }
  }, [entry, open, form]);

  useEffect(() => {
    if (open && typeValue) {
      fetchCategories(typeValue);
    }
  }, [open, typeValue]);

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get("/api/v1/erp/finance/bank-accounts?dropdown=true");
      setBankAccounts(res.data);
    } catch (error) {
      console.error("Error fetching banks", error);
    }
  };

  const fetchCategories = async (type: "expense" | "income") => {
    setFetchingDropdowns(true);
    try {
      const res = await api.get(`/api/v1/erp/finance/expense-categories?dropdown=true&type=${type}`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    } finally {
      setFetchingDropdowns(false);
    }
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const formPayload = new FormData();
      const data: any = {
        voucherNo: values.voucherNo,
        payee: values.payee,
        amount: Number(values.amount),
        date: values.date.format("YYYY-MM-DD"),
        category: values.category,
        note: values.note,
        paymentMethod: values.paymentMethod,
        type: values.type,
      };

      if (values.bankAccountId) {
        data.bankAccountId = values.bankAccountId;
        const bank = bankAccounts.find((b) => b.id === values.bankAccountId);
        if (bank) data.bankAccountName = bank.label;
      }

      if (!isEditing) {
        data.status = "PENDING";
      }

      formPayload.append("data", JSON.stringify(data));

      if (file) {
        formPayload.append("attachment", file);
      }

      const url = isEditing
        ? `/api/v1/erp/finance/petty-cash/${entry!.id}`
        : "/api/v1/erp/finance/petty-cash";

      if (isEditing) {
        await api.put(url, formPayload);
      } else {
        await api.post(url, formPayload);
      }

      toast.success(isEditing ? "VOUCHER UPDATED" : "VOUCHER CREATED");
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="text-sm font-bold text-text-main dark:text-text-main-dark font-mono uppercase">
          {isEditing ? "Edit Petty Cash Voucher" : "New Petty Cash Voucher"}
        </span>
      }
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText={isEditing ? "Save Changes" : "Create Voucher"}
      width={680}
      footer={
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={saving} className="rounded-xl h-10 font-bold text-xs">
            Cancel
          </Button>
          {!isDisabled && (
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none rounded-xl h-10 px-5 font-bold text-xs cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Create Voucher"}
            </Button>
          )}
        </div>
      }
    >
      {isDisabled && (
        <Alert
          message="LOCKED: Voucher Approved & Reconciled"
          type="success"
          showIcon
          className="mb-4 rounded-xl"
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isDisabled || saving}
        className="pt-2 font-mono text-xs"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="voucherNo" label={<span className="text-xs font-bold text-text-sub uppercase">Voucher #</span>} rules={[{ required: true }]}>
              <Input className="rounded-xl h-10 font-mono" placeholder="e.g. PCV-2026-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label={<span className="text-xs font-bold text-text-sub uppercase">Voucher Date</span>} rules={[{ required: true }]}>
              <DatePicker className="w-full h-10 rounded-xl" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="payee" label={<span className="text-xs font-bold text-text-sub uppercase">Payee / Recipient</span>}>
              <Input className="rounded-xl h-10 font-sans" placeholder="Person / Vendor name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label={<span className="text-xs font-bold text-text-sub uppercase">Voucher Type</span>}>
              <Select className="h-10">
                <Option value="expense">EXPENSE</Option>
                <Option value="income">INCOME / REPLENISH</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label={<span className="text-xs font-bold text-text-sub uppercase">Amount (LKR)</span>}
              rules={[{ required: true }]}
            >
              <InputNumber
                className="w-full h-10 rounded-xl font-mono"
                min={0}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label={<span className="text-xs font-bold text-text-sub uppercase">Category</span>}
              rules={[{ required: true }]}
            >
              <Select
                placeholder={fetchingDropdowns ? "Loading..." : "Select Category"}
                loading={fetchingDropdowns}
                className="h-10"
              >
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.label}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="note"
          label={<span className="text-xs font-bold text-text-sub uppercase">Description / Purpose</span>}
          rules={[{ required: true }]}
        >
          <TextArea rows={3} placeholder="Enter voucher details, purpose, or receipt reference..." className="rounded-xl font-sans" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="paymentMethod" label={<span className="text-xs font-bold text-text-sub uppercase">Payment Method</span>}>
              <Select className="h-10">
                <Option value="cash">CASH</Option>
                <Option value="card">CARD / ONLINE</Option>
                <Option value="transfer">BANK TRANSFER</Option>
              </Select>
            </Form.Item>
          </Col>
          {(paymentMethodValue === "transfer" || paymentMethodValue === "card") && (
            <Col span={12}>
              <Form.Item
                name="bankAccountId"
                label={<span className="text-xs font-bold text-text-sub uppercase">Bank Account</span>}
                rules={[{ required: true, message: "Select Bank" }]}
              >
                <Select placeholder="Select Bank..." className="h-10">
                  {bankAccounts.map((acc) => (
                    <Option key={acc.id} value={acc.id}>
                      {acc.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item label={<span className="text-xs font-bold text-text-sub uppercase">Receipt / Voucher Attachment (Optional)</span>}>
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            maxCount={1}
            onRemove={() => setFile(null)}
          >
            <Button icon={<IconUpload size={16} />} className="rounded-xl h-10 text-xs font-bold font-mono">
              Click to Upload Receipt
            </Button>
          </Upload>
          {isEditing && entry?.attachment && (
            <div className="mt-2 font-mono">
              <a
                href={entry.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs hover:underline"
              >
                <IconPaperclip size={14} /> View Current Receipt Attachment
              </a>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PettyCashFormModal;
