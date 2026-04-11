import React, { useState, useEffect } from "react";
import {
  Card,
  Timeline,
  Typography,
  Tag,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  IconMessage2,
  IconMail,
  IconSend,
  IconHistory,
  IconTemplate,
} from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CommunicationLog {
  id: string;
  type: string;
  to: string;
  content: string;
  status?: string;
  createdAt: any;
}

interface CommunicationHubProps {
  orderId: string;
  customerName?: string;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  orderId,
  customerName = "Customer",
}) => {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("sms");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${orderId}/notifications`);
      // Standardized response format: { success: true, data: [...] }
      const logsData = response.data?.data || response.data || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error("Failed to fetch notification logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchLogs();
  }, [orderId]);

  const onFinish = async (values: any) => {
    try {
      setSending(true);
      await api.post(`/api/v1/erp/orders/${orderId}/notifications`, {
        type: activeTab,
        content: values.content,
        subject: values.subject,
      });
      toast.success("Notification sent successfully");
      form.resetFields();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (templateType: string) => {
    let content = "";
    const name = customerName.split(" ")[0];
    const upperId = orderId.toUpperCase();

    if (templateType === "delay") {
      content = `NEVERBE: Hi ${name}, unfortunately your order #${upperId} is slightly delayed due to a logistics issue. We expect to ship it within 48 hours. Sorry for the trouble!`;
    } else if (templateType === "quick_update") {
      content = `NEVERBE: Hi ${name}, just a quick update that we are working on your order #${upperId}. We will notify you as soon as it's out for delivery!`;
    }

    form.setFieldsValue({ content });
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    if (dateValue.seconds) return dayjs(dateValue.seconds * 1000).format("DD MMM, hh:mm A");
    return dayjs(dateValue).format("DD MMM, hh:mm A");
  };

  return (
    <Card
      className="shadow-xl shadow-gray-200/50 border-gray-100 overflow-hidden"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar: Message Form */}
        <div className="w-full md:w-1/2 p-8 border-r border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <IconMessage2 size={24} />
            </div>
            <div>
              <Title level={4} className="!mb-0">Communication Hub</Title>
              <Text type="secondary" className="text-xs uppercase tracking-widest font-bold">Direct Messaging</Text>
            </div>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
            <TabPane
              tab={
                <span>
                  <IconMessage2 size={16} className="inline mr-2" />
                  SMS
                </span>
              }
              key="sms"
            />
            <TabPane
              tab={
                <span>
                  <IconMail size={16} className="inline mr-2" />
                  Email
                </span>
              }
              key="email"
            />
          </Tabs>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            {activeTab === "email" && (
              <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                <Input placeholder="Enter email subject..." />
              </Form.Item>
            )}

            <Form.Item
              name="content"
              label="Message Content"
              rules={[{ required: true, message: "Please enter message content" }]}
              extra={
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  <Button 
                    size="small" 
                    icon={<IconTemplate size={14} />} 
                    onClick={() => applyTemplate("quick_update")}
                    className="text-[10px] uppercase font-bold"
                  >
                    Quick Update
                  </Button>
                  <Button 
                    size="small" 
                    icon={<IconTemplate size={14} />} 
                    onClick={() => applyTemplate("delay")}
                    className="text-[10px] uppercase font-bold"
                  >
                    Delay Note
                  </Button>
                </div>
              }
            >
              <Input.TextArea 
                rows={6} 
                placeholder={`Type ${activeTab.toUpperCase()} message here...`}
                className="rounded-xl border-gray-200 focus:border-emerald-500"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={sending}
              icon={<IconSend size={18} />}
              style={{ background: "#16a34a", borderColor: "#16a34a" }}
              className="h-12 font-bold rounded-xl mt-4"
            >
              Send {activeTab.toUpperCase()}
            </Button>
          </Form>
        </div>

        {/* Timeline: History */}
        <div className="w-full md:w-1/2 p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <IconHistory size={24} />
              </div>
              <Title level={4} className="!mb-0">History</Title>
            </div>
            <Button size="small" type="text" onClick={fetchLogs} icon={<IconHistory size={14} />}>
              Refresh
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-20">
                <Spin />
              </div>
            ) : logs.length === 0 ? (
              <Empty description="No communication history yet" className="py-10" />
            ) : (
              <Timeline mode="left">
                {logs.map((log) => (
                  <Timeline.Item 
                    key={log.id}
                    color={log.type.includes("sms") ? "green" : "blue"}
                    label={<Text type="secondary" className="text-[10px] uppercase font-bold">{formatDate(log.createdAt)}</Text>}
                  >
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <Tag color={log.type.includes("sms") ? "green" : "blue"} className="text-[10px] uppercase font-bold rounded-full px-3">
                          {log.type.toUpperCase()}
                        </Tag>
                        {log.status && <Tag className="text-[10px] uppercase font-bold">{log.status}</Tag>}
                      </div>
                      <Paragraph className="!mb-0 text-sm text-gray-700 italic">
                        "{log.content}"
                      </Paragraph>
                      <div className="mt-2 text-[10px] text-gray-400">
                        To: {log.to}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CommunicationHub;
