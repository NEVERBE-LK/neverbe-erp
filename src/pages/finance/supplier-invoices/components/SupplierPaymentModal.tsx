import { Button, Input, Select, Modal } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconX,
  IconLoader2,
  IconBuildingBank,
  IconCurrencyDollar,
  IconNote,
} from "@tabler/icons-react";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import toast from "react-hot-toast";

interface SupplierPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  invoice: SupplierInvoice | null;
}

const styles = {
  label: "block text-xs font-bold text-gray-500   mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer",
};

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  open,
  onClose,
  onPaymentSuccess,
  invoice,
}) => {
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; label: string }[]
  >([]);
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
      const res = await api.get(
        "/api/v1/erp/finance/bank-accounts?dropdown=true",
      );
      setBankAccounts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast("Enter a valid amount");
      return;
    }
    if (Number(amount) > (invoice?.balance || 0)) {
      toast("Amount exceeds balance");
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
        }),
      );
      await api.post(
        `/api/v1/erp/finance/supplier-invoices/${invoice?.id}/payment`,
        fd,
      );

      toast.success("Payment recorded");
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
          <div className="text-sm font-bold text-gray-900">Record Payment</div>
          <p className="text-xs text-gray-500 tracking-wide">
            {invoice?.invoiceNumber} • Balance:{" "}
            {invoice?.balance.toLocaleString()}
          </p>
        </div>
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={processing}>
            Confirm Payment
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        <div>
          <label className={styles.label}>
            Payment Amount <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={processing}
            autoFocus
            prefix={<IconCurrencyDollar size={16} className="text-gray-400" />}
          />
        </div>

        <div>
          <label className={styles.label}>Pay From (Optional)</label>
          <Select
            className="w-full"
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
          <p className="text-xs text-gray-400 mt-1">
            Select a bank account to automatically deduct this amount.
          </p>
        </div>

        <div>
          <label className={styles.label}>Notes</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Cheque No, Ref ID..."
            disabled={processing}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SupplierPaymentModal;
