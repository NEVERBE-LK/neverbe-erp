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
  Typography,
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
  entry: PettyCash | null; // null = create, otherwise edit
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

  // Dropdown data
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(
    [],
  );
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; label: string }[]
  >([]);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  const isEditing = !!entry;
  const isDisabled = isEditing && entry?.status === "APPROVED";
  const typeValue = Form.useWatch("type", form);
  const paymentMethodValue = Form.useWatch("paymentMethod", form);

  // Initial Data Load
  useEffect(() => {
    if (open) {
      if (entry) {
        form.setFieldsValue({
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
        form.setFieldsValue({
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

  // Fetch Categories when Type changes
  useEffect(() => {
    if (open && typeValue) {
      fetchCategories(typeValue);
    }
  }, [open, typeValue]);

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get(
        "/api/v1/erp/finance/bank-accounts?dropdown=true",
        {},
      );
      setBankAccounts(res.data);
    } catch (error) {
      console.error("Error fetching banks", error);
    }
  };

  const fetchCategories = async (type: "expense" | "income") => {
    setFetchingDropdowns(true);
    try {
      const res = await api.get(
        `/api/v1/erp/finance/expense-categories?dropdown=true&type=${type}`,
        {},
      );
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

      toast.success(isEditing ? "ENTRY UPDATED" : "ENTRY CREATED");
      onSave();
      onClose();
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Entry" : "New Entry"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText={isEditing ? "Save Changes" : "Create Entry"}
      width={700}
    >
      {isDisabled && (
        <Alert
          message="LOCKED: Entry Approved"
          type="success"
          showIcon
          className="mb-4"
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isDisabled || saving}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" size="large" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Type">
              <Select size="large">
                <Option value="expense">EXPENSE</Option>
                <Option value="income">INCOME</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount (LKR)"
              rules={[{ required: true }]}
            >
              <InputNumber
                className="w-full"
                style={{ width: "100%" }}
                size="large"
                min={0}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true }]}
        >
          <Select
            placeholder={fetchingDropdowns ? "Loading..." : "Select Category"}
            loading={fetchingDropdowns}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.label}>
                {cat.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="note"
          label="Note / Description"
          rules={[{ required: true }]}
        >
          <TextArea rows={3} placeholder="Enter details..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="paymentMethod" label="Payment Method">
              <Select>
                <Option value="cash">CASH</Option>
                <Option value="card">CARD / ONLINE</Option>
                <Option value="transfer">BANK TRANSFER</Option>
              </Select>
            </Form.Item>
          </Col>
          {(paymentMethodValue === "transfer" ||
            paymentMethodValue === "card") && (
            <Col span={12}>
              <Form.Item
                name="bankAccountId"
                label="Bank Account"
                rules={[{ required: true, message: "Select Bank" }]}
              >
                <Select placeholder="Select Bank...">
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

        <Form.Item label="Attachment (Optional)">
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            maxCount={1}
            onRemove={() => setFile(null)}
          >
            <Button icon={<IconUpload size={16} />}>Click to Upload</Button>
          </Upload>
          {isEditing && entry?.attachment && (
            <div className="mt-2">
              <a
                href={entry.attachment}
                target="_blank"
                className="text-green-600 flex items-center gap-1 text-xs hover:underline"
              >
                <IconPaperclip size={12} /> View Current File
              </a>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PettyCashFormModal;
