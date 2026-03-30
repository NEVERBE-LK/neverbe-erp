import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconReceipt,
  IconBuildingBank,
  IconTrendingUp,
} from "@tabler/icons-react";
import { lazy } from "react";
const Chart = lazy(() => import("react-apexcharts"));
import type { FinanceDashboardData } from "@/model/FinanceDashboard";
import {
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Typography,
  Space,
  Select,
  Tag,
  Spin,
} from "antd";
import DashboardCard from "@/pages/components/shared/DashboardCard";
import NeuralFinanceInsight from "./components/NeuralFinanceInsight";

const { Option } = Select;

const FinanceDashboard = () => {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [neuralData, setNeuralData] = useState<any>(null);

  useEffect(() => {
    const fetchNeural = async () => {
       try {
          const resp = await api.get('/api/v1/erp/ai/neural');
          if (resp.data.success) setNeuralData(resp.data.data);
       } catch (err) {
          console.error("Neural Finance Err", err);
       }
    };
    fetchNeural();

    const fetchData = async () => {
      try {
        const res = await api.get("/api/v1/erp/finance/dashboard");
        setData(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Finance Dashboard">
        <div className="flex justify-center items-center h-[60vh]">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer title="Finance Dashboard">
        <div>Error loading data</div>
      </PageContainer>
    );
  }

  const {
    cards = {
      totalBankBalance: 0,
      totalPayable: 0,
      monthlyExpenses: 0,
      monthlyIncome: 0,
    },
    expenseBreakdown = [],
    recentTransactions = [],
    cashFlow = [],
  } = data;

  // Chart Configs
  const cashFlowOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#16a34a", "#E5E7EB"],
    plotOptions: {
      bar: { borderRadius: 2, columnWidth: "50%" },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cashFlow.map((c: any) => c.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: true, position: "top", horizontalAlign: "right" },
  };

  const cashFlowSeries = [
    { name: "Income", data: cashFlow.map((c: any) => c.income) },
    { name: "Expense", data: cashFlow.map((c: any) => c.expense) },
  ];

  const pieOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: expenseBreakdown.map((e: any) => e.category),
    colors: expenseBreakdown.map((e: any) => e.color),
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "75%" } } },
    stroke: { show: false },
  };

  const pieSeries = expenseBreakdown.map((e: any) => e.amount);

  const formatCurrency = (val: number) => `Rs ${val?.toLocaleString()}`;

  const transactionColumns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text: string, record: any) => (
        <Space>
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full ${record.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
          >
            {record.type === "income" ? (
              <IconArrowUpRight size={14} />
            ) : (
              <IconArrowDownRight size={14} />
            )}
          </div>
          <div className="flex flex-col">
            <Typography.Text strong>{text}</Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {record.date}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number, record: any) => (
        <Typography.Text
          strong
          type={record.type === "income" ? "success" : undefined}
        >
          {record.type === "income" ? "+" : "-"} {formatCurrency(amount)}
        </Typography.Text>
      ),
    },
  ];

  return (
    <PageContainer title="Finance Overview">
      <Space direction="vertical" size="large" className="w-full">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Finance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Financial Overview
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconTrendingUp size={18} />}
            className="flex items-center gap-2"
          >
            Generate Report
          </Button>
        </div>

        {/* 🧠 Neural Strategy Hub */}
        <NeuralFinanceInsight neuralData={neuralData} />

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title="Total Bank Balance"
                value={cards.totalBankBalance}
                prefix={
                  <IconBuildingBank size={20} className="mr-2 text-green-600" />
                }
                formatter={(val) => `Rs ${val.toLocaleString()}`}
              />
              <div className="mt-2">
                <Tag color="green">
                  <IconArrowUpRight size={12} className="inline mr-1" />
                  Up
                </Tag>
                <span className="text-xs text-gray-400">
                  Across all accounts
                </span>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title="Accounts Payable"
                value={cards.totalPayable}
                prefix={<IconReceipt size={20} className="mr-2 text-red-500" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
              />
              <div className="mt-2">
                <Tag color="red">
                  <IconArrowDownRight size={12} className="inline mr-1" />
                  Down
                </Tag>
                <span className="text-xs text-gray-400">Total Outstanding</span>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title="Monthly Expenses"
                value={cards.monthlyExpenses}
                prefix={<IconWallet size={20} className="mr-2 text-blue-500" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
              />
              <div className="mt-2">
                <Tag color="blue">This Month</Tag>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title="Monthly Income"
                value={cards.monthlyIncome}
                prefix={
                  <IconArrowUpRight size={20} className="mr-2 text-green-500" />
                }
                formatter={(val) => `Rs ${val.toLocaleString()}`}
              />
              <div className="mt-2">
                <Tag color="green">This Month</Tag>
              </div>
            </DashboardCard>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]}>
          {/* Cash Flow */}
          <Col xs={24} lg={16}>
            <DashboardCard
              title="Cash Flow"
              action={
                <Select defaultValue="This Month" size="small" bordered={false}>
                  <Option value="This Month">This Month</Option>
                </Select>
              }
            >
              <Chart
                options={cashFlowOptions as any}
                series={cashFlowSeries}
                type="bar"
                height={300}
              />
            </DashboardCard>
          </Col>

          {/* Expense Breakdown */}
          <Col xs={24} lg={8}>
            <DashboardCard title="Expense Breakdown">
              <div className="relative h-[200px] mb-6 flex items-center justify-center">
                <Chart
                  options={pieOptions as any}
                  series={pieSeries}
                  type="donut"
                  height={220}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Typography.Title level={3} className="!m-0">
                    {(
                      (expenseBreakdown.reduce(
                        (acc: any, curr: any) => acc + curr.amount,
                        0,
                      ) /
                        cards.monthlyExpenses) *
                      100
                    ).toFixed(0)}
                    %
                  </Typography.Title>
                </div>
              </div>
              <div className="space-y-3">
                {expenseBreakdown.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: item.color }}
                      ></span>
                      <Typography.Text className="text-xs">
                        {item.category}
                      </Typography.Text>
                    </div>
                    <Typography.Text strong className="text-xs">
                      {formatCurrency(item.amount)}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </Col>
        </Row>

        {/* Recent Transactions */}
        <DashboardCard
          title="Recent Transactions"
          action={
            <a
              href="/finance/petty-cash"
              className="text-green-600 font-bold hover:underline"
            >
              View All
            </a>
          }
        >
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={transactionColumns}
            dataSource={recentTransactions}
            rowKey="id"
            pagination={false}
          />
        </DashboardCard>
      </Space>
    </PageContainer>
  );
};

export default FinanceDashboard;
