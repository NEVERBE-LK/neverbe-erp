import { Button, Input, InputNumber, Select, Switch, Modal, Dropdown } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconBuildingBank,
  IconWallet,
  IconTrash,
  IconEdit,
  IconCash,
  IconDotsVertical,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: "checking" | "savings" | "cash";
  currentBalance: number;
  currency: string;
  status: boolean;
  notes?: string;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: IconBuildingBank },
  { value: "savings", label: "Savings", icon: IconWallet },
  { value: "cash", label: "Cash", icon: IconCash },
];

const BankAccountsPage = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    accountType: "checking" as "checking" | "savings" | "cash",
    currentBalance: 0,
    currency: "LKR",
    status: true,
    notes: "",
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const [accountsRes, summaryRes] = await Promise.all([
        api.get<BankAccount[]>("/api/v1/erp/finance/bank-accounts"),
        api.get<{ totalBalance: number }>(
          "/api/v1/erp/finance/bank-accounts?summary=true"
        ),
      ]);
      setAccounts(accountsRes.data);
      setTotalBalance(summaryRes.data.totalBalance);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAccounts();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      accountType: "checking",
      currentBalance: 0,
      currency: "LKR",
      status: true,
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currentBalance: account.currentBalance,
      currency: account.currency,
      status: account.status,
      notes: account.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.accountName.trim()) {
      toast.error("Please enter account name");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));

      if (editingId) {
        await api.put(`/api/v1/erp/finance/bank-accounts/${editingId}`, fd);
        toast.success("Account updated");
      } else {
        await api.post("/api/v1/erp/finance/bank-accounts", fd);
        toast.success("Account created");
      }

      setShowModal(false);
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await api.delete(`/api/v1/erp/finance/bank-accounts/${id}`);
      toast.success("Account deleted");
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account");
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString()}`;
  };

  return (
    <PageContainer title="Bank Accounts">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Finance
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Bank Accounts
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {accounts.length} Accounts
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={openAddModal}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Add Account
          </Button>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-6 rounded-2xl shadow-xs font-mono">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 block mb-1">
            Total Combined Balance
          </span>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 block font-sans">
            Across {accounts.filter((a) => a.status).length} active financial accounts
          </span>
        </div>

        {/* Account Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="large" tip="Loading Bank Accounts..." />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-12 text-center rounded-2xl shadow-xs">
            <IconBuildingBank size={48} className="mx-auto text-text-sub mb-4" />
            <p className="text-text-sub text-sm font-semibold">No bank accounts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((account) => {
              const TypeIcon =
                ACCOUNT_TYPES.find((t) => t.value === account.accountType)?.icon ||
                IconBuildingBank;
              return (
                <div
                  key={account.id}
                  className={`bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-2xl shadow-xs transition-all duration-200 ${
                    account.status ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-text-sub">
                        <TypeIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main dark:text-text-main-dark block leading-tight">
                          {account.accountName}
                        </h4>
                        <span className="text-xs text-text-sub font-mono">
                          {account.bankName}
                        </span>
                      </div>
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "edit",
                            icon: <IconEdit size={14} />,
                            label: "Edit Account",
                            onClick: () => openEditModal(account),
                          },
                          {
                            type: "divider" as const,
                          },
                          {
                            key: "delete",
                            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
                            label: (
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                Delete Account
                              </span>
                            ),
                            onClick: () => handleDelete(account.id),
                          },
                        ],
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <IconDotsVertical size={16} />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="mt-5 space-y-3 font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-text-sub uppercase tracking-wider block">Current Balance</span>
                      <p className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight">
                        {formatCurrency(account.currentBalance)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-card-border dark:border-card-border-dark">
                      <span className="text-xs text-text-sub">
                        •••• {account.accountNumber.slice(-4)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          account.status
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            account.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        {account.status ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={showModal}
          title={editingId ? "Edit Bank Account" : "Add Bank Account"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowModal(false)} className="rounded-xl h-10 font-bold text-xs">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none rounded-xl h-10 px-5 font-bold text-xs cursor-pointer"
              >
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Account Name *
              </label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Main Operating Account"
                className="rounded-xl h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Bank Name
              </label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., Commercial Bank"
                className="rounded-xl h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Account Number
              </label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g., 1234567890"
                className="rounded-xl h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                  Account Type
                </label>
                <Select
                  className="w-full h-10"
                  value={formData.accountType}
                  onChange={(val) => setFormData({ ...formData, accountType: val })}
                  options={ACCOUNT_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                  Currency
                </label>
                <Select
                  className="w-full h-10"
                  value={formData.currency}
                  onChange={(val) => setFormData({ ...formData, currency: val })}
                  options={[
                    { value: "LKR", label: "LKR" },
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Current Balance
              </label>
              <InputNumber
                className="w-full h-10 rounded-xl font-mono"
                value={formData.currentBalance}
                onChange={(val) => setFormData({ ...formData, currentBalance: val || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase font-mono mb-1">
                Notes
              </label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
                className="rounded-xl h-10"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.status}
                onChange={(checked) => setFormData({ ...formData, status: checked })}
              />
              <span className="text-xs font-bold text-text-main dark:text-text-main-dark uppercase font-mono">
                Active Account
              </span>
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default BankAccountsPage;
