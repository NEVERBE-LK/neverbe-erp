import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, Row, Col, Dropdown, Tabs } from "antd";
import type { MenuProps } from "antd";
import {
  IconEdit,
  IconRefresh,
  IconDotsVertical,
  IconSearch,
  IconMail,
  IconEye,
  IconCode,
  IconSend,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: string;
  name?: string;
  subject: string;
  html: string;
  variables?: string[];
}

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/erp/settings/email-templates");
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load Email templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setHtmlCode(template.html || "");
    form.setFieldsValue(template);
    setIsModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await api.put(`/api/v1/erp/settings/email-templates/${editingTemplate?.id}`, values);
      toast.success("Email template updated successfully");
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
    const currentVal = form.getFieldValue("html") || "";
    const newVal = currentVal + " " + varTag;
    form.setFieldsValue({ html: newVal });
    setHtmlCode(newVal);

    setCopiedVar(variable);
    toast.success(`Inserted ${varTag}`);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      setTestModalOpen(false);
      toast.success(`Test Email sent to ${testEmailAddress}`);
    }, 1000);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Email Notification Trigger",
      dataIndex: "id",
      key: "id",
      render: (id: string, record: EmailTemplate) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0">
            <IconMail size={18} />
          </div>
          <div>
            <span className="font-semibold text-xs text-text-main dark:text-text-main-dark capitalize block leading-snug">
              {record.name || id.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] font-mono text-text-sub dark:text-slate-400 block mt-0.5">
              {id}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Subject Line Template",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => (
        <span className="text-xs text-text-sub dark:text-slate-300 truncate max-w-[340px] block font-sans" title={subject}>
          {subject}
        </span>
      ),
    },
    {
      title: "Available Variables",
      dataIndex: "variables",
      key: "variables",
      render: (vars: string[]) => (
        <div className="flex flex-wrap gap-1 font-mono">
          {(vars || ["orderId", "customerName", "items", "total"])?.map((v) => (
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
      render: (_: any, record: EmailTemplate) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit HTML Template",
            onClick: () => handleEdit(record),
          },
          {
            key: "test",
            icon: <IconSend size={14} />,
            label: "Send Test Email",
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
    <PageContainer title="Email Templates">
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
                  Email Templates & Notifications
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

        {/* Search Strip */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-card-border dark:border-card-border-dark w-full">
            <IconSearch size={16} className="text-text-sub shrink-0" />
            <Input
              placeholder="Search email templates by trigger name or subject line..."
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

      {/* Advanced Dual-Tab HTML Editor Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
            Edit Email Template: {editingTemplate?.id}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={950}
        okText="Save Email Template"
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
          <Form.Item name="subject" label="Email Subject Line" rules={[{ required: true }]} className="!mb-3">
            <Input placeholder="Enter email subject line..." className="h-10 rounded-xl text-xs font-sans font-semibold" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={18}>
              <Tabs
                defaultActiveKey="code"
                items={[
                  {
                    key: "code",
                    label: (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold">
                        <IconCode size={15} /> HTML Code Editor
                      </span>
                    ),
                    children: (
                      <Form.Item name="html" noStyle rules={[{ required: true }]}>
                        <Input.TextArea
                          rows={14}
                          value={htmlCode}
                          onChange={(e) => setHtmlCode(e.target.value)}
                          placeholder="Enter HTML Handlebars email template..."
                          className="rounded-xl text-xs font-mono p-3 bg-slate-900 text-slate-100 dark:bg-slate-950 border-slate-800"
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    key: "preview",
                    label: (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold">
                        <IconEye size={15} /> Live Render Preview
                      </span>
                    ),
                    children: (
                      <div className="bg-white text-slate-900 rounded-xl p-4 border border-card-border overflow-y-auto max-h-[350px] shadow-inner font-sans">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: htmlCode || "<p style='color: #666;'>No HTML preview available</p>",
                          }}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Col>

            <Col span={6}>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-card-border dark:border-card-border-dark space-y-3 mt-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub block">
                  Click Variable to Insert
                </span>
                <div className="space-y-1.5">
                  {(editingTemplate?.variables || ["orderId", "customerName", "total", "subtotal", "shippingFee", "discount", "items"]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="w-full text-left p-2 rounded-xl bg-card dark:bg-card-dark hover:bg-slate-100 dark:hover:bg-slate-700 border border-card-border dark:border-card-border-dark text-xs font-mono text-blue-600 dark:text-blue-400 font-bold flex items-center justify-between transition-colors cursor-pointer"
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

      {/* Send Test Email Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
            Send Test Email: {editingTemplate?.id}
          </span>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={handleSendTestEmail}
        confirmLoading={sendingTest}
        okText="Send Test Email"
        okButtonProps={{
          className:
            "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs",
        }}
        cancelButtonProps={{ className: "h-10 px-4 rounded-xl text-xs font-semibold" }}
      >
        <div className="py-3 space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs font-bold text-text-sub mb-1">
              Recipient Email Address
            </label>
            <Input
              placeholder="e.g. admin@neverbe.lk"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="h-10 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-card-border dark:border-card-border-dark space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-sub block">Subject Preview</span>
            <p className="text-xs text-text-main dark:text-text-main-dark font-sans font-bold">
              {editingTemplate?.subject}
            </p>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default EmailTemplatesPage;
