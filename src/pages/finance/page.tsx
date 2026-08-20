import api from "@/lib/api";
import React, { useEffect, useState, lazy } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconReceipt,
  IconBuildingBank,
  IconTrendingUp,
} from "@tabler/icons-react";
import type { FinanceDashboardData } from "@/model/FinanceDashboard";
import { Row, Col, Statistic, Table, Button, Space, Select } from "antd";
import DashboardCard from "@/pages/components/shared/DashboardCard";
import Spinner from "@/pages/components/shared/Spinner";

const Chart = lazy(() => import("react-apexcharts"));
const { Option } = Select;

const FinanceDashboard = () => {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <Spinner size="large" tip="Loading Financial Overview..." />
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer title="Finance Dashboard">
        <div className="p-8 text-center text-text-sub text-sm">Failed to load finance data</div>
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

  const cashFlowOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#10b981", "#64748b"],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "50%" },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cashFlow.map((c: any) => c.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#94a3b8" } },
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
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              record.type === "income"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
            }`}
          >
            {record.type === "income" ? (
              <IconArrowUpRight size={14} />
            ) : (
              <IconArrowDownRight size={14} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">{text}</span>
            <span className="text-[10px] text-text-sub dark:text-slate-500 font-mono">
              {record.date}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (text: string) => <span className="text-xs text-text-sub dark:text-slate-400">{text || "—"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number, record: any) => (
        <span
          className={`font-mono text-xs font-bold ${
            record.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-text-main dark:text-text-main-dark"
          }`}
        >
          {record.type === "income" ? "+" : "-"} {formatCurrency(amount)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Finance Overview">
      <Space direction="vertical" size="large" className="w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Finance
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                Financial Overview
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconTrendingUp size={16} />}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Generate Report
          </Button>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title={<span className="text-xs font-semibold text-text-sub uppercase font-mono">Total Bank Balance</span>}
                value={cards.totalBankBalance}
                prefix={<IconBuildingBank size={18} className="mr-2 text-emerald-600 dark:text-emerald-400" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
                valueStyle={{ fontSize: "1.25rem", fontWeight: "700" }}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono">
                  <IconArrowUpRight size={10} />
                  Up
                </span>
                <span className="text-[10px] text-text-sub font-mono">Across all accounts</span>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title={<span className="text-xs font-semibold text-text-sub uppercase font-mono">Accounts Payable</span>}
                value={cards.totalPayable}
                prefix={<IconReceipt size={18} className="mr-2 text-rose-500" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
                valueStyle={{ fontSize: "1.25rem", fontWeight: "700" }}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono">
                  <IconArrowDownRight size={10} />
                  Pending
                </span>
                <span className="text-[10px] text-text-sub font-mono">Total Outstanding</span>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title={<span className="text-xs font-semibold text-text-sub uppercase font-mono">Monthly Expenses</span>}
                value={cards.monthlyExpenses}
                prefix={<IconWallet size={18} className="mr-2 text-blue-500" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
                valueStyle={{ fontSize: "1.25rem", fontWeight: "700" }}
              />
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-mono">
                  This Month
                </span>
              </div>
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DashboardCard>
              <Statistic
                title={<span className="text-xs font-semibold text-text-sub uppercase font-mono">Monthly Income</span>}
                value={cards.monthlyIncome}
                prefix={<IconArrowUpRight size={18} className="mr-2 text-emerald-500" />}
                formatter={(val) => `Rs ${val.toLocaleString()}`}
                valueStyle={{ fontSize: "1.25rem", fontWeight: "700" }}
              />
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono">
                  This Month
                </span>
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
                <Select defaultValue="This Month" size="small" variant="borderless">
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
                  <span className="text-xl font-bold font-mono text-text-main dark:text-text-main-dark">
                    {(
                      (expenseBreakdown.reduce(
                        (acc: any, curr: any) => acc + curr.amount,
                        0
                      ) /
                        (cards.monthlyExpenses || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-3 font-mono">
                {expenseBreakdown.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: item.color }}
                      ></span>
                      <span className="text-text-sub dark:text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-bold text-text-main dark:text-text-main-dark">
                      {formatCurrency(item.amount)}
                    </span>
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
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline font-mono uppercase"
            >
              View All
            </a>
          }
        >
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 800 }}
              columns={transactionColumns}
              dataSource={recentTransactions}
              rowKey="id"
              pagination={false}
            />
          </div>
        </DashboardCard>
      </Space>
    </PageContainer>
  );
};

export default FinanceDashboard;
