import React, { useEffect, useState } from "react";
import { Table, Input, Button, Modal, Descriptions, Form, Select, Row, Col, Divider, Tooltip, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconSearch, IconEye, IconRefresh, IconMessage2, IconPlus, IconTemplate, IconFilter, IconDotsVertical, IconX } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import PageContainer from "../components/container/PageContainer";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import Spinner from "../components/shared/Spinner";

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

  const canCompose = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN" || currentUser?.permissions?.includes("send_custom_notifications");
  
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
        <span className="font-mono text-xs text-text-sub dark:text-slate-400">
          {date ? dayjs(date).format("DD MMM YYYY, hh:mm A") : "—"}
        </span>
      ),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (id: string) => {
        if (id === "CUSTOM" || !id) return <span className="text-text-sub dark:text-slate-500 text-xs font-mono">—</span>;
        return (
          <Link to={`/orders/${id.toLowerCase()}`} className="text-text-main dark:text-text-main-dark font-bold hover:underline font-mono text-xs">
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
        let label = type?.replace("_", " ").toUpperCase();
        if (type === "ebill_sms") label = "DIGITAL RECEIPT";
        
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-card-border dark:border-card-border-dark font-mono">
            {label}
          </span>
        );
      },
    },
    {
      title: "Recipient",
      dataIndex: "to",
      key: "to",
      render: (to: string) => <span className="text-xs font-mono text-text-main dark:text-text-main-dark">{to}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const isSuccess = status && (status.toUpperCase() === "COMPLETED" || status.toUpperCase() === "SENT" || status.toUpperCase() === "SUCCESS");
        
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
              isSuccess
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSuccess ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {status || "DISPATCHED"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: any, record: NotificationLog) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View Payload",
            onClick: () => setSelectedLog(record),
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
    <PageContainer title="Communication Center">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Marketing & Storefront
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Communication Logs
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {pagination.total} Total
                </span>
              </div>
            </div>
          </div>
          {canCompose && (
            <Button 
              type="primary"
              icon={<IconPlus size={16} />} 
              onClick={() => setIsComposeOpen(true)}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              Compose
            </Button>
          )}
        </div>

        {/* Search Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Input
              placeholder="Search Order, Phone or Email..."
              prefix={<IconSearch size={15} className="text-text-sub" />}
              className="h-10 rounded-xl"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => fetchLogs(1, pagination.pageSize, searchText)}
              allowClear
            />
            <Button 
              type="primary" 
              onClick={() => fetchLogs(1, pagination.pageSize, searchText)}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Search
            </Button>
          </div>
          <Button 
            icon={<IconRefresh size={16} />} 
            onClick={() => fetchLogs(1, pagination.pageSize, "")}
            className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer"
          >
            Refresh
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              columns={columns}
              dataSource={logs}
              loading={loading}
              rowKey="id"
              pagination={{
                total: pagination.total,
                current: pagination.current,
                pageSize: pagination.pageSize,
                position: ["bottomRight"],
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
              }}
            />
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
            <IconMessage2 size={18} className="text-text-main dark:text-text-main-dark" />
            <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">Compose Custom Message</span>
          </div>
        }
        open={isComposeOpen}
        onCancel={() => setIsComposeOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={sending}
        okText="Send Message"
        okButtonProps={{ className: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs" }}
        cancelButtonProps={{ className: "h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-xs font-semibold" }}
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={handleSend} className="py-4">
          <Row gutter={20}>
            <Col span={15}>
               <div className="space-y-3">
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Channel" required className="!mb-3">
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
                      <Form.Item name="orderId" label="Link to Order (Optional)" className="!mb-3">
                         <Input placeholder="e.g. WB1234" className="h-10 rounded-xl font-mono text-xs" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="to" label={msgType === 'sms' ? "Recipient Phone" : "Recipient Email"} rules={[{ required: true }]} className="!mb-3">
                    <Input placeholder={msgType === 'sms' ? "+9477..." : "customer@example.com"} className="h-10 rounded-xl font-mono text-xs" />
                  </Form.Item>

                  {msgType === 'email' && (
                    <Form.Item name="subject" label="Email Subject" rules={[{ required: true }]} className="!mb-3">
                       <Input placeholder="Enter message subject..." className="h-10 rounded-xl text-xs" />
                    </Form.Item>
                  )}

                  <Form.Item 
                    name="content" 
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>Message Content</span>
                        {msgType === "sms" && messageText.length > 0 && (
                          <span className={`text-[9px] font-bold font-mono ${smsMetrics.parts > 1 ? "text-amber-600" : "text-text-sub"}`}>
                            {smsMetrics.chars}/{smsMetrics.limit} Chars ({smsMetrics.parts} part{smsMetrics.parts > 1 ? "s" : ""})
                          </span>
                        )}
                      </div>
                    }
                    rules={[{ required: true }]}
                    className="!mb-3"
                  >
                    <Input.TextArea 
                      rows={5} 
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..." 
                      className="rounded-xl font-mono text-xs" 
                    />
                  </Form.Item>

                  {msgType === "sms" && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] font-bold font-mono text-text-sub">
                        <span>
                          {smsMetrics.isUnicode ? "✨ Unicode mode (Sinhala/Tamil detected)" : "GSM 7-bit alphabet"}
                        </span>
                        <span>Limit per part: {smsMetrics.limit} chars</span>
                      </div>
                    </div>
                  )}
               </div>
            </Col>
            <Col span={9}>
               <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-card-border dark:border-card-border-dark h-[460px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <IconTemplate size={16} className="text-text-sub" />
                      <span className="text-[10px] font-bold uppercase text-text-sub tracking-widest font-mono">Use Template</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 font-mono">
                       {templates.map(t => (
                         <div 
                           key={t.id} 
                           className="bg-card dark:bg-card-dark p-2.5 rounded-xl border border-card-border dark:border-card-border-dark flex flex-col gap-1"
                         >
                            <div className="text-[10px] font-bold text-text-main dark:text-text-main-dark truncate">{t.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {t.en && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "en")}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md cursor-pointer border-none"
                                >
                                  EN
                                </button>
                              )}
                              {t.si && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "si")}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md cursor-pointer border-none"
                                >
                                  සිංහල
                                </button>
                              )}
                              {t.ta && (
                                <button
                                  type="button"
                                  onClick={() => applyTemplate(t, "ta")}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md cursor-pointer border-none"
                                >
                                  தமிழ்
                                </button>
                              )}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-3 border-b border-card-border dark:border-card-border-dark">
            <IconEye size={18} className="text-text-main dark:text-text-main-dark" />
            <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">Message Details</span>
          </div>
        }
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedLog(null)} className="rounded-xl h-10 px-6 font-bold text-xs">
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedLog && (
          <div className="py-3 space-y-4 font-mono">
            <Descriptions bordered size="small" column={1} className="rounded-xl overflow-hidden border-card-border dark:border-card-border-dark">
              <Descriptions.Item label="Order ID">
                <span className="font-bold text-text-main dark:text-text-main-dark">{selectedLog.orderId === "CUSTOM" ? "—" : `#${selectedLog.orderId?.toUpperCase()}`}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Channel">
                {selectedLog.type?.replace("_", " ").toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Recipient">
                {selectedLog.to}
              </Descriptions.Item>
              <Descriptions.Item label="Date Sent">
                {selectedLog.createdAt ? dayjs(selectedLog.createdAt).format("DD MMM YYYY, hh:mm A") : "—"}
              </Descriptions.Item>
            </Descriptions>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-card-border dark:border-card-border-dark flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-sub">Payload / Content</span>
              <div className="whitespace-pre-wrap text-xs text-text-main dark:text-text-main-dark leading-relaxed italic">
                {selectedLog.content || "Message content rendered dynamically from template at dispatch time."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default CommunicationsPage;
