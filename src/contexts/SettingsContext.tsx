import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";
import { logoutUserAction } from "@/actions/authActions";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export interface ERPSettings {
  defaultStockId: string;
  onlineStockId: string;
  companyName: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  businessCity: string;
  taxRegistrationNumber: string;

  orderPrefix: string;
  invoicePrefix: string;
  poPrefix: string;
  grnPrefix: string;
  minOrderValue: number;
  freeShippingThreshold: number;
  autoApproveOrders: boolean;

  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  dateFormat: string;

  autoReserveStock: boolean;
  allowNegativeStock: boolean;
  lowStockThreshold: number;
  enableBarcodeScanner: boolean;

  invoiceDueDays: number;
  latePaymentFeePercent: number;

  notifyLowStockEmail: boolean;
  notifyNewOrderSMS: boolean;
  customerOrderConfirmationEmail: boolean;
  customerDispatchSMS: boolean;

  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  maintenanceMode: boolean;
  enableAuditLogging: boolean;
  guestCheckoutEnabled: boolean;

  ecommerce: {
    enable: boolean;
  };
  pos: {
    enable: boolean;
  };
  [key: string]: any;
}

const DEFAULT_SETTINGS: ERPSettings = {
  defaultStockId: "",
  onlineStockId: "",
  companyName: "",
  legalName: "",
  supportEmail: "",
  supportPhone: "",
  businessAddress: "",
  businessCity: "",
  taxRegistrationNumber: "",

  orderPrefix: "",
  invoicePrefix: "",
  poPrefix: "",
  grnPrefix: "",
  minOrderValue: 500,
  freeShippingThreshold: 15000,
  autoApproveOrders: false,

  currencySymbol: "Rs.",
  currencyCode: "LKR",
  timezone: "Asia/Colombo",
  dateFormat: "DD/MM/YYYY",

  autoReserveStock: true,
  allowNegativeStock: false,
  lowStockThreshold: 10,
  enableBarcodeScanner: true,

  invoiceDueDays: 14,
  latePaymentFeePercent: 2.5,

  notifyLowStockEmail: true,
  notifyNewOrderSMS: true,
  customerOrderConfirmationEmail: true,
  customerDispatchSMS: true,

  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  maintenanceMode: false,
  enableAuditLogging: true,
  guestCheckoutEnabled: true,

  ecommerce: { enable: true },
  pos: { enable: true },
};

interface SettingsContextType {
  settings: ERPSettings;
  loading: boolean;
  refetchSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: Partial<ERPSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date?: Date | string | null) => string;
  formatOrderNumber: (id: string | number) => string;
  formatInvoiceNumber: (id: string | number) => string;
  formatPONumber: (id: string | number) => string;
  formatGRNNumber: (id: string | number) => string;
  isLowStock: (quantity: number) => boolean;
  isFreeShippingEligible: (subtotal: number) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ERPSettings>(() => {
    try {
      const cached = window.localStorage.getItem("nvrErpSettings");
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn("Failed to parse cached settings", e);
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const dispatch = useAppDispatch();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/erp/settings/erp");
      if (response.data) {
        const merged = { ...DEFAULT_SETTINGS, ...response.data };
        setSettings(merged);
        window.localStorage.setItem("nvrErpSettings", JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Failed to fetch settings from API, using persisted cache", err);
      try {
        const cached = window.localStorage.getItem("nvrErpSettings");
        if (cached) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
        }
      } catch (e) {
        console.error("Cache read error", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocalSettings = useCallback((newSettings: Partial<ERPSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      window.localStorage.setItem("nvrErpSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSettings();
    }
  }, [currentUser, fetchSettings]);

  // Session Idle Timeout Listener
  useEffect(() => {
    if (!currentUser || !settings.sessionTimeoutMinutes) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutMs = settings.sessionTimeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        toast.error(`Session expired due to ${settings.sessionTimeoutMinutes}m inactivity.`);
        try {
          await logoutUserAction();
        } catch (e) {
          console.error("Auto logout error", e);
        } finally {
          dispatch(clearUser());
          window.location.href = "/login";
        }
      }, timeoutMs);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, settings.sessionTimeoutMinutes, dispatch]);

  // Format Helper Functions
  const formatCurrency = useCallback(
    (amount: number) => {
      const formatted = (amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${settings.currencySymbol} ${formatted}`;
    },
    [settings.currencySymbol]
  );

  const formatDate = useCallback(
    (date?: Date | string | null) => {
      if (!date) return "—";
      const formatStr = settings.dateFormat || "DD/MM/YYYY";
      return dayjs(date).format(formatStr);
    },
    [settings.dateFormat]
  );

  const formatOrderNumber = useCallback(
    (id: string | number) => {
      const raw = String(id).replace(/^(ORD-|INV-|PO-|GRN-)/i, "");
      const prefix = settings.orderPrefix ?? "";
      return `${prefix}${raw}`;
    },
    [settings.orderPrefix]
  );

  const formatInvoiceNumber = useCallback(
    (id: string | number) => {
      const raw = String(id).replace(/^(ORD-|INV-|PO-|GRN-)/i, "");
      const prefix = settings.invoicePrefix ?? "";
      return `${prefix}${raw}`;
    },
    [settings.invoicePrefix]
  );

  const formatPONumber = useCallback(
    (id: string | number) => {
      const raw = String(id).replace(/^(ORD-|INV-|PO-|GRN-)/i, "");
      const prefix = settings.poPrefix ?? "";
      return `${prefix}${raw}`;
    },
    [settings.poPrefix]
  );

  const formatGRNNumber = useCallback(
    (id: string | number) => {
      const raw = String(id).replace(/^(ORD-|INV-|PO-|GRN-)/i, "");
      const prefix = settings.grnPrefix ?? "";
      return `${prefix}${raw}`;
    },
    [settings.grnPrefix]
  );

  const isLowStock = useCallback(
    (quantity: number) => {
      return quantity <= (settings.lowStockThreshold || 10);
    },
    [settings.lowStockThreshold]
  );

  const isFreeShippingEligible = useCallback(
    (subtotal: number) => {
      return subtotal >= (settings.freeShippingThreshold || 15000);
    },
    [settings.freeShippingThreshold]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refetchSettings: fetchSettings,
        updateLocalSettings,
        formatCurrency,
        formatDate,
        formatOrderNumber,
        formatInvoiceNumber,
        formatPONumber,
        formatGRNNumber,
        isLowStock,
        isFreeShippingEligible,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
