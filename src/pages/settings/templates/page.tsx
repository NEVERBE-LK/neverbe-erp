import React, { useEffect, useState } from "react";
import { Table, Card, Button, Input, Modal, Form, Space, Typography, Tag, Divider, Row, Col } from "antd";
import { IconEdit, IconCheck, IconRefresh, IconFileText, IconLanguage, IconVariable } from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import toast from "react-hot-toast";

const { Text, Title } = Typography;

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
    form.setFieldsValue(template);
    setIsModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await api.put(`/api/v1/erp/settings/sms-templates/${editingTemplate?.id}`, values);
      toast.success("Template updated successfully");
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
      dataIndex: "name",
      key: "name",
      render: (name: string, record: SMSTemplate) => (
        <div className="flex flex-col">
          <Text strong className="text-[13px]">{name}</Text>
          <Text type="secondary" className="text-[10px] font-mono">{record.id}</Text>
        </div>
      )
    },
    {
      title: "Languages",
      key: "languages",
      align: 'center' as const,
      render: (_, record: SMSTemplate) => (
        <Space size="small">
          {record.en && <Tag color="blue" className="text-[10px] uppercase font-bold px-2 rounded-full">EN</Tag>}
        </Space>
      )
    },
    {
      title: "Variables",
      dataIndex: "variables",
      key: "variables",
      render: (vars: string[]) => (
        <div className="flex flex-wrap gap-1">
          {vars?.map(v => (
             <Tag key={v} className="bg-gray-100 border-none text-[10px] font-mono py-0">{`{{${v}}}`}</Tag>
          ))}
        </div>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: 'right' as const,
      render: (_, record: SMSTemplate) => (
        <Button 
          type="text" 
          icon={<IconEdit size={18} className="text-emerald-600" />} 
          onClick={() => handleEdit(record)}
        />
      )
    }
  ];

  return (
    <PageContainer title="SMS Templates">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <IconFileText size={24} />
            </div>
            <div>
              <Title level={4} className="!m-0 capitalize">Dynamic SMS Templates</Title>
              <Text type="secondary" className="text-xs">Manage multilingual order alerts and system messages</Text>
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
             <IconEdit className="text-emerald-600" size={20} />
             <span className="font-bold">Edit SMS Template: {editingTemplate?.name}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Update Template"
        okButtonProps={{ loading, className: "bg-emerald-600 rounded-lg h-10 px-8 font-bold" }}
        cancelButtonProps={{ className: "rounded-lg h-10 px-6" }}
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="py-4 space-y-6">
          <Row gutter={24}>
            <Col span={16}>
              <div className="space-y-6">
                <Form.Item name="en" label={<span className="font-bold text-blue-600 flex items-center gap-1"><IconLanguage size={14} /> English Content</span>} rules={[{ required: true }]}>
                  <Input.TextArea rows={4} placeholder="English version..." className="rounded-xl border-gray-200 shadow-sm" />
                </Form.Item>
              </div>
            </Col>
            <Col span={8}>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 sticky top-0">
                <div className="flex items-center gap-2 mb-4">
                  <IconVariable size={18} className="text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Available Variables</span>
                </div>
                <div className="space-y-3">
                  {editingTemplate?.variables?.map(v => (
                    <div key={v} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                       <code className="text-xs text-emerald-600 font-bold">{`{{${v}}}`}</code>
                       <div className="text-[9px] text-gray-400 mt-0.5">Placeholder for customer {v}</div>
                    </div>
                  ))}
                </div>
                <Divider className="my-4" />
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-[10px] leading-relaxed italic">
                  <strong>Note:</strong> Avoid excessive length to minimize SMS costs.
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TemplatesPage;
