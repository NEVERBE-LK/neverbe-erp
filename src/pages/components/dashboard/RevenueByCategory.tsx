import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getRevenueByCategoryAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconRefresh, IconCategory2 } from "@tabler/icons-react";
import { Button, Tag, Spin, Tooltip, List, Typography } from "antd";

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

const RevenueByCategory = () => {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getRevenueByCategoryAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const widthColors = [
    "#16a34a",
    "#374151",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#e5e7eb",
  ];

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconCategory2 size={18} className="text-teal-500" />
          <h4 className="text-lg font-bold text-black m-0">
            Revenue by Category
          </h4>
          <Button
            type="text"
            shape="circle"
            icon={<IconRefresh size={14} />}
            onClick={fetchData}
            loading={loading}
          />
        </div>
        <Tag className="m-0 text-xs font-bold text-gray-500 bg-gray-100 border-none">
          This Month
        </Tag>
      </div>

      <Spin spinning={loading}>
        {data.length > 0 ? (
          <div className="space-y-4">
            {/* Stacked Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-sm bg-gray-100">
              {data.map((cat, idx) => (
                <Tooltip
                  key={cat.category}
                  title={`${cat.category}: ${cat.percentage}%`}
                >
                  <div
                    className="h-full transition-all duration-500 hover:opacity-80"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: widthColors[idx] || "#e5e7eb",
                    }}
                  />
                </Tooltip>
              ))}
            </div>

            <List
              dataSource={data}
              size="small"
              className="max-h-[200px] overflow-y-auto mt-4 px-1"
              renderItem={(item, idx) => (
                <List.Item className="bg-white hover:bg-gray-50 transition-all border border-gray-100 rounded-2xl shadow-sm mb-2 hover:shadow-md px-3! py-3!">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: widthColors[idx] || "#e5e7eb",
                        }}
                      ></span>
                      <div className="flex flex-col min-w-0">
                        <Typography.Text
                          strong
                          className="text-sm truncate w-full text-gray-900 leading-none"
                        >
                          {item.category}
                        </Typography.Text>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-1.5">
                          {item.orders} orders
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Typography.Text
                        strong
                        className="text-sm font-bold block text-black"
                      >
                        LKR {item.revenue.toLocaleString()}
                      </Typography.Text>
                      <Tag className="m-0 text-[10px] font-bold border-none bg-gray-100 px-2 mt-1">
                        {item.percentage}%
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
            <IconCategory2 size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-bold">No sales data this month</span>
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default RevenueByCategory;
