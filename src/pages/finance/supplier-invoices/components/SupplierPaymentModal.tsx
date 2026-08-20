import { Button, Input, Select, Modal } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { IconCurrencyDollar } from "@tabler/icons-react";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import toast from "react-hot-toast";

interface SupplierPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  invoice: SupplierInvoice | null;
}

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  open,
  onClose,
  onPaymentSuccess,
  invoice,
}) => {
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(invoice ? String(invoice.balance) : "");
      setBankAccountId("");
      setNotes("");
      fetchBankAccounts();
    }
  }, [open, invoice]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/finance/bank-accounts?dropdown=true");
      setBankAccounts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (Number(amount) > (invoice?.balance || 0)) {
      toast.error("Amount exceeds balance");
      return;
    }

    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          amount: Number(amount),
          bankAccountId: bankAccountId || undefined,
          notes,
        })
      );
      await api.post(`/api/v1/erp/finance/supplier-invoices/${invoice?.id}/payment`, fd);

      toast.success("Payment recorded successfully");
      onPaymentSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      open={open && !!invoice}
      title={
        <div>
          <div className="text-sm font-bold text-text-main dark:text-text-main-dark font-mono uppercase">
            Record Supplier Payment
          </div>
          <p className="text-xs text-text-sub font-mono mt-0.5">
            Invoice: {invoice?.invoiceNumber} • Remaining Balance: Rs {invoice?.balance.toLocaleString()}
          </p>
        </div>
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={processing} className="rounded-xl h-10 font-bold text-xs">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={processing}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none rounded-xl h-10 px-5 font-bold text-xs cursor-pointer"
          >
            Confirm Payment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-2 font-mono">
        <div>
          <label className="block text-xs font-bold text-text-sub uppercase mb-1">
            Payment Amount (Rs) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={processing}
            autoFocus
            className="rounded-xl h-10 font-mono"
            prefix={<IconCurrencyDollar size={16} className="text-text-sub" />}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-sub uppercase mb-1">
            Pay From Account (Optional)
          </label>
          <Select
            className="w-full h-10"
            value={bankAccountId || undefined}
            onChange={(val) => setBankAccountId(val)}
            placeholder="Cash / Other"
            disabled={processing || loading}
            loading={loading}
            allowClear
            options={bankAccounts.map((acc) => ({
              value: acc.id,
              label: acc.label,
            }))}
          />
          <span className="text-[10px] text-text-sub font-sans block mt-1">
            Select a bank account to automatically deduct this payment amount from its balance.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-sub uppercase mb-1">
            Notes / Reference
          </label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Cheque No, Bank Transfer Ref ID..."
            disabled={processing}
            className="rounded-xl"
          />
        </div>
      </div>
    </Modal>
  );
};

export default SupplierPaymentModal;
