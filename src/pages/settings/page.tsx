import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconDeviceFloppy,
  IconServer,
  IconWorld,
  IconDeviceDesktop,
  IconTruckDelivery,
  IconCreditCard,
  IconReceiptTax,
  IconMail,
  IconMessage,
  IconBuildingStore,
  IconCurrencyDollar,
  IconShieldCheck,
  IconArrowRight,
  IconBellRinging,
  IconLock,
  IconChevronRight,
  IconShoppingCart,
  IconBarcode,
  IconClipboardList,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import Spinner from "../components/shared/Spinner";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Select,
  Switch,
  Input,
  Row,
  Col,
  Form,
  InputNumber,
} from "antd";

const { Option } = Select;

interface Stock {
  id: string;
  label: string;
}

interface Settings {
  defaultStockId: string;
  onlineStockId: string;
  companyName?: string;
  legalName?: string;
  supportEmail?: string;
  supportPhone?: string;
  businessAddress?: string;
  businessCity?: string;
  taxRegistrationNumber?: string;

  orderPrefix?: string;
  invoicePrefix?: string;
  poPrefix?: string;
  grnPrefix?: string;
  minOrderValue?: number;
  freeShippingThreshold?: number;
  autoApproveOrders?: boolean;

  currencySymbol?: string;
  currencyCode?: string;
  timezone?: string;
  dateFormat?: string;
  autoReserveStock?: boolean;
  allowNegativeStock?: boolean;
  lowStockThreshold?: number;
  enableBarcodeScanner?: boolean;

  invoiceDueDays?: number;
  latePaymentFeePercent?: number;

  notifyLowStockEmail?: boolean;
  notifyNewOrderSMS?: boolean;
  customerOrderConfirmationEmail?: boolean;
  customerDispatchSMS?: boolean;

  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  maintenanceMode?: boolean;
  enableAuditLogging?: boolean;
  guestCheckoutEnabled?: boolean;

  ecommerce: {
    enable: boolean;
  };
  pos: {
    enable: boolean;
  };
  [key: string]: any;
}

import { useSettings } from "@/contexts/SettingsContext";

