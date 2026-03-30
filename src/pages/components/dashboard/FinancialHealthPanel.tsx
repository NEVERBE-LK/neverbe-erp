import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState, lazy } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  getProfitMarginsAction,
  getExpenseSummaryAction,
  getInventoryValueAction,
} from "@/actions/reportsActions";
import toast from "react-hot-toast";
import {
  IconPercentage,
  IconReceipt,
  IconPackage,
  IconCoin,
  IconCategory,
} from "@tabler/icons-react";
import {
  Button,
  Spin,
  Tag,
  Tabs,
  Progress,
  Statistic,
  Card,
  Row,
  Col,
  Typography,
} from "antd";

interface MarginData {
  grossMargin: number;
  netMargin: number;
  avgOrderValue: number;
}
interface ExpenseData {
  todayExpenses: number;
  monthExpenses: number;
  topCategory: string;
  topCategoryAmount: number;
}
interface InventoryData {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  avgItemValue: number;
}

const FinancialHealthPanel = () => {
  const [margins, setMargins] = useState<MarginData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseData | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchAll();
  }, [currentUser]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, e, i] = await Promise.all([
        getProfitMarginsAction(),
        getExpenseSummaryAction(),
        getInventoryValueAction(),
      ]);
      setMargins(m);
      setExpenses(e);
      setInventory(i);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: "margins",
      label: (
        <span className="flex items-center gap-1 text-xs font-bold">
          <IconPercentage size={13} /> Margins
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {margins ? (
            <div className="flex flex-col gap-4 pt-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">
                    Gross Margin
                  </span>
                  <span className="text-sm font-bold text-black">
                    {margins.grossMargin}%
                  </span>
                </div>
                <Progress
                  percent={margins.grossMargin}
                  showInfo={false}
                  strokeColor="#10b981"
                  trailColor="#f3f4f6"
                  size="small"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">
                    Net Margin
                  </span>
                  <span className="text-sm font-bold text-black">
                    {margins.netMargin}%
                  </span>
                </div>
                <Progress
                  percent={margins.netMargin}
                  showInfo={false}
                  strokeColor="#16a34a"
                  trailColor="#f3f4f6"
                  size="small"
                />
              </div>
              <Card
                size="small"
                bordered={false}
                className="bg-white shadow-sm border border-gray-100 rounded-2xl"
              >
                <Statistic
                  title={
                    <div className="flex items-center gap-1">
                      <IconCoin size={12} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Avg. Order Value
                      </span>
                    </div>
                  }
                  value={margins.avgOrderValue}
                  precision={2}
                  prefix={
                    <span className="text-[10px] font-bold text-gray-400 mr-1 uppercase">
                      LKR
                    </span>
                  }
                  valueStyle={{
                    fontSize: "1rem",
                    fontWeight: "900",
                    color: "#1f2937",
                  }}
                />
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">No data</div>
          )}
        </Spin>
      ),
    },
    {
      key: "expenses",
      label: (
        <span className="flex items-center gap-1 text-xs font-bold">
          <IconReceipt size={13} /> Expenses
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {expenses ? (
            <div className="flex flex-col gap-3 pt-2">
              <Row gutter={[10, 10]}>
                <Col span={12}>
                  <Card
                    size="small"
                    bordered={false}
                    className="rounded-2xl shadow-sm border border-gray-100"
                  >
                    <Statistic
                      title={
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Today
                        </span>
                      }
                      value={expenses.todayExpenses}
                      precision={2}
                      prefix={
                        <span className="text-[10px] font-bold text-gray-400 mr-1">
                          LKR
                        </span>
                      }
                      valueStyle={{
                        fontSize: "1rem",
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
                    className="rounded-2xl shadow-sm border border-gray-200 bg-green-50/50"
                  >
                    <Statistic
                      title={
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                          This Month
                        </span>
                      }
                      value={expenses.monthExpenses}
                      precision={2}
                      prefix={
                        <span className="text-[10px] font-bold text-green-700 mr-1">
                          LKR
                        </span>
                      }
                      valueStyle={{
                        fontSize: "1rem",
                        fontWeight: "900",
                        color: "#166534",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
              <Card
                size="small"
                bordered={false}
                className="rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IconCategory size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Top Category
                    </span>
                  </div>
                  <Tag className="m-0 font-bold border-none rounded-lg">
                    {expenses.topCategory}
                  </Tag>
                </div>
                <div className="text-right mt-1">
                  <Typography.Text strong className="text-sm">
                    LKR {expenses.topCategoryAmount.toLocaleString()}
                  </Typography.Text>
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">No data</div>
          )}
        </Spin>
      ),
    },
    {
      key: "inventory",
      label: (
        <span className="flex items-center gap-1 text-xs font-bold">
          <IconPackage size={13} /> Inventory
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {inventory ? (
            <div className="flex flex-col gap-3 pt-2">
              <Card
                size="small"
                bordered={false}
                className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-sm border-none overflow-hidden"
              >
                <Statistic
                  title={
                    <span className="text-[10px] font-bold text-emerald-50/90 uppercase tracking-widest">
                      Total Stock Value
                    </span>
                  }
                  value={inventory.totalValue}
                  precision={2}
                  prefix={
                    <span className="text-sm font-bold text-emerald-100/90 mr-1">
                      LKR
                    </span>
                  }
                  valueStyle={{
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.5rem",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                />
              </Card>
              <Row gutter={[8, 8]}>
                {[
                  {
                    label: "Products",
                    value: inventory.totalProducts,
                    decimals: 0,
                  },
                  { label: "Qty", value: inventory.totalQuantity, decimals: 0 },
                  {
                    label: "Avg/Item",
                    value: inventory.avgItemValue,
                    decimals: 1,
                  },
                ].map((item) => (
                  <Col span={8} key={item.label}>
                    <Card
                      size="small"
                      bordered={false}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center"
                      style={{ padding: "8px" }}
                    >
                      <Statistic
                        title={
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.label}
                          </span>
                        }
                        value={item.value}
                        precision={item.decimals}
                        valueStyle={{
                          fontSize: "1rem",
                          fontWeight: "900",
                          color: "#1f2937",
                        }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">No data</div>
          )}
        </Spin>
      ),
    },
  ];

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-bold text-black m-0">Financial Health</h4>
        
      </div>
      <Tabs items={tabItems} size="small" defaultActiveKey="margins" />
    </DashboardCard>
  );
};

export default FinancialHealthPanel;
