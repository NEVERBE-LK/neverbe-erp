import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getWeeklyTrendsAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconTrendingUp } from "@tabler/icons-react";
import { lazy } from "react";
import { Button, Spin, Tag } from "antd";

const Chart = lazy(() => import("react-apexcharts"));

interface WeeklyData {
  labels: string[];
  orders: number[];
  revenue: number[];
}

const WeeklyTrends = () => {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getWeeklyTrendsAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions: any = {
    chart: {
      type: "area",
      height: 150,
      sparkline: { enabled: false },
      fontFamily: "inherit",
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeinout", speed: 500 },
    },
    colors: ["#16a34a", "#60a5fa"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data?.labels || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#71717a",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 700,
        },
      },
    },
    yaxis: {
      show: false,
    },
    grid: {
      show: false,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: "10px",
      labels: { colors: "#71717a" },
      markers: { width: 8, height: 8, radius: 0 },
    },
    tooltip: {
      theme: "light",
      style: { fontSize: "11px", fontFamily: "inherit" },
    },
  };

  const series = data
    ? [
        { name: "Orders", data: data.orders },
        {
          name: "Revenue (K)",
          data: data.revenue.map((r) => Math.round(r / 1000)),
        },
      ]
    : [];

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconTrendingUp size={18} className="text-green-500" />
          <h4 className="text-lg font-bold text-black m-0">Weekly Trends</h4>
          
        </div>
        <Tag className="m-0 text-xs font-bold text-gray-500 bg-gray-100 border-none">
          Last 7 Days
        </Tag>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={180}
          />
        ) : (
          <div className="text-center text-gray-400 py-8 min-h-[180px] flex items-center justify-center">
            No data available
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default WeeklyTrends;
