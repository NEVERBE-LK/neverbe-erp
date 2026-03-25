import { Spin, Button, Input, InputNumber, Select, Modal } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconX,
  IconLoader2,
  IconUpload,
  IconCalendar,
  IconFileText,
  IconPaperclip,
  IconBuildingStore,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import toast from "react-hot-toast";

interface SupplierInvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  invoice: SupplierInvoice | null; // null = create
}

const emptyForm = {
  invoiceNumber: "",
  supplierId: "",
  supplierName: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  amount: "",
  paidAmount: "0",
  currency: "LKR",
  notes: "",
  status: "PENDING",
};

const styles = {
  label: "block text-xs font-bold text-gray-500   mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer",
  fileButton:
    "flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer text-xs font-bold   text-gray-500 hover:text-black",
};

const SupplierInvoiceFormModal: React.FC<SupplierInvoiceFormModalProps> = ({
  open,
  onClose,
  onSave,
  invoice,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      if (invoice) {
        setFormData({
          invoiceNumber: invoice.invoiceNumber,
          supplierId: invoice.supplierId,
          supplierName: invoice.supplierName,
          issueDate:
            typeof invoice.issueDate === "string"
              ? invoice.issueDate.split("T")[0]
              : new Date((invoice.issueDate as any).seconds * 1000)
                  .toISOString()
                  .split("T")[0],
          dueDate:
            typeof invoice.dueDate === "string"
              ? invoice.dueDate.split("T")[0]
              : new Date((invoice.dueDate as any).seconds * 1000)
                  .toISOString()
                  .split("T")[0],
          amount: String(invoice.amount),
          paidAmount: String(invoice.paidAmount),
          currency: invoice.currency,
          notes: invoice.notes || "",
          status: invoice.status,
        });
      } else {
        setFormData({
          ...emptyForm,
          issueDate: new Date().toISOString().split("T")[0],
        });
      }
      setFile(null);
    }
  }, [open, invoice]);

  const fetchSuppliers = async () => {
    setFetchingSuppliers(true);
    try {
      const res = await api.get("/api/v1/erp/procurement/suppliers");
      // Assuming api returns array of Supplier objects
      setSuppliers(
        res.data
          .filter((s: any) => s.status === "active")
          .map((s: any) => ({ id: s.id, name: s.name })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingSuppliers(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updates: any = { [name]: value };
      if (name === "supplierId") {
        const sup = suppliers.find((s) => s.id === value);
        if (sup) updates.supplierName = sup.name;
      }
      return { ...prev, ...updates };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.invoiceNumber ||
      !formData.supplierId ||
      !formData.amount ||
      !formData.dueDate
    ) {
      toast("Missing required fields");
      return;
    }

    setSaving(true);
    try {
      const formPayload = new FormData();

      // Convert amount and paidAmount to numbers
      const processedData = {
        ...formData,
        amount: Number(formData.amount),
        paidAmount: Number(formData.paidAmount),
      };

      formPayload.append("data", JSON.stringify(processedData));

      if (file) {
        formPayload.append("attachment", file);
      }

      const url = invoice
        ? `/api/v1/erp/finance/supplier-invoices/${invoice.id}`
        : "/api/v1/erp/finance/supplier-invoices";
      const method = invoice ? "PUT" : "POST";

      await api({
        method,
        url,
        data: formPayload,
      });

      toast.success(invoice ? "Invoice updated" : "Invoice created");
      onSave();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={invoice ? "Edit Invoice" : "New Supplier Invoice"}
      onCancel={onClose}
      width={640}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            {invoice ? "Save Changes" : "Create Invoice"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Supplier & Invoice No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={styles.label}>
              Supplier <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full"
              value={formData.supplierId || undefined}
              onChange={(val) => {
                const sup = suppliers.find((s) => s.id === val);
                setFormData((prev) => ({
                  ...prev,
                  supplierId: val,
                  supplierName: sup?.name || "",
                }));
              }}
              placeholder={fetchingSuppliers ? "Loading..." : "Select Supplier"}
              disabled={saving || !!invoice}
              loading={fetchingSuppliers}
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <div>
            <label className={styles.label}>
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <Input
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="INV-001"
              disabled={saving}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={styles.label}>
              Total Amount <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              disabled={saving}
              prefix={
                <IconCurrencyDollar size={16} className="text-gray-400" />
              }
            />
          </div>
          <div>
            <label className={styles.label}>Paid Amount</label>
            <Input
              type="number"
              name="paidAmount"
              value={formData.paidAmount}
              onChange={handleChange}
              placeholder="0.00"
              disabled={saving}
              suffix="LKR"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={styles.label}>Issue Date</label>
            <Input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div>
            <label className={styles.label}>
              Due Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        </div>

        {/* Notes & Attachment */}
        <div>
          <label className={styles.label}>Notes</label>
          <Input.TextArea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Payment terms, item details..."
            disabled={saving}
          />
        </div>

        <div>
          <label className={styles.label}>Attachment</label>
          <label className={styles.fileButton}>
            <IconUpload size={16} className="mr-2" />
            {file ? "Change File" : "Upload Invoice PDF/Image"}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={saving}
            />
          </label>
          {file && (
            <div className="flex items-center gap-2 mt-2 text-xs font-bold text-black ">
              <IconPaperclip size={14} />
              <span className="truncate">{file.name}</span>
            </div>
          )}
          {invoice?.attachment && !file && (
            <a
              href={invoice.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-green-600 hover:underline mt-2  tracking-wide"
            >
              <IconPaperclip size={12} /> View Current
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SupplierInvoiceFormModal;
