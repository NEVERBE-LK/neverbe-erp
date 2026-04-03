import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import { lazy } from "react";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { getYearlySalesAction } from "@/actions/reportsActions";
import { Spin } from "antd";

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

  const primaryColor = "#10b981"; // Emerald 500
  const secondaryColor = "#d1fae5"; // Emerald 100

  // REDUCED HEIGHT HERE
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
      bar: { horizontal: false, columnWidth: "50%", borderRadius: 0 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0, colors: ["transparent"] },
    xaxis: {
      categories: months.length ? months : Array(12).fill("N/A"),
      axisBorder: {
        show: true,
        color: "#000000",
        height: 1,
        width: "100%",
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#71717a",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 800,
          cssClass: " ",
        },
      },
    },
    yaxis: {
      tickAmount: 3, // Reduced ticks for smaller height
      labels: {
        style: {
          colors: "#71717a",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 700,
        },
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 }, // Tighter padding
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      offsetY: -20, // Move legend up into header space
      fontFamily: "inherit",
      fontWeight: 700,
      labels: { colors: "#000000", useSeriesColors: false },
      markers: { width: 8, height: 8, radius: 0 },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    tooltip: {
      theme: "light",
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
    if (currentUser) {
      fetchSalesData();
    }
  }, [currentUser]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const data = await getYearlySalesAction();
      setSalesData({
        website: data.website,
        store: data.store,
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div>
        <h4 className="text-lg font-bold text-black">Sales Performance</h4>
        <p className="text-xs font-bold text-gray-400  ">
          Year to Date Comparison
        </p>
      </div>
      <Spin spinning={loading}>
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
      </Spin>
    </DashboardCard>
  );
};

export default SalesOverview;
