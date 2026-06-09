import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Tabs,
  Form,
  Input,
  Button,
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
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

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
  const [messageText, setMessageText] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${orderId}/notifications`);
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
      setMessageText("");
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
    setMessageText(content);
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    return dayjs(dateValue).format("DD MMM, hh:mm A");
  };

  // Live SMS Counter calculations
  const getSMSCount = (text: string) => {
    if (!text) return { chars: 0, parts: 0, limit: 160, isUnicode: false };
    const chars = text.length;
    // Check if message has Unicode characters (like Sinhala characters)
    const isUnicode = /[^\u0000-\u007F]/.test(text);
    const limit = isUnicode ? 70 : 160;
    const parts = Math.ceil(chars / limit) || 1;
    return { chars, parts, limit, isUnicode };
  };

  const smsMetrics = getSMSCount(messageText);

  return (
    <Card
      className="shadow-sm border border-gray-100 overflow-hidden rounded-2xl bg-white"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side: Message Dispatch Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <IconMessage2 size={22} />
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400">
                COMMS CENTER
              </span>
              <h4 className="text-base font-black text-gray-800 leading-tight">
                Send Notification
              </h4>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              form.resetFields();
              setMessageText("");
            }}
            className="mb-5 custom-erp-tabs"
          >
            <Tabs.TabPane
              tab={
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <IconMessage2 size={16} />
                  SMS MESSAGE
                </span>
              }
              key="sms"
            />
            <Tabs.TabPane
              tab={
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <IconMail size={16} />
                  EMAIL DISPATCH
                </span>
              }
              key="email"
            />
          </Tabs>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            {activeTab === "email" && (
              <Form.Item
                name="subject"
                label={<span className="text-[10px] font-bold text-gray-400 uppercase">Subject</span>}
                rules={[{ required: true, message: "Please enter email subject" }]}
              >
                <Input
                  placeholder="Enter email subject..."
                  className="h-10 rounded-xl border-gray-200 focus:border-black hover:border-gray-300"
                />
              </Form.Item>
            )}

            <Form.Item
              name="content"
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Message Content</span>
                  {activeTab === "sms" && messageText.length > 0 && (
                    <span className={`text-[9px] font-bold ${smsMetrics.parts > 1 ? "text-amber-600" : "text-gray-400"}`}>
                      {smsMetrics.chars}/{smsMetrics.limit} Chars ({smsMetrics.parts} part{smsMetrics.parts > 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              }
              rules={[{ required: true, message: "Please enter message content" }]}
            >
              <Input.TextArea
                rows={6}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Type your ${activeTab === "sms" ? "SMS body" : "email message"} here...`}
                className="rounded-xl border-gray-200 focus:border-black hover:border-gray-300 p-3"
              />
            </Form.Item>

            {activeTab === "sms" && (
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-4 px-1">
                <span>
                  {smsMetrics.isUnicode
                    ? "✨ Unicode mode (Sinhala character detected)"
                    : "Standard GSM 7-bit alphabet"}
                </span>
                <span>
                  Limit per part: {smsMetrics.limit} chars
                </span>
              </div>
            )}

            {/* Quick Templates Panel */}
            <div className="bg-white p-3 border border-gray-100 rounded-xl mb-5">
              <span className="block text-[9px] font-black uppercase text-gray-400 tracking-wider mb-2">
                Use Templates
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate("quick_update")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-emerald-100 hover:border-emerald-300 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50 transition cursor-pointer"
                >
                  <IconTemplate size={12} />
                  QUICK UPDATE
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("delay")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-amber-100 hover:border-amber-300 text-amber-700 bg-amber-50/30 hover:bg-amber-50 transition cursor-pointer"
                >
                  <IconTemplate size={12} />
                  DELAY NOTE
                </button>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={sending}
              icon={<IconSend size={16} />}
              className="h-11 font-bold rounded-xl bg-black border-none text-white flex items-center justify-center gap-1.5 shadow-none mt-2"
            >
              Send {activeTab.toUpperCase()}
            </Button>
          </Form>
        </div>

        {/* Right Side: Threads & Logs History */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-white flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <IconHistory size={22} />
              </div>
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400">
                  DISPATCH FEED
                </span>
                <h4 className="text-base font-black text-gray-800 leading-tight">
                  Notification History
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 cursor-pointer disabled:opacity-50 transition"
            >
              {loading ? (
                <IconLoader size={12} className="animate-spin" />
              ) : (
                <IconRefresh size={12} />
              )}
              REFRESH
            </button>
          </div>

          {/* Redesigned Thread Feed List */}
          <div className="flex-1 max-h-[420px] overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-20 flex-col gap-3">
                <Spin />
                <span className="text-xs font-bold text-gray-400">Loading history thread...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16">
                <Empty description="No notifications dispatched for this order." />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {logs.map((log) => {
                  const isSms = log.type.includes("sms");
                  return (
                    <div
                      key={log.id}
                      className="border border-gray-100 rounded-xl p-4 bg-gray-50/35 hover:bg-gray-50/80 transition flex flex-col gap-2.5"
                    >
                      {/* Thread header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg text-xs ${isSms ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                            {isSms ? <IconMessage2 size={14} /> : <IconMail size={14} />}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">
                            {isSms ? "SMS Text" : "Email Dispatch"}
                          </span>
                        </div>

                        {log.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-green-50 text-green-700 border border-green-100">
                            <IconCheck size={10} />
                            SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                            <IconAlertCircle size={10} />
                            {log.status || "PENDING"}
                          </span>
                        )}
                      </div>

                      {/* Thread body */}
                      <div className="text-xs text-gray-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-50/50 break-words whitespace-pre-wrap">
                        {log.content?.trim() ? (
                          log.content
                        ) : (
                          <span className="text-gray-400 italic font-normal">
                            No dispatch content captured.
                          </span>
                        )}
                      </div>

                      {/* Thread footer */}
                      <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                        <span className="font-mono">
                          To: {log.to}
                        </span>
                        <span>
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CommunicationHub;
