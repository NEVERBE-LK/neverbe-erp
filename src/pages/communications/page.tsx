import React, { useEffect, useState } from "react";
import { Table, Tag, Card, Input, Space, Button, Typography, Modal, Descriptions, Form, Select, Row, Col, Divider, Tooltip } from "antd";
import { IconSearch, IconEye, IconRefresh, IconMessage2, IconCheck, IconAlertTriangle, IconSend, IconPlus, IconTemplate, IconMail, IconLanguage } from "@tabler/icons-react";
import { Link } from "react-router-dom";
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
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Helper for permission
  const canCompose = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN" || currentUser?.permissions?.includes("send_custom_notifications");
  
  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [form] = Form.useForm();
  const [msgType, setMsgType] = useState<"sms" | "email">("sms");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    fetchLogs(pagination.current, pagination.pageSize, searchText);
    fetchTemplates();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    if (!isComposeOpen) {
      setMessageText("");
      form.resetFields();
    }
  }, [isComposeOpen, form]);

  const fetchLogs = async (
    page: number = pagination.current, 
    pageSize: number = pagination.pageSize,
    search: string = searchText
  ) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/communications?page=${page}&pageSize=${pageSize}&search=${search}`);
      setLogs(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0, current: page, pageSize }));
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

  const applyTemplate = (template: SMSTemplate, lang: "en" | "si" | "ta" = "en") => {
    const content = template[lang] || template.en || template.si || template.ta || "";
    form.setFieldsValue({ content });
    setMessageText(content);
  };

  const getSMSCount = (text: string) => {
    if (!text) return { chars: 0, parts: 0, limit: 160, isUnicode: false };
    const chars = text.length;
    const isUnicode = /[^\u0000-\u007F]/.test(text);
    const limit = isUnicode ? 70 : 160;
    const parts = Math.ceil(chars / limit) || 1;
    return { chars, parts, limit, isUnicode };
  };

  const smsMetrics = getSMSCount(messageText);

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: any) => (
        <Text className="text-gray-500 text-xs">
          {date ? dayjs(date).format("DD MMM YYYY, hh:mm A") : "-"}
        </Text>
      ),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (id: string) => {
        if (id === "CUSTOM" || !id) return <Text className="text-gray-400 text-xs">N/A</Text>;
        return (
          <Link to={`/orders/${id.toLowerCase()}`} className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline text-xs">
            #{id?.toUpperCase()}
          </Link>
        );
      },
    },
    {
      title: "Channel",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const isEmail = type?.includes("email");
        let label = type?.replace("_", " ").toUpperCase();
        if (type === "ebill_sms") label = "DIGITAL RECEIPT";
        
        return (
          <Tag color={isEmail ? "blue" : "green"} className="rounded-full px-3 text-[10px] font-bold">
            {label}
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (!status) {
          return (
            <Tooltip title="Message successfully dispatched to provider">
               <Tag className="rounded-full text-[10px] font-black uppercase border-none bg-gray-100 text-gray-400">DISPATCHED</Tag>
            </Tooltip>
          );
        }
        const upper = status.toUpperCase();
        let colorClass = "bg-cyan-50 text-cyan-700";
        if (upper === "FAILED" || upper === "ERROR") {
          colorClass = "bg-red-50 text-red-700";
        } else if (upper === "COMPLETED" || upper === "SENT" || upper === "SUCCESS") {
          colorClass = "bg-green-50 text-green-700";
        } else if (upper === "PENDING" || upper === "PROCESSING") {
          colorClass = "bg-amber-50 text-amber-700";
        }
        return (
          <Tooltip title={`Status: ${status}`}>
             <Tag className={`rounded-full text-[10px] font-black uppercase border-none ${colorClass}`}>{status}</Tag>
          </Tooltip>
        );
      },
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
              onPressEnter={() => fetchLogs(1, pagination.pageSize, searchText)}
              suffix={
                searchText && (
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={() => {
                      setSearchText("");
                      fetchLogs(1, pagination.pageSize, "");
                    }}
                    className="flex justify-center items-center"
                  >
                    ×
                  </Button>
                )
              }
            />
            <Button 
              type="primary" 
              onClick={() => fetchLogs(1, pagination.pageSize, searchText)}
              className="h-10 px-4 rounded-xl"
            >
              Search
            </Button>
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
              onClick={() => fetchLogs(1, pagination.pageSize, "")}
              className="h-10 w-10 flex items-center justify-center rounded-xl border-gray-200"
            />
          </Space>
        </div>

        <Card className="rounded-2xl border-gray-100 shadow-xl shadow-gray-200/50" bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="id"
            pagination={{
              total: pagination.total,
              current: pagination.current,
              pageSize: pagination.pageSize,
              position: ["bottomCenter"],
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            scroll={{ x: 'max-content' }}
            onChange={(pag: any) => {
              setPagination(prev => ({
                ...prev,
                current: pag.current,
                pageSize: pag.pageSize,
              }));
              // fetchLogs is triggered by the useEffect on pagination state
            }}
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
                         <Select 
                           value={msgType} 
                           onChange={(val) => {
                             setMsgType(val);
                             form.resetFields(["content", "subject"]);
                             setMessageText("");
                           }} 
                           className="h-10 rounded-xl"
                         >
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

                  <Form.Item 
                    name="content" 
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>Message Content</span>
                        {msgType === "sms" && messageText.length > 0 && (
                          <span className={`text-[9px] font-bold ${smsMetrics.parts > 1 ? "text-amber-600" : "text-gray-400"}`}>
                            {smsMetrics.chars}/{smsMetrics.limit} Chars ({smsMetrics.parts} part{smsMetrics.parts > 1 ? "s" : ""})
                          </span>
                        )}
                      </div>
                    }
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea 
                      rows={6} 
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..." 
                      className="rounded-xl" 
                    />
                  </Form.Item>

                  {msgType === "sms" && (
                    <div className="flex flex-col gap-1.5 mb-4">
                      {messageText.length > 0 && (
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              smsMetrics.parts > 1
                                ? "bg-amber-500"
                                : (smsMetrics.chars / smsMetrics.limit) > 0.85
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (((smsMetrics.chars % smsMetrics.limit) || smsMetrics.limit) / smsMetrics.limit) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 px-1">
                        <span>
                          {smsMetrics.isUnicode
                            ? "✨ Unicode mode (Sinhala/Tamil character detected)"
                            : "Standard GSM 7-bit alphabet"}
                        </span>
                        <span>
                          Limit per part: {smsMetrics.limit} chars
                        </span>
                      </div>
                    </div>
                  )}
               </div>
            </Col>
            <Col span={8}>
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-[520px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <IconTemplate size={18} className="text-gray-400" />
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Use Template</span>
                    </div>
                    <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
                       {templates.map(t => (
                         <div 
                           key={t.id} 
                           className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1.5"
                         >
                            <div className="text-[10px] font-bold text-gray-800 leading-tight">{t.name}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {t.en && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "en")}
                                  className="px-2 py-0.5 text-[9px] font-black bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-md transition cursor-pointer"
                                >
                                  EN
                                </button>
                              )}
                              {t.si && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "si")}
                                  className="px-2 py-0.5 text-[9px] font-black bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-md transition cursor-pointer"
                                >
                                  සිංහල
                                </button>
                              )}
                              {t.ta && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "ta")}
                                  className="px-2 py-0.5 text-[9px] font-black bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-md transition cursor-pointer"
                                >
                                  தமிழ்
                                </button>
                              )}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div>
                    <Divider className="my-3" />
                    <div className="p-3 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-lg text-[10px] leading-relaxed">
                      <strong>Tip:</strong> Select <strong>EN</strong>, <strong>සිංහල</strong>, or <strong>தமிழ்</strong> on any template to instantly pre-fill in the selected language.
                    </div>
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
                {selectedLog.createdAt}
              </Descriptions.Item>
              {selectedLog.status && (
                <Descriptions.Item label="Status Hook" labelStyle={{ fontWeight: 'bold' }}>
                  <Tag color="cyan" className="rounded-full text-[10px] font-black uppercase border-none bg-cyan-50 text-cyan-700">{selectedLog.status}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col gap-3">
              <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400">Message Payload / Content</Text>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono italic">
                {selectedLog.content || (selectedLog.type === 'ebill_sms' ? "Digital receipt with unique tracking hash generated for the customer." : "Message content was rendered dynamically from a Handlebars template at the time of sending.")}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default CommunicationsPage;
