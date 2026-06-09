import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getDailyOverviewAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import {
  IconCurrencyDollar,
  IconRefresh,
  IconReceiptRefund,
} from "@tabler/icons-react";
import { Row, Col, Statistic, Card, Spin, Tag, Button } from "antd";

const DailyEarnings = () => {
  const [totalGrossSales, setTotalGrossSales] = useState(0);
  const [totalNetSales, setTotalNetSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0); // Future Implementation (Default 0)
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchDailyEarnings();
  }, [currentUser]);

  const fetchDailyEarnings = async () => {
    setLoading(true);
    try {
      const overview = await getDailyOverviewAction();
      setTotalGrossSales(overview.totalGrossSales);
      setTotalNetSales(overview.totalNetSales);
      setTotalProfit(overview.totalProfit);
      setInvoiceCount(overview.totalOrders);
      setTotalDiscount(overview.totalDiscount);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 min-w-0 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <h4 className="text-lg font-bold text-black truncate">
            Daily Overview
          </h4>
          <Button
            type="text"
            shape="circle"
            icon={<IconRefresh size={16} />}
            onClick={fetchDailyEarnings}
            loading={loading}
          />
        </div>

        <Tag color="green" className="m-0 font-bold">
          {invoiceCount} Orders
        </Tag>
      </div>

      <Spin spinning={loading}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Gross & Discount */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card
                size="small"
                bordered={false}
                className="bg-white h-full rounded-2xl shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Gross Sales
                    </span>
                  }
                  value={totalGrossSales}
                  precision={2}
                  prefix="LKR"
                  valueStyle={{
                    fontSize: "1.125rem",
                    fontWeight: "900",
                    color: "#1f2937",
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                bordered={false}
                className="bg-white h-full rounded-2xl shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Total Discounts
                    </span>
                  }
                  value={totalDiscount}
                  precision={2}
                  prefix="LKR"
                  valueStyle={{
                    fontSize: "1.125rem",
                    fontWeight: "900",
                    color: "#1f2937",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Row 2: Net Sales & Refunds */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card
                size="small"
                bordered={false}
                className="h-full rounded-2xl shadow-sm border border-green-200 bg-green-50 transition-all hover:-translate-y-0.5"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                      Net Sales
                    </span>
                  }
                  value={totalNetSales}
                  precision={2}
                  prefix="LKR"
                  valueStyle={{
                    fontSize: "1.25rem",
                    fontWeight: "900",
                    color: "#166534",
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                bordered={false}
                className="bg-white h-full rounded-2xl shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Refunds
                      </span>
                      <IconReceiptRefund size={12} className="text-gray-400" />
                    </div>
                  }
                  value={totalRefunds}
                  precision={2}
                  prefix="LKR"
                  valueStyle={{
                    fontSize: "1.125rem",
                    fontWeight: "900",
                    color: "#1f2937",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Row 3: Net Profit (Hero) */}
          <div className="bg-linear-to-r from-green-500 to-green-600 rounded-2xl shadow-lg border border-green-500 p-5 transition-all hover:-translate-y-0.5 hover:shadow-green-500/30">
            <Statistic
              title={
                <div className="flex items-center gap-2 mb-1">
                  <IconCurrencyDollar size={18} className="text-green-100" />
                  <span className="text-xs font-bold text-green-100 uppercase tracking-widest">
                    Profit
                  </span>
                </div>
              }
              value={totalProfit}
              precision={2}
              prefix="LKR"
              valueStyle={{
                fontSize: "2rem",
                fontWeight: "900",
                color: "#fff",
                letterSpacing: "-0.025em",
              }}
            />
          </div>
        </div>
      </Spin>
    </DashboardCard>
  );
};

export const dynamic = "force-dynamic";
export default DailyEarnings;
