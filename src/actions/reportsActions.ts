import api from "@/lib/api";

export const getMonthlyOverviewAction = async (from: string, to: string) => {
  try {
    const res = await api.get(
      `/api/v1/erp/reports/overview/monthly?from=${from}&to=${to}`,
    );
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getSalesReportAction = async (from: string, to: string) => {
  try {
    return await api({
      method: "GET",
      url: `/api/v1/erp/reports/sales?fromDate=${from}&toDate=${to}`,
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getDailyOverviewAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/dashboard/daily",
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getDashboardSummaryAction = async (refresh = false) => {
  try {
    const res = await api.get(`/api/v1/erp/dashboard/summary${refresh ? "?refresh=true" : ""}`);
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getStocksReportAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/reports/stock",
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getCashReportAction = async (from: string, to: string) => {
  try {
    return api({
      method: "GET",
      url: "/api/v1/erp/reports/cash?from=" + from + "&to=" + to,
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getExpenseReportAction = async (from: string, to: string) => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/reports/expense?from=" + from + "&to=" + to,
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getYearlySalesAction = async (year?: number) => {
  try {
    const url = year
      ? `/api/v1/erp/dashboard/sales?year=${year}`
      : "/api/v1/erp/dashboard/sales";
    const res = await api({
      method: "GET",
      url,
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getRecentOrdersAction = async (limit: number = 6) => {
  try {
    const res = await api({
      method: "GET",
      url: `/api/v1/erp/dashboard/recent-orders?limit=${limit}`,
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

// ============================================================
// NEW DASHBOARD ACTIONS
// ============================================================

export const getLowStockAlertsAction = async (
  threshold: number = 5,
  limit: number = 10,
) => {
  try {
    const res = await api({
      method: "GET",
      url: `/api/v1/erp/dashboard/low-stock?threshold=${threshold}&limit=${limit}`,
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getMonthlyComparisonAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/dashboard/monthly-comparison",
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getOrderStatusDistributionAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/dashboard/order-status",
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getProfitMarginsAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/dashboard/profit-margins",
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getRevenueByCategoryAction = async () => {
  try {
    const res = await api({
      method: "GET",
      url: "/api/v1/erp/dashboard/revenue-by-category",
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
