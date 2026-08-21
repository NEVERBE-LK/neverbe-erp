import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/container/PageContainer";
import {
  IconChartBar,
  IconArrowRight,
  IconPackage,
  IconCoin,
  IconReceipt,
  IconUsers,
  IconSearch,
  IconTrendingUp,
  IconReceiptTax,
  IconFileText,
  IconDiscount,
  IconRotate2,
  IconCreditCard,
  IconStar,
} from "@tabler/icons-react";

interface ReportItem {
  title: string;
  link: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
  isPopular?: boolean;
}

interface ReportSection {
  id: string;
  category: string;
  icon: React.ReactNode;
  reports: ReportItem[];
}

const reportSections: ReportSection[] = [
  {
    id: "financial",
    category: "Financial Analytics",
    icon: <IconCoin size={18} className="text-emerald-500" />,
    reports: [
      {
        title: "P&L Statement",
        link: "/reports/pnl",
        description: "Comprehensive profit and loss statement across operations",
        tag: "FINANCIAL",
        icon: <IconFileText size={16} />,
        isPopular: true,
      },
      {
        title: "Tax Report",
        link: "/reports/tax",
        description: "Tax liability summary and breakdowns",
        tag: "TAX",
        icon: <IconReceiptTax size={16} />,
      },
      {
        title: "Cashflow Statement",
        link: "/reports/cash/cashflow",
        description: "Cash inflows, outflows, and net liquidity",
        tag: "LIQUIDITY",
        icon: <IconTrendingUp size={16} />,
      },
    ],
  },
  {
    id: "sales",
    category: "Sales & Performance",
    icon: <IconChartBar size={18} className="text-blue-500" />,
    reports: [
      {
        title: "Daily Summary",
        link: "/reports/sales/daily-summary",
        description: "24-hour order metrics, sales volume, and order totals",
        tag: "DAILY",
        icon: <IconChartBar size={16} />,
        isPopular: true,
      },
      {
        title: "Monthly Summary",
        link: "/reports/sales/monthly-summary",
        description: "Monthly sales breakdown and performance targets",
        tag: "MONTHLY",
        icon: <IconChartBar size={16} />,
      },
      {
        title: "Yearly Summary",
        link: "/reports/sales/yearly-summary",
        description: "Annual growth trajectory and historical comparison",
        tag: "ANNUAL",
        icon: <IconChartBar size={16} />,
      },
      {
        title: "Top Selling Products",
        link: "/reports/sales/top-products",
        description: "Best performing items by quantity and gross revenue",
        tag: "PRODUCTS",
        icon: <IconStar size={16} />,
        isPopular: true,
      },
      {
        title: "Sales by Category",
        link: "/reports/sales/by-category",
        description: "Revenue contribution grouped by product categories",
        tag: "CATEGORY",
        icon: <IconChartBar size={16} />,
      },
      {
        title: "Sales by Brand",
        link: "/reports/sales/by-brand",
        description: "Brand distribution and performance metrics",
        tag: "BRAND",
        icon: <IconChartBar size={16} />,
      },
      {
        title: "Sales vs Discount",
        link: "/reports/sales/sales-vs-discount",
        description: "Impact of promotional discounts on net revenue",
        tag: "MARGINS",
        icon: <IconDiscount size={16} />,
      },
      {
        title: "By Payment Method",
        link: "/reports/sales/by-payment-method",
        description: "Sales channel breakdown by gateway and cash",
        tag: "PAYMENTS",
        icon: <IconCreditCard size={16} />,
      },
      {
        title: "Refunds & Returns",
        link: "/reports/sales/refunds-returns",
        description: "Return volume, reason tracking, and refund totals",
        tag: "RETURNS",
        icon: <IconRotate2 size={16} />,
      },
    ],
  },
  {
    id: "revenue",
    category: "Revenue & Earnings",
    icon: <IconTrendingUp size={18} className="text-amber-500" />,
    reports: [
      {
        title: "Daily Revenue",
        link: "/reports/revenues/daily-revenue",
        description: "Real-time daily revenue tracking and trend analysis",
        tag: "REVENUE",
        icon: <IconTrendingUp size={16} />,
        isPopular: true,
      },
      {
        title: "Monthly Revenue",
        link: "/reports/revenues/monthly-revenue",
        description: "Monthly gross vs net revenue distribution",
        tag: "REVENUE",
        icon: <IconTrendingUp size={16} />,
      },
      {
        title: "Yearly Revenue",
        link: "/reports/revenues/yearly-revenue",
        description: "Multi-year revenue velocity and period growth",
        tag: "REVENUE",
        icon: <IconTrendingUp size={16} />,
      },
    ],
  },
  {
    id: "expenses",
    category: "Operating Expenses",
    icon: <IconReceipt size={18} className="text-rose-500" />,
    reports: [
      {
        title: "Expense Report",
        link: "/reports/expenses",
        description: "Detailed category-wise operating expense breakdown",
        tag: "EXPENSES",
        icon: <IconReceipt size={16} />,
      },
    ],
  },
  {
    id: "inventory",
    category: "Inventory & Warehouse",
    icon: <IconPackage size={18} className="text-purple-500" />,
    reports: [
      {
        title: "Live Stock Overview",
        link: "/reports/stocks/live-stock",
        description: "Current warehouse stock levels and SKU breakdown",
        tag: "STOCK",
        icon: <IconPackage size={16} />,
        isPopular: true,
      },
      {
        title: "Low Stock Alerts",
        link: "/reports/stocks/low-stock",
        description: "Inventory reorder points and low-stock items",
        tag: "ALERTS",
        icon: <IconPackage size={16} />,
      },
      {
        title: "Stock Valuation",
        link: "/reports/stocks/valuation",
        description: "Total asset inventory valuation based on cost price",
        tag: "VALUATION",
        icon: <IconPackage size={16} />,
      },
    ],
  },
  {
    id: "customers",
    category: "Customer Insights",
    icon: <IconUsers size={18} className="text-teal-500" />,
    reports: [
      {
        title: "Customer Analytics",
        link: "/reports/customers",
        description: "Customer purchasing behavior, risk, and repeat rate",
        tag: "CUSTOMERS",
        icon: <IconUsers size={16} />,
      },
    ],
  },
];

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const popularReports = useMemo(() => {
    return reportSections
      .flatMap((section) => section.reports)
      .filter((r) => r.isPopular);
  }, []);

  const filteredSections = useMemo(() => {
    return reportSections
      .map((section) => {
        if (activeTab !== "all" && section.id !== activeTab) {
          return null;
        }

        const matchingReports = section.reports.filter((report) => {
          const query = searchTerm.toLowerCase().trim();
          if (!query) return true;
          return (
            report.title.toLowerCase().includes(query) ||
            report.description.toLowerCase().includes(query) ||
            report.tag.toLowerCase().includes(query)
          );
        });

        if (matchingReports.length === 0) return null;

        return {
          ...section,
          reports: matchingReports,
        };
      })
      .filter(Boolean) as ReportSection[];
  }, [searchTerm, activeTab]);

  const totalReportsCount = useMemo(() => {
    return reportSections.reduce((sum, s) => sum + s.reports.length, 0);
  }, []);

  return (
    <PageContainer title="Reports Center">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border dark:border-card-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-brand dark:bg-brand-dark rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Business Intelligence
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none font-mono">
                  Reports & Analytics Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-card-border dark:border-card-border-dark font-mono">
                  {totalReportsCount} Reports
                </span>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative w-full md:w-72">
            <IconSearch
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl text-text-main dark:text-text-main-dark placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-card-border dark:border-card-border-dark">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-text-sub dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All ({totalReportsCount})
          </button>
          {reportSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === sec.id
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-text-sub dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {sec.category} ({sec.reports.length})
            </button>
          ))}
        </div>

        {/* Report Sections & Cards */}
        {filteredSections.length > 0 ? (
          <div className="space-y-6">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-3">
                {/* Section Kicker */}
                <div className="flex items-center justify-between pb-1.5 font-mono">
                  <div className="flex items-center gap-2 text-text-main dark:text-text-main-dark font-bold text-xs">
                    {section.icon}
                    <span>{section.category}</span>
                  </div>
                  <span className="text-[10px] font-bold text-text-sub dark:text-slate-500">
                    {section.reports.length} {section.reports.length === 1 ? "Report" : "Reports"}
                  </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {section.reports.map((report) => (
                    <Link
                      key={report.link}
                      to={report.link}
                      className="group block"
                    >
                      <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-3.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-32">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-300">
                              {report.icon}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {report.tag}
                            </span>
                          </div>
                          <span className="font-bold text-xs text-text-main dark:text-text-main-dark block group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors line-clamp-1">
                            {report.title}
                          </span>
                          <p className="text-[11px] text-text-sub dark:text-slate-500 leading-snug line-clamp-2 mt-1">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 font-mono">
                          <span className="text-[10px] font-semibold text-text-sub dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                            Open Report
                          </span>
                          <IconArrowRight
                            size={13}
                            className="text-text-sub dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-12 text-center">
            <IconSearch size={32} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark mb-1">
              No matching reports found
            </h3>
            <p className="text-xs text-text-sub dark:text-slate-500 mb-4">
              Try adjusting your search query or switching category filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveTab("all");
              }}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Reports;

