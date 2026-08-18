import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import { lazy } from "react";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { getYearlySalesAction } from "@/actions/reportsActions";
import Spinner from "../shared/Spinner";
import { useTheme } from "@/contexts/ThemeContext";

const Chart = lazy(() => import("react-apexcharts"));

const SalesOverview = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    website: Array(12).fill(0),
    store: Array(12).fill(0),
  });
  const [months] = useState<string[]>(
    Array.from({ length: 12 }, (_, i) =>
      new Date(0, i)
        .toLocaleString("default", { month: "short" })
        .toUpperCase(),
    ),
  );

  const { currentUser } = useAppSelector((state) => state.authSlice);
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const primaryColor = isDark ? "#cbd5e1" : "#0f172a";
  const secondaryColor = "#3b82f6";

  const chartHeight = 300;

  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      height: chartHeight,
      fontFamily: "inherit",
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeinout", speed: 500 },
    },
    colors: [primaryColor, secondaryColor],
    plotOptions: {
      bar: { horizontal: false, columnWidth: "45%", borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: months.length ? months : Array(12).fill("N/A"),
      axisBorder: {
        show: true,
        color: isDark ? "#334155" : "#e2e8f0",
        height: 1,
        width: "100%",
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 500,
          cssClass: " ",
        },
      },
    },
    yaxis: {
      tickAmount: 3,
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: isDark ? "#1e293b" : "#f1f5f9",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 20, right: 0, bottom: 0, left: 10 },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      offsetY: -10,
      fontFamily: "inherit",
      fontWeight: 500,
      labels: { colors: isDark ? "#94a3b8" : "#475569", useSeriesColors: false },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "12px", fontFamily: "inherit" },
      marker: { show: true },
      x: { show: false },
      fixed: { enabled: false, position: "topRight", offsetX: 0, offsetY: 0 },
      dropShadow: { enabled: false },
    },
  };

  const seriescolumnchart = [
    {
      name: "WEBSITE",
      data:
        salesData.website && salesData.website.length
          ? salesData.website
          : Array(12).fill(0),
    },
    {
      name: "STORE",
      data:
        salesData.store && salesData.store.length
          ? salesData.store
          : Array(12).fill(0),
    },
  ];

  useEffect(() => {
    if (!currentUser) return;

    fetchSalesData(true);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchSalesData(false);
      }
    }, 30000); // 30 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSalesData(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser]);

  const fetchSalesData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getYearlySalesAction();
      setSalesData({
        website: data.website,
        store: data.store,
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <DashboardCard title="Sales Performance" subtitle="Year to Date Comparison">
      <Spinner spinning={loading}>
        <div className="min-h-[300px]">
          {!loading && (
            <Chart
              options={optionscolumnchart}
              series={seriescolumnchart}
              type="bar"
              height={chartHeight}
              width={"100%"}
            />
          )}
        </div>
      </Spinner>
    </DashboardCard>
  );
};

export default SalesOverview;
