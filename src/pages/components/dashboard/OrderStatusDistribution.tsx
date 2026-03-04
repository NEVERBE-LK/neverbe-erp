import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getOrderStatusDistributionAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconChartPie } from "@tabler/icons-react";
import { lazy } from "react";
import { Button, Tag, Spin } from "antd";

const Chart = lazy(() => import("react-apexcharts"));

interface StatusData {
  pending: number;
  processing: number;
  shipped: number;
  completed: number;
  cancelled: number;
  refunded: number;
}

const OrderStatusDistribution = () => {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getOrderStatusDistributionAction();
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
      type: "donut",
      fontFamily: "inherit",
    },
    labels: ["Pending", "Completed", "Cancelled", "Refunded"],
    colors: ["#fbbf24", "#10b981", "#ef4444", "#8b5cf6"], // Yellow, Green, Red, Purple
    legend: {
      position: "bottom",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: "10px",
      labels: { colors: "#71717a" },
      markers: { width: 8, height: 8, radius: 0 },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "10px",
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#71717a",
            },
            value: {
              show: true,
              fontSize: "20px",
              fontFamily: "inherit",
              fontWeight: 900,
              color: "#000000",
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "10px",
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#71717a",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val} orders`,
      },
    },
  };

  const series = data
    ? [data.pending, data.completed, data.cancelled, data.refunded]
    : [];

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconChartPie size={18} className="text-purple-500" />
          <h4 className="text-lg font-bold text-black m-0">Order Status</h4>
        </div>
        <Tag className="m-0 text-xs font-bold text-gray-500 bg-gray-100 border-none">
          This Month
        </Tag>
      </div>

      <Spin spinning={loading}>
        {data && series.some((v) => v > 0) ? (
          <Chart
            options={chartOptions}
            series={series}
            type="donut"
            height={220}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
            <IconChartPie size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-bold">No orders this month</span>
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default OrderStatusDistribution;
