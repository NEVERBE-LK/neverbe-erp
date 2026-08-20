import React from "react";
import { Link } from "react-router-dom";
import { Row, Col } from "antd";
import PageContainer from "../components/container/PageContainer";
import {
  IconChartBar,
  IconArrowRight,
  IconPackage,
  IconCoin,
  IconReceipt,
  IconUsers,
} from "@tabler/icons-react";

const Reports = () => {
  const reportSections = [
    {
      id: "01",
      category: "Financial Analytics",
      icon: <IconCoin size={18} />,
      reports: [
        { title: "P&L Statement", link: "/reports/pnl" },
        { title: "Tax Report", link: "/reports/tax" },
        { title: "Cashflow Statement", link: "/reports/cash/cashflow" },
      ],
    },
    {
      id: "02",
      category: "Sales & Performance",
      icon: <IconChartBar size={18} />,
      reports: [
        { title: "Daily Summary", link: "/reports/sales/daily-summary" },
        { title: "Monthly Summary", link: "/reports/sales/monthly-summary" },
        { title: "Yearly Summary", link: "/reports/sales/yearly-summary" },
        { title: "Top Selling Products", link: "/reports/sales/top-products" },
        { title: "Sales by Category", link: "/reports/sales/by-category" },
        { title: "Sales by Brand", link: "/reports/sales/by-brand" },
        { title: "Sales vs Discount", link: "/reports/sales/sales-vs-discount" },
        { title: "By Payment Method", link: "/reports/sales/by-payment-method" },
        { title: "Refunds & Returns", link: "/reports/sales/refunds-returns" },
      ],
    },
    {
      id: "03",
      category: "Revenue & Earnings",
      icon: <IconCoin size={18} />,
      reports: [
        { title: "Daily Revenue", link: "/reports/revenues/daily-revenue" },
        { title: "Monthly Revenue", link: "/reports/revenues/monthly-revenue" },
        { title: "Yearly Revenue", link: "/reports/revenues/yearly-revenue" },
      ],
    },
    {
      id: "04",
      category: "Operating Expenses",
      icon: <IconReceipt size={18} />,
      reports: [{ title: "Expense Report", link: "/reports/expenses" }],
    },
    {
      id: "05",
      category: "Inventory & Warehouse",
      icon: <IconPackage size={18} />,
      reports: [
        { title: "Live Stock Overview", link: "/reports/stocks/live-stock" },
        { title: "Low Stock Alerts", link: "/reports/stocks/low-stock" },
        { title: "Stock Valuation", link: "/reports/stocks/valuation" },
      ],
    },
    {
      id: "06",
      category: "Customer Insights",
      icon: <IconUsers size={18} />,
      reports: [{ title: "Customer Analytics", link: "/reports/customers" }],
    },
  ];

  return (
    <PageContainer title="Reports Center">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
              Business Intelligence
            </span>
            <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
              Reports & Analytics Center
            </h2>
          </div>
        </div>

        {/* Report Categories */}
        <div className="space-y-8">
          {reportSections.map((section) => (
            <div key={section.id} className="space-y-4">
              {/* Section Kicker */}
              <div className="flex items-center gap-3 pb-2 border-b border-card-border dark:border-card-border-dark font-mono">
                <span className="text-xl font-bold text-text-sub dark:text-slate-500">
                  {section.id}
                </span>
                <div className="flex items-center gap-2 text-text-main dark:text-text-main-dark font-bold text-sm">
                  {section.icon}
                  <span>{section.category}</span>
                </div>
              </div>

              {/* Cards Grid */}
              <Row gutter={[16, 16]}>
                {section.reports.map((report, index) => (
                  <Col key={index} xs={24} sm={12} lg={8} xl={6}>
                    <Link to={report.link} className="block group">
                      <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between h-28">
                        <div className="w-6 h-1 bg-slate-900 dark:bg-slate-100 rounded-full" />
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="font-bold text-xs text-text-main dark:text-text-main-dark block group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                              {report.title}
                            </span>
                            <span className="text-[10px] text-text-sub dark:text-slate-500 font-mono block mt-0.5">
                              View Report &rarr;
                            </span>
                          </div>
                          <IconArrowRight
                            size={16}
                            className="text-text-main dark:text-text-main-dark opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;
