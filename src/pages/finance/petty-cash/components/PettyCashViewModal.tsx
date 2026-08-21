import api from "@/lib/api";
import React, { useState } from "react";
import {
  IconCheck,
  IconBan,
  IconExternalLink,
  IconDownload,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import toast from "react-hot-toast";
import {
  Modal,
  Descriptions,
  Button,
} from "antd";

interface PettyCashViewModalProps {
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  entry: PettyCash | null;
}

const PettyCashViewModal: React.FC<PettyCashViewModalProps> = ({
  open,
  onClose,
  onStatusChange,
  entry,
}) => {
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(null);

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!entry) return;

    setProcessing(newStatus === "APPROVED" ? "approve" : "reject");
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify({ status: newStatus }));
      await api.put(`/api/v1/erp/finance/petty-cash/${entry.id}`, fd);

      toast.success(`VOUCHER ${newStatus}`);
      onStatusChange();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "—";
    if (typeof dateVal === "object") {
      if (typeof dateVal.toDate === "function") {
        return dateVal.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
      if (dateVal.seconds || dateVal._seconds) {
        const secs = dateVal.seconds || dateVal._seconds;
        return new Date(secs * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }
    return String(dateVal);
  };

  const renderStatus = (status: string) => {
    const st = status?.toUpperCase();
    switch (st) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            APPROVED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            PENDING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
            {status || "UNKNOWN"}
          </span>
        );
    }
  };

  if (!entry) return null;

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-text-main dark:text-text-main-dark font-mono">
            Voucher {entry.voucherNo || `#${entry.id?.slice(-6)}`}
          </span>
          {renderStatus(entry.status)}
        </div>
      }
      onCancel={onClose}
      width={840}
      footer={
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={!!processing} className="rounded-xl h-10 font-bold text-xs">
            Close
          </Button>
          {entry.status === "PENDING" && (
            <>
              <Button
                danger
                onClick={() => handleStatusUpdate("REJECTED")}
                loading={processing === "reject"}
                icon={<IconBan size={16} />}
                className="rounded-xl h-10 font-bold text-xs flex items-center gap-1.5"
              >
                Reject
              </Button>
              <Button
                type="primary"
                onClick={() => handleStatusUpdate("APPROVED")}
                loading={processing === "approve"}
                icon={<IconCheck size={16} />}
                className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl h-10 px-5 font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                Approve
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-6 rounded-2xl shadow-xs text-center mb-6 font-mono">
        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 ${
          entry.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
        }`}>
          {entry.type === "income" ? "INCOME / TOP-UP" : "EXPENSE VOUCHER"}
        </span>
        <p className="text-3xl font-bold tracking-tight">
          Rs {Number(entry.amount).toLocaleString()}
        </p>
      </div>

      <Descriptions bordered column={2} size="small" className="font-mono text-xs">
        <Descriptions.Item label="Voucher No">
          {entry.voucherNo || `PCV-${entry.id?.slice(-6).toUpperCase()}`}
        </Descriptions.Item>
        <Descriptions.Item label="Payee / Recipient">
          {entry.payee || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Category">{entry.category || "—"}</Descriptions.Item>
        <Descriptions.Item label="Payment Method">
          {entry.paymentMethod?.toUpperCase() || "CASH"}
        </Descriptions.Item>
        <Descriptions.Item label="Bank Account" span={2}>
          {entry.bankAccountName || "N/A (Cash Vault)"}
        </Descriptions.Item>
        <Descriptions.Item label="Purpose / Note" span={2}>
          {entry.note || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Receipt Attachment" span={2}>
          {entry.attachment ? (
            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<IconExternalLink size={14} />}
                href={entry.attachment}
                target="_blank"
                className="rounded-lg font-mono text-[10px]"
              >
                View Attachment
              </Button>
              <Button
                size="small"
                icon={<IconDownload size={14} />}
                href={entry.attachment}
                download
                className="rounded-lg font-mono text-[10px]"
              >
                Download
              </Button>
            </div>
          ) : (
            "No Receipt Attached"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Requested By">
          {entry.createdBy || "System"}
        </Descriptions.Item>
        <Descriptions.Item label="Voucher Date">
          {formatDate(entry.date || entry.createdAt)}
        </Descriptions.Item>
        {entry.reviewedBy && (
          <>
            <Descriptions.Item label="Reviewed / Approved By">
              {entry.reviewedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Reviewed At">
              {formatDate(entry.reviewedAt)}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Modal>
  );
};

export default PettyCashViewModal;
