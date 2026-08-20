import { Button, Switch } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import { IconReceipt2, IconInfoCircle, IconDeviceFloppy } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import Spinner from "@/pages/components/shared/Spinner";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface TaxSettings {
  id?: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxIncludedInPrice: boolean;
  applyToShipping: boolean;
  taxRegistrationNumber?: string;
  businessName?: string;
  minimumOrderForTax?: number;
}

const TaxSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>({
    taxEnabled: false,
    taxName: "VAT",
    taxRate: 0,
    taxIncludedInPrice: true,
    applyToShipping: false,
    taxRegistrationNumber: "",
    businessName: "",
    minimumOrderForTax: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<TaxSettings>("/api/v1/erp/settings/tax");
      setSettings(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch tax settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(settings));
      await api.put("/api/v1/erp/settings/tax", formData);
      toast.success("Tax settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save tax settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof TaxSettings,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const examplePrice = 10000;
  const calculateExampleTax = () => {
    if (!settings.taxEnabled || settings.taxRate <= 0) return 0;
    if (settings.taxIncludedInPrice) {
      return examplePrice - examplePrice / (1 + settings.taxRate / 100);
    }
    return (examplePrice * settings.taxRate) / 100;
  };

  if (loading) {
    return (
      <PageContainer title="Tax Settings">
        <div className="flex justify-center items-center py-32">
          <Spinner size="large" tip="Loading Tax Configuration..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tax Settings">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                System Administration
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                Taxation & Compliance
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={16} />}
            loading={saving}
            onClick={handleSave}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Save Settings
          </Button>
        </div>

        {/* Main Enable Toggle Card */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.taxEnabled ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-text-sub"}`}>
              <IconReceipt2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main dark:text-text-main-dark">
                Enable Sales Tax Collection
              </h3>
              <p className="text-xs text-text-sub dark:text-slate-400 font-sans">
                Automatically calculate and track tax on orders
              </p>
            </div>
          </div>
          <Switch
            checked={settings.taxEnabled}
            onChange={(val) => handleChange("taxEnabled", val)}
          />
        </div>

        {/* Tax Details Section */}
        {settings.taxEnabled && (
          <div className="space-y-6 font-mono">
            {/* Tax Rates */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
              <span className="font-bold text-sm text-text-main dark:text-text-main-dark block pb-3 border-b border-card-border dark:border-card-border-dark">
                Tax Name & Rates
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-sub mb-1.5">
                    Tax Name (e.g. VAT, GST)
                  </label>
                  <input
                    type="text"
                    value={settings.taxName}
                    onChange={(e) => handleChange("taxName", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sub mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-card-border dark:border-card-border-dark flex items-start gap-3">
                <IconInfoCircle size={18} className="text-text-sub flex-shrink-0 mt-0.5" />
                <div className="text-xs text-text-sub font-sans">
                  Calculation Preview for Rs {examplePrice.toLocaleString()}:{" "}
                  <strong className="text-text-main dark:text-text-main-dark font-mono">
                    {settings.taxName} = Rs {calculateExampleTax().toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
              <span className="font-bold text-sm text-text-main dark:text-text-main-dark block pb-3 border-b border-card-border dark:border-card-border-dark">
                Tax Calculation Rules
              </span>

              <div className="flex items-center justify-between py-2 border-b border-card-border dark:border-card-border-dark">
                <div>
                  <span className="font-bold text-xs text-text-main dark:text-text-main-dark block">Prices Include Tax</span>
                  <span className="text-[10px] text-text-sub font-sans">Displayed item prices already include tax</span>
                </div>
                <Switch
                  checked={settings.taxIncludedInPrice}
                  onChange={(val) => handleChange("taxIncludedInPrice", val)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-card-border dark:border-card-border-dark">
                <div>
                  <span className="font-bold text-xs text-text-main dark:text-text-main-dark block">Apply Tax to Shipping</span>
                  <span className="text-[10px] text-text-sub font-sans">Include shipping fee in taxable total</span>
                </div>
                <Switch
                  checked={settings.applyToShipping}
                  onChange={(val) => handleChange("applyToShipping", val)}
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-text-sub mb-1.5">
                  Minimum Order Amount for Tax (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.minimumOrderForTax || 0}
                  onChange={(e) => handleChange("minimumOrderForTax", parseFloat(e.target.value) || 0)}
                  className="w-full sm:max-w-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark text-xs font-mono"
                />
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs space-y-4">
              <span className="font-bold text-sm text-text-main dark:text-text-main-dark block pb-3 border-b border-card-border dark:border-card-border-dark">
                Tax Entity Registration
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-sub mb-1.5">Registered Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName || ""}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                    placeholder="Legal Business Name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sub mb-1.5">Tax Registration Number (TIN/VAT)</label>
                  <input
                    type="text"
                    value={settings.taxRegistrationNumber || ""}
                    onChange={(e) => handleChange("taxRegistrationNumber", e.target.value)}
                    placeholder="e.g. VAT-123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxSettingsPage;
