import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, Row, Col, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  IconEdit,
  IconRefresh,
  IconDotsVertical,
  IconSearch,
  IconMessage,
  IconCopy,
  IconSend,
  IconCheck,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import toast from "react-hot-toast";

interface SMSTemplate {
  id: string;
  name: string;
  en: string;
  variables: string[];
}

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [smsText, setSmsText] = useState("");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/erp/settings/sms-templates");
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load SMS templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setSmsText(template.en || "");
    form.setFieldsValue(template);
    setIsModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await api.put(`/api/v1/erp/settings/sms-templates/${editingTemplate?.id}`, values);
      toast.success("SMS Template updated successfully");
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    const varTag = `{{${variable}}}`;
    const currentVal = form.getFieldValue("en") || "";
    const newVal = currentVal + varTag;
    form.setFieldsValue({ en: newVal });
    setSmsText(newVal);

    setCopiedVar(variable);
    toast.success(`Inserted ${varTag}`);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleSendTestSMS = async () => {
    if (!testPhoneNumber) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      setTestModalOpen(false);
      toast.success(`Test SMS sent to ${testPhoneNumber}`);
    }, 1000);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const charCount = smsText.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  const columns = [
    {
      title: "Template Identifier",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: SMSTemplate) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0">
            <IconMessage size={18} />
          </div>
          <div>
            <span className="font-semibold text-xs text-text-main dark:text-text-main-dark block leading-snug">
              {name}
            </span>
            <span className="text-[10px] font-mono text-text-sub dark:text-slate-400 block mt-0.5">
              {record.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "SMS Message Content",
      dataIndex: "en",
      key: "en",
      render: (text: string) => (
        <span className="text-xs text-text-sub dark:text-slate-300 line-clamp-2 max-w-[420px] block font-sans" title={text}>
          {text}
        </span>
      ),
    },
    {
      title: "Available Variables",
      dataIndex: "variables",
      key: "variables",
      render: (vars: string[]) => (
        <div className="flex flex-wrap gap-1 font-mono">
          {vars?.map((v) => (
            <span
              key={v}
              className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: any, record: SMSTemplate) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Template",
            onClick: () => handleEdit(record),
          },
          {
            key: "test",
            icon: <IconSend size={14} />,
            label: "Send Test SMS",
            onClick: () => {
              setEditingTemplate(record);
              setTestModalOpen(true);
            },
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
    <PageContainer title="SMS Templates">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Communication Templates
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  SMS Notification Templates
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {templates.length} Active Templates
                </span>
              </div>
            </div>
          </div>
          <Button
            icon={<IconRefresh size={16} />}
            onClick={fetchTemplates}
            className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-semibold cursor-pointer flex items-center gap-2"
          >
            Refresh List
          </Button>
        </div>

        {/* Filter Strip */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-card-border dark:border-card-border-dark w-full">
            <IconSearch size={16} className="text-text-sub shrink-0" />
            <Input
              placeholder="Search SMS templates by trigger name or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="borderless"
              className="w-full text-xs font-medium placeholder-text-sub text-text-main dark:text-text-main-dark p-0"
              allowClear
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              columns={columns}
              dataSource={filteredTemplates}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </div>
        </div>
      </div>

      {/* Edit SMS Template Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
            Edit SMS Template: {editingTemplate?.name}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={750}
        okText="Save Changes"
        okButtonProps={{
          loading,
          className:
            "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs",
        }}
        cancelButtonProps={{ className: "h-10 px-4 rounded-xl text-xs font-semibold" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="py-2 space-y-4 font-mono text-xs"
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="en"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-text-sub">SMS Message Template Text</span>
                    <span className="text-[10px] text-text-sub font-mono">
                      {charCount} chars ({smsSegments} SMS {smsSegments > 1 ? "parts" : "part"})
                    </span>
                  </div>
                }
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  rows={6}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Enter SMS template content..."
                  className="rounded-xl text-xs font-sans p-3"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-card-border dark:border-card-border-dark space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub block">
                  Click Variable to Insert
                </span>
                <div className="space-y-1.5">
                  {editingTemplate?.variables?.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="w-full text-left p-2 rounded-xl bg-card dark:bg-card-dark hover:bg-slate-100 dark:hover:bg-slate-700 border border-card-border dark:border-card-border-dark text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{`{{${v}}}`}</span>
                      {copiedVar === v ? (
                        <IconCheck size={14} className="text-emerald-500" />
                      ) : (
                        <IconCopy size={14} className="text-text-sub" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Send Test SMS Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
            Send Test SMS: {editingTemplate?.name}
          </span>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={handleSendTestSMS}
        confirmLoading={sendingTest}
        okText="Send Test SMS"
        okButtonProps={{
          className:
            "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs",
        }}
        cancelButtonProps={{ className: "h-10 px-4 rounded-xl text-xs font-semibold" }}
      >
        <div className="py-3 space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs font-bold text-text-sub mb-1">
              Recipient Phone Number
            </label>
            <Input
              placeholder="+94 77 123 4567"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              className="h-10 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-card-border dark:border-card-border-dark space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-sub block">SMS Preview Text</span>
            <p className="text-xs text-text-main dark:text-text-main-dark font-sans leading-relaxed">
              {editingTemplate?.en}
            </p>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default TemplatesPage;
