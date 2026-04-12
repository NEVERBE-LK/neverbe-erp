import React, { useEffect, useState } from "react";
import { Table, Tag, Card, Input, Space, Button, Typography, Modal, Descriptions, Form, Select, Row, Col, Divider } from "antd";
import { IconSearch, IconEye, IconRefresh, IconMessage2, IconCheck, IconAlertTriangle, IconSend, IconPlus, IconTemplate, IconMail, IconLanguage } from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../components/container/PageContainer";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

interface NotificationLog {
  id: string;
  orderId: string;
  type: string;
  to: string;
  content: string;
  status?: string;
  createdAt: any;
  hashValue?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  en: string;
  si: string;
  ta: string;
}

const CommunicationsPage = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Helper for permission
  const canCompose = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN" || currentUser?.permissions?.includes("send_custom_notifications");
  
  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [form] = Form.useForm();
  const [msgType, setMsgType] = useState<"sms" | "email">("sms");

  useEffect(() => {
    fetchLogs();
    fetchTemplates();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/erp/communications?limit=100");
      setLogs(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch communication logs:", error);
      toast.error("Failed to load communication history");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/api/v1/erp/settings/sms-templates");
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handleSend = async (values: any) => {
    try {
      setSending(true);
      await api.post("/api/v1/erp/communications", {
        ...values,
        type: msgType,
      });
      toast.success("Message sent successfully");
      setIsComposeOpen(false);
      form.resetFields();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: SMSTemplate) => {
    // For manual send, we combine them for convenience or just use one.
    // Here we'll just use the EN one as a base or let them choose.
    const content = template.en || template.si || template.ta;
    form.setFieldsValue({ content });
  };

  const filteredLogs = logs.filter(log => 
    log.orderId?.toLowerCase().includes(searchText.toLowerCase()) ||
    log.to?.toLowerCase().includes(searchText.toLowerCase()) ||
    log.type?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: any) => (
        <Text className="text-gray-500 text-xs">
          {dayjs(date?.toDate?.() || date?.seconds ? date.seconds * 1000 : date).format("MMM DD, YYYY HH:mm")}
        </Text>
      ),
      sorter: (a: any, b: any) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (id: string) => (
        <Text strong className="text-emerald-700">{id === "CUSTOM" ? "N/A" : `#${id?.toUpperCase()}`}</Text>
      ),
    },
    {
      title: "Channel",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const isEmail = type?.includes("email");
        return (
          <Tag color={isEmail ? "blue" : "green"} className="rounded-full px-3 uppercase text-[10px] font-bold">
            {type?.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Recipient",
      dataIndex: "to",
      key: "to",
      render: (to: string) => <Text className="text-xs font-medium">{to}</Text>,
    },
    {
      title: "Content Preview",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (content: string) => <Text className="text-gray-500 text-xs">{content || "Template-based message"}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => status ? (
        <Tag color="cyan" className="rounded-full text-[10px] font-black uppercase">{status}</Tag>
      ) : <Tag color="default" className="rounded-full text-[10px] font-black uppercase">SENT</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: NotificationLog) => (
        <Button 
          type="text" 
          icon={<IconEye size={18} />} 
          onClick={() => setSelectedLog(record)}
          className="hover:text-emerald-600"
        />
      ),
    },
  ];

  return (
    <PageContainer title="Communication Center">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <Title level={4} className="!m-0 text-gray-800">Communication Logs</Title>
            <Text className="text-gray-400 text-xs">Track all outbound customer interactions</Text>
          </div>
          <Space size="middle">
            <Input
              placeholder="Search Order, Phone or Email..."
              prefix={<IconSearch size={16} className="text-gray-400" />}
              className="w-full md:w-72 h-10 rounded-xl"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            {canCompose && (
              <Button 
                 type="primary"
                 icon={<IconPlus size={18} />} 
                 onClick={() => setIsComposeOpen(true)}
                 className="h-10 px-6 rounded-xl font-bold bg-emerald-600 border-none flex items-center gap-2"
              >
                Compose
              </Button>
            )}
            <Button 
              icon={<IconRefresh size={18} />} 
              onClick={fetchLogs}
              className="h-10 w-10 flex items-center justify-center rounded-xl border-gray-200"
            />
          </Space>
        </div>

        <Card className="rounded-2xl border-gray-100 shadow-xl shadow-gray-200/50" bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 15, position: ["bottomCenter"] }}
            className="custom-table"
          />
        </Card>
      </div>

      {/* Compose Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <IconMessage2 className="text-emerald-600" size={20} />
            <span className="font-bold">Compose Custom Message</span>
          </div>
        }
        open={isComposeOpen}
        onCancel={() => setIsComposeOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={sending}
        okText="Send Message"
        okButtonProps={{ className: "bg-emerald-600 h-10 px-8 rounded-lg font-bold" }}
        cancelButtonProps={{ className: "h-10 px-6 rounded-lg" }}
        width={750}
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={handleSend} className="py-6">
          <Row gutter={24}>
            <Col span={16}>
               <div className="space-y-4">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Channel" required>
                         <Select value={msgType} onChange={setMsgType} className="h-10 rounded-xl">
                            <Option value="sms">SMS Message</Option>
                            <Option value="email">Email Notification</Option>
                         </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="orderId" label="Link to Order (Optional)">
                         <Input placeholder="e.g. WB1234" className="h-10 rounded-xl" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="to" label={msgType === 'sms' ? "Recipient Phone" : "Recipient Email"} rules={[{ required: true }]}>
                    <Input placeholder={msgType === 'sms' ? "+9477..." : "customer@example.com"} className="h-10 rounded-xl" />
                  </Form.Item>

                  {msgType === 'email' && (
                    <Form.Item name="subject" label="Email Subject" rules={[{ required: true }]}>
                       <Input placeholder="Enter message subject..." className="h-10 rounded-xl" />
                    </Form.Item>
                  )}

                  <Form.Item name="content" label="Message Content" rules={[{ required: true }]}>
                    <Input.TextArea rows={6} placeholder="Type your message here..." className="rounded-xl" />
                  </Form.Item>
               </div>
            </Col>
            <Col span={8}>
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <IconTemplate size={18} className="text-gray-400" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Use Template</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[350px]">
                     {templates.map(t => (
                       <div 
                         key={t.id} 
                         onClick={() => applyTemplate(t)}
                         className="bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-emerald-500 transition-colors shadow-sm group"
                       >
                          <div className="text-[10px] font-bold text-gray-800 group-hover:text-emerald-600">{t.name}</div>
                          <div className="text-[9px] text-gray-400 mt-1 line-clamp-2">{t.en}</div>
                       </div>
                     ))}
                  </div>
                  <Divider className="my-4" />
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-[10px] leading-relaxed italic">
                    <strong>Tip:</strong> Templates selected here will use the EN version as a base for your custom edits.
                  </div>
               </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IconEye size={20} />
            </div>
            <span className="font-bold">Message Details</span>
          </div>
        }
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedLog(null)} className="rounded-lg h-10 px-8 font-bold">
            Close
          </Button>
        ]}
        width={600}
        className="rounded-2xl overflow-hidden"
      >
        {selectedLog && (
          <div className="py-4 space-y-6">
            <Descriptions bordered size="small" column={1} className="rounded-lg overflow-hidden border-gray-100">
              <Descriptions.Item label="Order ID" labelStyle={{ fontWeight: 'bold', width: '30%' }}>
                <Text strong className="text-emerald-700">{selectedLog.orderId === "CUSTOM" ? "N/A" : `#${selectedLog.orderId?.toUpperCase()}`}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Channel" labelStyle={{ fontWeight: 'bold' }}>
                {selectedLog.type?.replace("_", " ").toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Recipient" labelStyle={{ fontWeight: 'bold' }}>
                {selectedLog.to}
              </Descriptions.Item>
              <Descriptions.Item label="Date Sent" labelStyle={{ fontWeight: 'bold' }}>
                {dayjs(selectedLog.createdAt?.toDate?.() || selectedLog.createdAt?.seconds ? selectedLog.createdAt.seconds * 1000 : selectedLog.createdAt).format("MMMM DD, YYYY HH:mm:ss")}
              </Descriptions.Item>
              {selectedLog.status && (
                <Descriptions.Item label="Status Hook" labelStyle={{ fontWeight: 'bold' }}>
                  {selectedLog.status}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col gap-3">
              <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400">Content</Text>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono italic">
                {selectedLog.content || "Content was rendered from a Handlebars template."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default CommunicationsPage;
