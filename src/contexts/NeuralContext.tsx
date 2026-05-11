import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface NeuralState {
  data: any | null;
  loading: boolean;
  refreshing: boolean;
  lastSynced: string | null;
  selectedYear: number;
  selectedMonth: number;
  setPeriod: (year: number, month: number) => void;
  refresh: (force?: boolean) => Promise<void>;
}

const NeuralContext = createContext<NeuralState | undefined>(undefined);

export const NeuralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1);

  const fetchNeural = useCallback(async (force: boolean = false, year?: number, month?: number) => {
    if (force) setRefreshing(true);
    
    const y = year || selectedYear;
    const m = month || selectedMonth;
    
    try {
      const resp = await api.get(`/api/v1/erp/ai/neural?refresh=${force}&year=${y}&month=${m}`);
      if (resp.data.success) {
        const feed = resp.data.data;
        setData(feed);
        setLastSynced(new Date().toISOString());
      }
    } catch (err) {
      console.error("Neural Synchronization Failed", err);
      if (force) toast.error("Neural Core synchronization failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  const setPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setLoading(true);
    fetchNeural(false, year, month);
  };

  // Initialization: fetch fresh
  useEffect(() => {
    fetchNeural(); // Initial fetch
  }, [fetchNeural]);

  return (
    <NeuralContext.Provider value={{
      data,
      loading,
      refreshing,
      lastSynced,
      selectedYear,
      selectedMonth,
      setPeriod,
      refresh: fetchNeural
    }}>
      {children}
    </NeuralContext.Provider>
  );
};

export const useNeural = () => {
  const context = useContext(NeuralContext);
  if (context === undefined) {
    throw new Error("useNeural must be used within a NeuralProvider");
  }
  return context;
};
