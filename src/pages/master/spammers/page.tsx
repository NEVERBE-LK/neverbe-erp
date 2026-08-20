import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Table, Input, Modal, Form, Select, Button as AntButton, Tooltip } from "antd";
import toast from "react-hot-toast";
import Spinner from "@/pages/components/shared/Spinner";
import { SpammerRecord } from "@/model/SpammerRecord";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconShieldX,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconReload,
} from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";
import { formatSLDateTime } from "@/utils/dateUtils";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const { Option } = Select;

const SpammersPage = () => {
  const [spammers, setSpammers] = useState<SpammerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();
  const { showConfirmation } = useConfirmationDialog();

  const fetchSpammers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/erp/spammers");
      setSpammers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch spammers", err);
      toast.error("Failed to load spammer blacklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpammers();
  }, []);

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleReasonChange = (value: string) => {
    let autoSeverity = "HIGH";
    if (value.includes("Fraudulent") || value.includes("Fake")) {
      autoSeverity = "CRITICAL";
    } else if (value.includes("Blacklist")) {
      autoSeverity = "BLACKLISTED";
    }
    form.setFieldsValue({ severity: autoSeverity });
  };

  const handleAddSpammer = async (values: any) => {
    try {
      setSubmitting(true);
      let computedSeverity = values.severity;
      if (!computedSeverity) {
        const reason = values.reason || "";
        if (reason.includes("Fraudulent") || reason.includes("Fake")) {
          computedSeverity = "CRITICAL";
        } else if (reason.includes("Blacklist")) {
          computedSeverity = "BLACKLISTED";
        } else {
          computedSeverity = "HIGH";
        }
      }

      await api.post("/api/v1/erp/spammers", {
        ...values,
        severity: computedSeverity,
      });
      toast.success("Customer added to Spammer Blacklist");
      setIsModalOpen(false);
      fetchSpammers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add spammer record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirmation({
      title: "Remove Customer from Blacklist?",
      message: "Are you sure you want to remove this customer from the Spammer Blacklist? They will no longer be restricted to prepaid delivery fees.",
      confirmText: "Remove Spammer",
      cancelText: "Cancel",
      variant: "warning",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/spammers/${id}`);
          toast.success("Spammer record removed");
          fetchSpammers();
        } catch (err: any) {
          toast.error("Failed to remove spammer record");
        }
      },
    });
  };

  const filteredSpammers = spammers.filter((s) => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return (
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.reason && s.reason.toLowerCase().includes(term))
    );
  });

  const columns = [
    {
      title: "Customer Details",
      key: "customer",
      render: (_: any, record: SpammerRecord) => (
        <div className="flex flex-col gap-1 py-1">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark flex items-center gap-1.5">
            <IconUser size={14} className="text-text-sub shrink-0" />
            {record.name || "Unknown Customer"}
          </span>
          {record.phone && (
            <span className="text-xs font-mono text-text-sub dark:text-slate-400 flex items-center gap-1.5">
              <IconPhone size={13} className="text-emerald-500 shrink-0" />
              {record.phone}
            </span>
          )}
          {record.email && (
            <span className="text-xs text-text-sub dark:text-slate-400 flex items-center gap-1.5">
              <IconMail size={13} className="text-blue-500 shrink-0" />
              {record.email}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Address & City",
      key: "address",
      render: (_: any, record: SpammerRecord) => (
        <div className="flex flex-col gap-0.5 text-xs text-text-sub dark:text-slate-400">
          {record.address || record.city ? (
            <span className="flex items-center gap-1">
              <IconMapPin size={14} className="text-rose-500 shrink-0" />
              {record.address ? `${record.address}, ` : ""}{record.city || ""}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason: string) => (
        <span className="text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
          {reason || "Manual Anti-Spam Blacklist"}
        </span>
      ),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      align: "center" as const,
      render: (severity: string) => {
        const isCritical = severity === "CRITICAL" || severity === "BLACKLISTED";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono ${
              isCritical
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
            }`}
          >
            {severity || "HIGH"}
          </span>
        );
      },
    },
    {
      title: "Flagged Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: any) => (
        <span className="text-xs text-text-sub font-mono">{formatSLDateTime(date) || "—"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: SpammerRecord) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Remove from Blacklist">
            <button
              onClick={() => handleDelete(record.id!)}
              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <IconTrash size={16} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Spammer Blacklist" description="Manage high-risk customers & delivery fraud blacklist">
      <div className="space-y-6">
        {/* Page Header Accent */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-brand dark:bg-brand-dark rounded-full"></div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Security & Fraud Control
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                Spammer Blacklist
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchSpammers}
              className="p-2.5 rounded-xl border border-card-border dark:border-card-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub transition-colors cursor-pointer"
            >
              <IconReload size={16} />
            </button>
            <button
              onClick={handleOpenModal}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 text-white cursor-pointer"
            >
              <IconPlus size={16} /> Add Spammer
            </button>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4 flex items-center gap-4">
          <Input
            placeholder="Search by phone, email, name, or reason..."
            prefix={<IconSearch size={16} className="text-text-sub mr-2" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="h-10 rounded-lg text-xs"
          />
        </div>

        {/* Spammers Table */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Spinner />
            </div>
          ) : (
            <Table
              dataSource={filteredSpammers}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 15 }}
              className="[&_.ant-table]:bg-card [&_.ant-table]:dark:bg-card-dark [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:dark:bg-slate-800/50 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-wider [&_.ant-table-thead>tr>th]:text-text-sub"
            />
          )}
        </div>

        {/* Add Spammer Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <IconShieldX className="text-rose-600" size={20} />
              <span className="font-bold text-sm">Add Customer to Spammer Blacklist</span>
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleAddSpammer} className="pt-4 space-y-4">
            <Form.Item name="name" label="Customer Name">
              <Input placeholder="e.g. Kasun Perera" className="h-10 rounded-lg" />
            </Form.Item>

            <Form.Item name="phone" label="Mobile Phone Number" rules={[{ required: true, message: "Phone number is required" }]}>
              <Input placeholder="e.g. 0771234567" className="h-10 rounded-lg font-mono" />
            </Form.Item>

            <Form.Item name="email" label="Email Address">
              <Input placeholder="e.g. customer@example.com" className="h-10 rounded-lg" />
            </Form.Item>

            <Form.Item name="address" label="Street Address & City">
              <Input placeholder="e.g. No. 45, Galle Road, Colombo" className="h-10 rounded-lg" />
            </Form.Item>

            <Form.Item name="reason" label="Blacklist Reason" rules={[{ required: true, message: "Reason is required" }]}>
              <Select placeholder="Select primary reason" onChange={handleReasonChange} className="h-10">
                <Option value="Refused COD Package at Door">Refused COD Package at Door</Option>
                <Option value="Fake Phone Number / Invalid Line">Fake Phone Number / Invalid Line</Option>
                <Option value="Serial Return Abuser">Serial Return Abuser</Option>
                <Option value="Fraudulent / Spam Activity">Fraudulent / Spam Activity</Option>
                <Option value="Other Manual Blacklist">Other Manual Blacklist</Option>
              </Select>
            </Form.Item>

            <Form.Item name="severity" label="Severity Level (Auto-Computed)">
              <Select placeholder="Auto-computed from reason" allowClear className="h-10">
                <Option value="HIGH">HIGH (Requires Delivery Fee Prepayment)</Option>
                <Option value="CRITICAL">CRITICAL (High Risk Flag)</Option>
                <Option value="BLACKLISTED">BLACKLISTED (Complete Block)</Option>
              </Select>
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t border-card-border dark:border-card-border-dark">
              <AntButton onClick={() => setIsModalOpen(false)} className="h-10 px-5 rounded-lg">
                Cancel
              </AntButton>
              <AntButton
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="h-10 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold border-none"
              >
                Blacklist Customer
              </AntButton>
            </div>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default SpammersPage;
