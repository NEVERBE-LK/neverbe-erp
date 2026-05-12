import React, { useEffect, useState } from "react";
import { Table, Card, Button, Input, Modal, Form, Space, Typography, Tag, Divider, Row, Col } from "antd";
import { IconEdit, IconCheck, IconRefresh, IconMail, IconVariable, IconCode } from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import toast from "react-hot-toast";

const { Text, Title } = Typography;

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

  const columns = [
    {
      title: "Template Name",
      dataIndex: "id",
      key: "id",
      render: (id: string, record: EmailTemplate) => (
        <div className="flex flex-col">
          <Text strong className="text-[13px] capitalize">{record.name || id.replace(/_/g, ' ')}</Text>
          <Text type="secondary" className="text-[10px] font-mono">{id}</Text>
        </div>
      )
    },
    {
      title: "Subject Line",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => (
        <Text className="text-[13px] italic text-gray-600 truncate max-w-[300px]" title={subject}>
          {subject}
        </Text>
      )
    },
    {
      title: "Variables",
      dataIndex: "variables",
      key: "variables",
      render: (vars: string[]) => (
        <div className="flex flex-wrap gap-1">
          {(vars || ["orderId", "customerName", "items", "total"])?.map(v => (
             <Tag key={v} className="bg-emerald-50 border-emerald-100 text-emerald-700 text-[10px] font-mono py-0">{`{{${v}}}`}</Tag>
          ))}
        </div>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: 'right' as const,
      render: (_, record: EmailTemplate) => (
        <Button 
          type="text" 
          icon={<IconEdit size={18} className="text-emerald-600" />} 
          onClick={() => handleEdit(record)}
        />
      )
    }
  ];

  return (
    <PageContainer title="Email Templates">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <IconMail size={24} />
            </div>
            <div>
              <Title level={4} className="!m-0 capitalize">Professional Email Templates</Title>
              <Text type="secondary" className="text-xs">Manage HTML notifications and customer order updates</Text>
            </div>
          </div>
          <Button icon={<IconRefresh size={18} />} onClick={fetchTemplates} className="rounded-xl h-10 px-6 font-bold flex items-center gap-2">
            Refresh
          </Button>
        </div>

        <Card className="rounded-2xl border-gray-100 shadow-xl shadow-gray-200/50" bodyStyle={{ padding: 0 }}>
          <Table 
            columns={columns} 
            dataSource={templates} 
            loading={loading}
            rowKey="id"
            pagination={false}
            className="custom-table"
          />
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
             <IconEdit className="text-blue-600" size={20} />
             <span className="font-bold uppercase tracking-tight">Edit Email Template: {editingTemplate?.id}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={1000}
        okText="Save Changes"
        okButtonProps={{ loading, className: "bg-blue-600 rounded-lg h-10 px-8 font-bold" }}
        cancelButtonProps={{ className: "rounded-lg h-10 px-6" }}
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="py-4 space-y-6">
          <Form.Item name="subject" label={<span className="font-bold text-gray-700">Email Subject Line</span>} rules={[{ required: true }]}>
             <Input placeholder="Enter subject line..." className="rounded-xl border-gray-200 h-11" />
          </Form.Item>

          <Row gutter={24}>
            <Col span={18}>
                <Form.Item name="html" label={<span className="font-bold text-gray-700 flex items-center gap-1"><IconCode size={14} /> HTML Content (Handlebars)</span>} rules={[{ required: true }]}>
                  <Input.TextArea 
                    rows={20} 
                    placeholder="Enter HTML template content..." 
                    className="rounded-xl border-gray-200 shadow-sm font-mono text-xs leading-relaxed" 
                  />
                </Form.Item>
            </Col>
            <Col span={6}>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 sticky top-0">
                <div className="flex items-center gap-2 mb-4">
                  <IconVariable size={18} className="text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Variables</span>
                </div>
                <div className="space-y-2">
                  {["orderId", "customerName", "total", "subtotal", "shippingFee", "discount", "items", "paymentMethod", "paymentStatus"].map(v => (
                    <div key={v} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm group hover:border-blue-200 transition-all">
                       <code className="text-[11px] text-blue-600 font-bold group-hover:text-blue-700">{`{{${v}}}`}</code>
                    </div>
                  ))}
                </div>
                <Divider className="my-4" />
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-[10px] leading-relaxed">
                  <strong className="block mb-1">Items Loop:</strong>
                  Use <code>{`{{#each items}} ... {{/each}}`}</code> to display multiple ordered items.
                </div>
                <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-[10px] leading-relaxed italic">
                  <strong>Warning:</strong> Be careful with HTML syntax. Invalid tags may cause emails to break in some clients.
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default EmailTemplatesPage;
