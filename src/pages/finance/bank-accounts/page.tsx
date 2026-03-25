import { Spin, Button, Input, InputNumber, Select, Switch, Modal } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconBuildingBank,
  IconBuilding,
  IconCreditCard,
  IconWallet,
  IconTrash,
  IconEdit,
  IconCash,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { Space, Tooltip } from "antd";

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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
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
          "/api/v1/erp/finance/bank-accounts?summary=true",
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
      toast("Please enter account name");
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
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Finance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Bank Accounts
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            Add Account
          </Button>
        </div>

        {/* Summary Card */}
        <div className="bg-green-600 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold   text-gray-400">Total Balance</p>
          <p className="text-3xl md:text-4xl font-bold mt-2">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Across {accounts.filter((a) => a.status).length} active accounts
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl shadow-sm">
            <IconBuildingBank
              size={48}
              className="mx-auto text-gray-300 mb-4"
            />
            <p className="text-gray-500">No bank accounts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const TypeIcon =
                ACCOUNT_TYPES.find((t) => t.value === account.accountType)
                  ?.icon || IconBuildingBank;
              return (
                <div
                  key={account.id}
                  className={`bg-white border p-5 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    account.status
                      ? "border-gray-100"
                      : "border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <TypeIcon size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {account.accountName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {account.bankName}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title="Edit">
                        <Button
                          type="text"
                          icon={<IconEdit size={16} />}
                          onClick={() => openEditModal(account)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          danger
                          icon={<IconTrash size={16} />}
                          onClick={() => handleDelete(account.id)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(account.currentBalance)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        •••• {account.accountNumber.slice(-4)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                          account.status
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {account.status ? "Active" : "Inactive"}
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
          title={editingId ? "Edit Account" : "Add Account"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Account Name *
              </label>
              <Input
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="e.g., Main Operating Account"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Bank Name
              </label>
              <Input
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="e.g., Commercial Bank"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Account Number
              </label>
              <Input
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="e.g., 1234567890"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Account Type
                </label>
                <Select
                  className="w-full"
                  value={formData.accountType}
                  onChange={(val) =>
                    setFormData({ ...formData, accountType: val })
                  }
                  options={ACCOUNT_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Currency
                </label>
                <Select
                  className="w-full"
                  value={formData.currency}
                  onChange={(val) =>
                    setFormData({ ...formData, currency: val })
                  }
                  options={[
                    { value: "LKR", label: "LKR" },
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Current Balance
              </label>
              <InputNumber
                className="w-full"
                value={formData.currentBalance}
                onChange={(val) =>
                  setFormData({ ...formData, currentBalance: val || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Notes
              </label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.status}
                onChange={(checked) =>
                  setFormData({ ...formData, status: checked })
                }
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>
        </Modal>
      </Space>
    </PageContainer>
  );
};

export default BankAccountsPage;