const SettingPage = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const { refetchSettings, updateLocalSettings } = useSettings();
  const navigate = useNavigate();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, stocksRes] = await Promise.all([
        api.get("/api/v1/erp/settings/erp"),
        api.get("/api/v1/erp/master/stocks/dropdown"),
      ]);
      const settingsData = settingsRes.data || {};
      const stocksData = stocksRes.data || [];
      setSettings(settingsData);
      setStocks(stocksData);

      form.setFieldsValue({
        companyName: settingsData.companyName || "",
        legalName: settingsData.legalName || "",
        supportEmail: settingsData.supportEmail || "",
        supportPhone: settingsData.supportPhone || "",
        businessAddress: settingsData.businessAddress || "",
        businessCity: settingsData.businessCity || "",
        taxRegistrationNumber: settingsData.taxRegistrationNumber || "",

        orderPrefix: settingsData.orderPrefix ?? "",
        invoicePrefix: settingsData.invoicePrefix ?? "",
        poPrefix: settingsData.poPrefix ?? "",
        grnPrefix: settingsData.grnPrefix ?? "",
        minOrderValue: settingsData.minOrderValue || 500,
        freeShippingThreshold: settingsData.freeShippingThreshold || 15000,
        autoApproveOrders: settingsData.autoApproveOrders ?? false,

        defaultStockId: settingsData.defaultStockId,
        onlineStockId: settingsData.onlineStockId,
        autoReserveStock: settingsData.autoReserveStock ?? true,
        allowNegativeStock: settingsData.allowNegativeStock ?? false,
        lowStockThreshold: settingsData.lowStockThreshold || 10,
        enableBarcodeScanner: settingsData.enableBarcodeScanner ?? true,

        currencySymbol: settingsData.currencySymbol || "Rs.",
        currencyCode: settingsData.currencyCode || "LKR",
        invoiceDueDays: settingsData.invoiceDueDays || 14,
        latePaymentFeePercent: settingsData.latePaymentFeePercent || 2.5,
        timezone: settingsData.timezone || "Asia/Colombo",
        dateFormat: settingsData.dateFormat || "DD/MM/YYYY",

        notifyLowStockEmail: settingsData.notifyLowStockEmail ?? true,
        notifyNewOrderSMS: settingsData.notifyNewOrderSMS ?? true,
        customerOrderConfirmationEmail: settingsData.customerOrderConfirmationEmail ?? true,
        customerDispatchSMS: settingsData.customerDispatchSMS ?? true,

        ecommerceEnabled: settingsData.ecommerce?.enable ?? true,
        posEnabled: settingsData.pos?.enable ?? true,
        guestCheckoutEnabled: settingsData.guestCheckoutEnabled ?? true,

        sessionTimeoutMinutes: settingsData.sessionTimeoutMinutes || 60,
        maxLoginAttempts: settingsData.maxLoginAttempts || 5,
        maintenanceMode: settingsData.maintenanceMode ?? false,
        enableAuditLogging: settingsData.enableAuditLogging ?? true,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: Settings = {
        ...settings,
        companyName: values.companyName,
        legalName: values.legalName,
        supportEmail: values.supportEmail,
        supportPhone: values.supportPhone,
        businessAddress: values.businessAddress,
        businessCity: values.businessCity,
        taxRegistrationNumber: values.taxRegistrationNumber,

        orderPrefix: values.orderPrefix,
        invoicePrefix: values.invoicePrefix,
        poPrefix: values.poPrefix,
        grnPrefix: values.grnPrefix,
        minOrderValue: values.minOrderValue,
        freeShippingThreshold: values.freeShippingThreshold,
        autoApproveOrders: values.autoApproveOrders,

        defaultStockId: values.defaultStockId,
        onlineStockId: values.onlineStockId,
        autoReserveStock: values.autoReserveStock,
        allowNegativeStock: values.allowNegativeStock,
        lowStockThreshold: values.lowStockThreshold,
        enableBarcodeScanner: values.enableBarcodeScanner,

        currencySymbol: values.currencySymbol,
        currencyCode: values.currencyCode,
        invoiceDueDays: values.invoiceDueDays,
        latePaymentFeePercent: values.latePaymentFeePercent,
        timezone: values.timezone,
        dateFormat: values.dateFormat,

        notifyLowStockEmail: values.notifyLowStockEmail,
        notifyNewOrderSMS: values.notifyNewOrderSMS,
        customerOrderConfirmationEmail: values.customerOrderConfirmationEmail,
        customerDispatchSMS: values.customerDispatchSMS,

        sessionTimeoutMinutes: values.sessionTimeoutMinutes,
        maxLoginAttempts: values.maxLoginAttempts,
        guestCheckoutEnabled: values.guestCheckoutEnabled,
        maintenanceMode: values.maintenanceMode,
        enableAuditLogging: values.enableAuditLogging,
        ecommerce: { ...settings?.ecommerce, enable: values.ecommerceEnabled },
        pos: { ...settings?.pos, enable: values.posEnabled },
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      await api.put("/api/v1/erp/settings/erp", formData);
      setSettings(payload);
      updateLocalSettings(payload);
      await refetchSettings();
      toast.success("ERP Enterprise Configuration Saved & Persisted");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="ERP Settings">
        <div className="flex justify-center items-center py-32">
          <Spinner size="large" tip="Loading Enterprise ERP Settings..." />
        </div>
      </PageContainer>
    );
  }

  const subModuleLaunchers = [
    {
      title: "Shipping & Delivery",
      description: "Courier zones, rates, & weight rules",
      icon: <IconTruckDelivery size={20} />,
      path: "/settings/shipping",
    },
    {
      title: "Payment Gateways",
      description: "Cards, Koko, PayHere & COD fees",
      icon: <IconCreditCard size={20} />,
      path: "/settings/payment-methods",
    },
    {
      title: "Tax & VAT Configuration",
      description: "Tax rates, rules, & TIN identity",
      icon: <IconReceiptTax size={20} />,
      path: "/settings/tax",
    },
    {
      title: "Email Templates",
      description: "Order & invoice Handlebars HTML",
      icon: <IconMail size={20} />,
      path: "/settings/email-templates",
    },
    {
      title: "SMS Notifications",
      description: "Order dispatch & OTP SMS triggers",
      icon: <IconMessage size={20} />,
      path: "/settings/templates",
    },
  ];

  const settingsTabs = [
    { id: "general", label: "Store & Business Profile", icon: <IconBuildingStore size={16} /> },
    { id: "orders", label: "Orders & Checkout Rules", icon: <IconShoppingCart size={16} /> },
    { id: "inventory", label: "Warehouse & Inventory", icon: <IconServer size={16} /> },
    { id: "financials", label: "Financials & Invoicing", icon: <IconCurrencyDollar size={16} /> },
    { id: "notifications", label: "Notification Triggers", icon: <IconBellRinging size={16} /> },
    { id: "modules", label: "Platform & Channel Toggles", icon: <IconWorld size={16} /> },
    { id: "security", label: "Security & Audit Policies", icon: <IconShieldCheck size={16} /> },
  ];

  return (
    <PageContainer title="ERP Settings">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                System Administration
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                Enterprise ERP Configuration
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => form.resetFields()}
              className="h-10 px-4 rounded-xl text-xs font-semibold border-card-border dark:border-card-border-dark text-text-sub cursor-pointer"
            >
              Reset
            </Button>
            <Button
              type="primary"
              icon={<IconDeviceFloppy size={16} />}
              loading={saving}
              onClick={handleSave}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Sub-module Quick Access Hub */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono block px-1">
            Dedicated Settings Sub-modules
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
            {subModuleLaunchers.map((launcher) => (
              <div
                key={launcher.path}
                onClick={() => navigate(launcher.path)}
                className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-text-main dark:text-text-main-dark rounded-xl group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 transition-colors">
                    {launcher.icon}
                  </div>
                  <IconChevronRight size={16} className="text-text-sub group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-main dark:text-text-main-dark block truncate font-sans">
                    {launcher.title}
                  </h4>
                  <p className="text-[10px] text-text-sub dark:text-slate-400 mt-0.5 block truncate">
                    {launcher.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Settings Form Workspace */}
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
            {/* LEFT TAB NAVIGATION SIDEBAR */}
            <div className="lg:col-span-3 bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-3 shadow-xs space-y-1">
              <div className="px-3 py-2 border-b border-card-border dark:border-card-border-dark mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">
                  Configuration Categories
                </span>
              </div>

              {settingsTabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                        : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-text-main dark:text-text-main-dark border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {tab.icon}
                      <span className="font-bold text-xs truncate font-sans">
                        {tab.label}
                      </span>
                    </div>
                    <IconArrowRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                  </button>
                );
              })}
            </div>

            {/* RIGHT CONFIGURATION MATRIX PANEL */}
            <div className="lg:col-span-9 bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-6">
              {/* TAB 1: GENERAL & COMPANY PROFILE */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Store & Company Legal Profile
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Configure your primary store branding, customer support contacts, and legal entity identifiers.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Company / Public Brand Display Name</span>}
                        name="companyName"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="e.g. NEVERBE Store" className="h-10 rounded-xl text-xs font-semibold" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Registered Legal Entity Name</span>}
                        name="legalName"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="e.g. NEVERBE Private Limited" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Customer Support Email</span>}
                        name="supportEmail"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="support@neverbe.lk" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Support Hotline Phone</span>}
                        name="supportPhone"
                      >
                        <Input placeholder="+94 11 234 5678" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Business Street Address</span>}
                        name="businessAddress"
                      >
                        <Input placeholder="123 High Level Road" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">City & Region</span>}
                        name="businessCity"
                      >
                        <Input placeholder="Colombo, Sri Lanka" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Tax Registration TIN Number</span>}
                        name="taxRegistrationNumber"
                      >
                        <Input placeholder="TIN-987654321" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: ORDERS & CHECKOUT RULES */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Orders & Document Prefixing Rules
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Set document number sequence prefixes, minimum order amounts, and free shipping triggers.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Sales Order Number Prefix</span>}
                        name="orderPrefix"
                        help="e.g. ORD-001002"
                      >
                        <Input placeholder="ORD-" className="h-10 rounded-xl text-xs font-mono font-bold" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Invoice Number Prefix</span>}
                        name="invoicePrefix"
                        help="e.g. INV-001002"
                      >
                        <Input placeholder="INV-" className="h-10 rounded-xl text-xs font-mono font-bold" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Purchase Order (PO) Prefix</span>}
                        name="poPrefix"
                        help="e.g. PO-001002"
                      >
                        <Input placeholder="PO-" className="h-10 rounded-xl text-xs font-mono font-bold" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Goods Received (GRN) Prefix</span>}
                        name="grnPrefix"
                        help="e.g. GRN-001002"
                      >
                        <Input placeholder="GRN-" className="h-10 rounded-xl text-xs font-mono font-bold" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Minimum Checkout Order Subtotal (LKR)</span>}
                        name="minOrderValue"
                      >
                        <InputNumber min={0} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Free Shipping Qualification Threshold (LKR)</span>}
                        name="freeShippingThreshold"
                      >
                        <InputNumber min={0} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Auto-Approve Paid Online Orders
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Automatically mark paid orders as confirmed without manual review
                          </span>
                        </div>
                        <Form.Item name="autoApproveOrders" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 3: WAREHOUSE & INVENTORY ROUTING */}
              {activeTab === "inventory" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Warehouse Allocation & Inventory Control
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Assign default fulfillment warehouses for retail POS operations and e-commerce orders.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Default Retail POS Warehouse</span>}
                        name="defaultStockId"
                        help="Primary physical warehouse location for POS billing."
                      >
                        <Select placeholder="Select Location" className="h-10 rounded-xl text-xs">
                          {stocks.map((stock) => (
                            <Option key={stock.id} value={stock.id}>
                              {stock.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Online E-Commerce Allocation</span>}
                        name="onlineStockId"
                        help="Warehouse inventory source for digital storefront orders."
                      >
                        <Select placeholder="Select Location" className="h-10 rounded-xl text-xs">
                          {stocks.map((stock) => (
                            <Option key={stock.id} value={stock.id}>
                              {stock.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Low Stock Alert Threshold Quantity</span>}
                        name="lowStockThreshold"
                        help="Trigger low stock warning badge when inventory drops below this quantity."
                      >
                        <InputNumber min={1} max={1000} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Auto-Reserve Inventory
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Deduct stock immediately on checkout creation
                          </span>
                        </div>
                        <Form.Item name="autoReserveStock" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Allow Negative Stock Sales
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Allow checkout even when recorded inventory is 0
                          </span>
                        </div>
                        <Form.Item name="allowNegativeStock" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Barcode Scanner Auto-Add
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Auto-add item to POS cart upon barcode scan
                          </span>
                        </div>
                        <Form.Item name="enableBarcodeScanner" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 4: FINANCIALS & CURRENCY */}
              {activeTab === "financials" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Financials, Currency & Invoice Terms
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Set operating currency symbols, tax calculation preferences, and invoice payment due windows.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Base Currency Symbol</span>}
                        name="currencySymbol"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Rs. or $" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">ISO Currency Code</span>}
                        name="currencyCode"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="LKR, USD, EUR" className="h-10 rounded-xl text-xs font-mono" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Standard Invoice Payment Window (Days)</span>}
                        name="invoiceDueDays"
                      >
                        <InputNumber min={1} max={90} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Late Payment Interest Fee (%)</span>}
                        name="latePaymentFeePercent"
                      >
                        <InputNumber min={0} max={100} step={0.1} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">System Timezone</span>}
                        name="timezone"
                      >
                        <Select className="h-10 rounded-xl text-xs">
                          <Option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</Option>
                          <Option value="UTC">UTC (GMT+0:00)</Option>
                          <Option value="America/New_York">America/New_York (EST)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Display Date Format</span>}
                        name="dateFormat"
                      >
                        <Select className="h-10 rounded-xl text-xs">
                          <Option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/08/2026)</Option>
                          <Option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-20)</Option>
                          <Option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/20/2026)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 5: NOTIFICATION TRIGGERS */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Automated Notification & Alert Triggers
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Configure automated emails and SMS notifications sent to staff and customers.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                          Send Manager Email Alert on Low Stock
                        </span>
                        <span className="text-[10px] text-text-sub font-mono">
                          Notify warehouse manager when item stock falls below threshold
                        </span>
                      </div>
                      <Form.Item name="notifyLowStockEmail" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                          Send Staff SMS Notification on New Web Order
                        </span>
                        <span className="text-[10px] text-text-sub font-mono">
                          Send instant SMS alert to fulfillment team upon order placement
                        </span>
                      </div>
                      <Form.Item name="notifyNewOrderSMS" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                          Send Customer Order Confirmation Email
                        </span>
                        <span className="text-[10px] text-text-sub font-mono">
                          Auto-send order invoice HTML email to buyer upon checkout
                        </span>
                      </div>
                      <Form.Item name="customerOrderConfirmationEmail" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                          Send Customer Courier Dispatch SMS
                        </span>
                        <span className="text-[10px] text-text-sub font-mono">
                          Send SMS tracking number to buyer when order status changes to Dispatched
                        </span>
                      </div>
                      <Form.Item name="customerDispatchSMS" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: MODULE & CHANNEL TOGGLES */}
              {activeTab === "modules" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Platform Modules & Sales Channel Switches
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Enable or disable public storefront checkout, POS counter terminal, and guest checkout options.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl">
                          <IconWorld size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            E-Commerce Storefront API Access
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Allow external web storefront to browse catalog and process customer orders
                          </span>
                        </div>
                      </div>
                      <Form.Item name="ecommerceEnabled" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl">
                          <IconDeviceDesktop size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Point of Sale (POS) Retail Counter Terminal
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Internal physical store checkout interface for cashiers
                          </span>
                        </div>
                      </div>
                      <Form.Item name="posEnabled" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl">
                          <IconBuildingStore size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Allow Guest Checkout
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Allow online customers to place orders without creating a permanent account
                          </span>
                        </div>
                      </div>
                      <Form.Item name="guestCheckoutEnabled" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SECURITY & POLICY LIMITS */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-card-border dark:border-card-border-dark">
                    <h3 className="text-base font-bold text-text-main dark:text-text-main-dark tracking-tight font-sans">
                      Security & System Audit Policies
                    </h3>
                    <p className="text-xs text-text-sub font-mono mt-0.5">
                      Manage maintenance modes, session timeouts, and audit logging parameters.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Session Idle Timeout (Minutes)</span>}
                        name="sessionTimeoutMinutes"
                        help="Automatically lock session after N minutes of inactivity"
                      >
                        <InputNumber min={5} max={480} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="text-xs font-bold font-mono text-text-sub">Max Failed Login Attempts</span>}
                        name="maxLoginAttempts"
                        help="Lock user account temporarily after N failed password attempts"
                      >
                        <InputNumber min={3} max={10} className="w-full h-10 rounded-xl text-xs flex items-center" />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-card-border dark:border-card-border-dark flex items-center justify-between mb-3">
                        <div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block font-sans">
                            Enable Detailed Security Audit Logging
                          </span>
                          <span className="text-[10px] text-text-sub font-mono">
                            Record every user login, role change, and order cancellation event in system audit trail
                          </span>
                        </div>
                        <Form.Item name="enableAuditLogging" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                            <IconLock size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-amber-900 dark:text-amber-300 block font-sans">
                              System Maintenance Mode
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                              Temporarily lock public storefront access for scheduled database maintenance
                            </span>
                          </div>
                        </div>
                        <Form.Item name="maintenanceMode" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default SettingPage;
