import api from "@/lib/api";

import {
  Button,
  Card,
  DatePicker,
  Form,
  Space,
  Spin,
  Tag,
  Progress,
} from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";

interface ProfitLossStatement {
  period: { from: string; to: string };
  revenue: {
    grossSales: number;
    discounts: number;
    netSales: number;
    shippingIncome: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: {
    productCost: number;
    shippingCost: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    byCategory: { category: string; amount: number }[];
    totalExpenses: number;
  };
  operatingIncome: number;
  otherExpenses: {
    transactionFees: number;
    otherFees: number;
    totalOther: number;
  };
  netProfit: number;
  netProfitMargin: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const ProfitLossPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProfitLossStatement | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    setLoading(true);
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }
    try {
      const res = await api.get<ProfitLossStatement>(
        "/api/v1/erp/reports/pnl",
        {
          params: { from: fromDate, to: toDate },
        },
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch P&L statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs().startOf("month"), dayjs()] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report) {
      toast("No data to export");
      return;
    }

    /* ── colour palette ─────────────────────────────────── */
    const DARK = "FF111827"; // gray-900
    const GREEN = "FF059669"; // emerald-600
    const RED = "FFDC2626"; // red-600

    const LGRAY = "FFF9FAFB"; // section bg
    const MGRAY = "FFF3F4F6"; // subtotal bg
    const WHITE = "FFFFFFFF";
    const ACCENT = "FF064E3B"; // dark green

    type CellVal = string | number;
    type Row = (CellVal | null)[];

    /* ── cell builder helper ─────────────────────────────── */
    const cell = (
      v: CellVal | null,
      opts: {
        bold?: boolean;
        italic?: boolean;
        color?: string; // ARGB
        bg?: string; // ARGB fill
        fmt?: string; // numFmt
        align?: "left" | "right" | "center";
        border?: boolean;
        indent?: number;
      } = {},
    ) => ({
      v: v ?? "",
      t: typeof v === "number" ? "n" : "s",
      s: {
        font: {
          bold: opts.bold ?? false,
          italic: opts.italic ?? false,
          color: { rgb: opts.color ?? "FF1F2937" },
          sz: 10,
          name: "Calibri",
        },
        fill: opts.bg
          ? { patternType: "solid", fgColor: { rgb: opts.bg } }
          : { patternType: "none" },
        alignment: {
          horizontal: opts.align ?? "left",
          vertical: "center",
          indent: opts.indent ?? 0,
          wrapText: false,
        },
        numFmt: opts.fmt ?? (typeof v === "number" ? "#,##0.00" : "@"),
        border: opts.border
          ? {
              top: { style: "thin", color: { rgb: "FFE5E7EB" } },
              bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
              left: { style: "thin", color: { rgb: "FFE5E7EB" } },
              right: { style: "thin", color: { rgb: "FFE5E7EB" } },
            }
          : {},
      },
    });

    /* ── header builder ──────────────────────────────────── */
    const sectionRow = (label: string): Row => [label, null, null, null];
    const dataRow = (
      label: string,
      amount: number | null,
      pct?: number | null,
    ): Row => [label, amount, pct ?? null, null];
    const totalRow = (label: string, amount: number): Row => [
      label,
      amount,
      null,
      null,
    ];
    const spacer = (): Row => [null, null, null, null];

    /* ── raw rows ────────────────────────────────────────── */
    const rows: {
      raw: Row;
      type:
        | "title"
        | "section"
        | "data"
        | "subtotal"
        | "subtotal-neg"
        | "total"
        | "net"
        | "spacer"
        | "header";
      note?: string;
    }[] = [
      // Company header
      { raw: ["Neverbe", null, null, null], type: "title" },
      { raw: ["Profit & Loss Statement", null, null, null], type: "title" },
      { raw: [`Period: ${from}  –  ${to}`, null, null, null], type: "header" },
      { raw: spacer(), type: "spacer" },
      // Column headers
      {
        raw: ["Description", "Amount (LKR)", "% of Revenue", null],
        type: "header",
      },

      // REVENUE
      { raw: sectionRow("REVENUE"), type: "section" },
      { raw: dataRow("Gross Sales", report.revenue.grossSales), type: "data" },
      {
        raw: dataRow("Less: Discounts", -report.revenue.discounts),
        type: "data",
      },
      { raw: dataRow("Net Sales", report.revenue.netSales), type: "data" },
      {
        raw: dataRow("Shipping Income", report.revenue.shippingIncome),
        type: "data",
        note: "Collected from customers",
      },
      ...(report.revenue.otherIncome > 0
        ? [
            {
              raw: dataRow("Other Income", report.revenue.otherIncome),
              type: "data" as const,
            },
          ]
        : []),
      {
        raw: totalRow("Total Revenue", report.revenue.totalRevenue),
        type: "subtotal",
      },
      { raw: spacer(), type: "spacer" },

      // COGS
      { raw: sectionRow("COST OF GOODS SOLD"), type: "section" },
      {
        raw: dataRow("Product Cost", report.costOfGoodsSold.productCost),
        type: "data",
      },
      ...(report.costOfGoodsSold.shippingCost > 0
        ? [
            {
              raw: dataRow(
                "Shipping Cost",
                report.costOfGoodsSold.shippingCost,
              ),
              type: "data" as const,
            },
          ]
        : []),
      {
        raw: totalRow("Total COGS", report.costOfGoodsSold.totalCOGS),
        type: "subtotal-neg",
      },
      { raw: spacer(), type: "spacer" },

      // GROSS PROFIT
      {
        raw: [
          `Gross Profit  |  Margin: ${report.grossProfitMargin.toFixed(1)}%`,
          report.grossProfit,
          report.grossProfitMargin / 100,
          null,
        ],
        type: "total",
      },
      { raw: spacer(), type: "spacer" },

      // OPEX
      { raw: sectionRow("OPERATING EXPENSES"), type: "section" },
      ...report.operatingExpenses.byCategory.map((e) => ({
        raw: dataRow(
          e.category,
          e.amount,
          report.operatingExpenses.totalExpenses > 0
            ? (e.amount / report.operatingExpenses.totalExpenses) * 100
            : null,
        ),
        type: "data" as const,
      })),
      {
        raw: totalRow(
          "Total Operating Expenses",
          report.operatingExpenses.totalExpenses,
        ),
        type: "subtotal-neg",
      },
      { raw: spacer(), type: "spacer" },

      // OPERATING INCOME
      {
        raw: totalRow("Operating Income (EBIT)", report.operatingIncome),
        type: "total",
      },
      { raw: spacer(), type: "spacer" },

      // OTHER EXPENSES
      { raw: sectionRow("NON-OPERATING EXPENSES"), type: "section" },
      {
        raw: dataRow("Transaction Fees", report.otherExpenses.transactionFees),
        type: "data",
      },
      ...(report.otherExpenses.otherFees > 0
        ? [
            {
              raw: dataRow("Other Fees", report.otherExpenses.otherFees),
              type: "data" as const,
            },
          ]
        : []),
      {
        raw: totalRow(
          "Total Non-Operating Expenses",
          report.otherExpenses.totalOther,
        ),
        type: "subtotal-neg",
      },
      { raw: spacer(), type: "spacer" },

      // NET PROFIT
      {
        raw: [
          `Net Profit / (Loss)  |  Margin: ${report.netProfitMargin.toFixed(1)}%`,
          report.netProfit,
          report.netProfitMargin / 100,
          null,
        ],
        type: "net",
      },
      { raw: spacer(), type: "spacer" },
      {
        raw: [
          "All amounts in Sri Lankan Rupees (LKR). Figures may be subject to audit adjustments.",
          null,
          null,
          null,
        ],
        type: "header",
      },
    ];

    /* ── build worksheet ─────────────────────────────────── */
    const colLetters = ["A", "B", "C", "D"];
    const ws: Record<string, unknown> = {};
    let r = 1;

    for (const { raw, type, note } of rows) {
      raw.forEach((val, ci) => {
        const addr = `${colLetters[ci]}${r}`;
        const isAmt = ci === 1 && typeof val === "number";
        const isPct = ci === 2 && typeof val === "number";
        const isNeg = isAmt && val < 0;

        switch (type) {
          case "title":
            ws[addr] = cell(val, {
              bold: true,
              color: DARK,
              bg: WHITE,
              align: ci === 0 ? "left" : "right",
              fmt: ci === 0 ? "@" : undefined,
            });
            break;
          case "header":
            ws[addr] = cell(val, {
              bold: true,
              color: "FF6B7280",
              bg: WHITE,
              align: ci === 0 ? "left" : "right",
              italic: ci !== 0,
              fmt: isPct ? "0.0%" : undefined,
            });
            break;
          case "section":
            ws[addr] = cell(val, {
              bold: true,
              color: DARK,
              bg: LGRAY,
              align: "left",
              border: true,
            });
            break;
          case "data": {
            const displayVal = ci === 0 && note ? `${val} (${note})` : val;
            ws[addr] = cell(displayVal, {
              indent: ci === 0 ? 1 : 0,
              align: isAmt || isPct ? "right" : "left",
              color: isNeg ? RED : ci === 0 ? "FF374151" : "FF111827",
              fmt: isPct ? "0.0%" : isAmt ? "#,##0.00" : "@",
            });
            break;
          }
          case "subtotal":
            ws[addr] = cell(val, {
              bold: true,
              color: DARK,
              bg: MGRAY,
              align: isAmt || isPct ? "right" : "left",
              border: true,
              fmt: isPct ? "0.0%" : isAmt ? "#,##0.00" : "@",
            });
            break;
          case "subtotal-neg":
            ws[addr] = cell(val, {
              bold: true,
              color: isAmt ? RED : DARK,
              bg: "FFFFF5F5",
              align: isAmt || isPct ? "right" : "left",
              border: true,
              fmt: isPct ? "0.0%" : isAmt ? "#,##0.00" : "@",
            });
            break;
          case "total":
            ws[addr] = cell(val, {
              bold: true,
              color: isAmt ? ((val as number) >= 0 ? GREEN : RED) : DARK,
              bg: "FFD1FAE5",
              align: isAmt || isPct ? "right" : "left",
              border: true,
              fmt: isPct ? "0.0%" : isAmt ? "#,##0.00" : "@",
            });
            break;
          case "net":
            ws[addr] = cell(val, {
              bold: true,
              color: WHITE,
              bg:
                (typeof val === "number" && val >= 0) || ci !== 1
                  ? ACCENT
                  : RED,
              align: isAmt || isPct ? "right" : "left",
              border: true,
              fmt: isPct ? "0.0%" : isAmt ? "#,##0.00" : "@",
            });
            break;
          case "spacer":
            ws[addr] = cell(null, { bg: WHITE });
            break;
        }
      });
      r++;
    }

    /* ── sheet metadata ──────────────────────────────────── */
    ws["!ref"] = `A1:D${r - 1}`;
    ws["!cols"] = [
      { wch: 46 }, // A – description
      { wch: 18 }, // B – amount
      { wch: 14 }, // C – % of rev
      { wch: 4 }, // D – padding
    ];
    ws["!rows"] = rows.map(() => ({ hpt: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, "P&L Statement");
    XLSX.writeFile(wb, `pnl_statement_${from}_${to}.xlsx`, {
      cellStyles: true,
    });
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report) {
      toast("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      const r = report;
      await exportReportPDF({
        title: "Profit & Loss Statement",
        subtitle: "Statement of Operations",
        period: `${from} – ${to}`,
        summaryItems: [
          {
            label: "Total Revenue",
            value: `LKR ${fmt(r.revenue.totalRevenue)}`,
          },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(r.grossProfit)}`,
            sub: `${r.grossProfitMargin.toFixed(1)}% margin`,
          },
          { label: "Operating Income", value: `LKR ${fmt(r.operatingIncome)}` },
          {
            label: "Net Profit / (Loss)",
            value: `LKR ${fmt(r.netProfit)}`,
            sub: `${r.netProfitMargin.toFixed(1)}% margin`,
          },
        ],
        tables: [
          {
            title: "Revenue",
            columns: ["Line Item", "LKR"],
            boldCols: [0],
            greenCols: [1],
            rows: [
              ["Gross Sales", fmt(r.revenue.grossSales)],
              ["Less: Discounts", `(${fmt(r.revenue.discounts)})`],
              ["Net Sales", fmt(r.revenue.netSales)],
              [
                "Shipping Income",
                `${fmt(r.revenue.shippingIncome)} (Collected)`,
              ],
              ...(r.revenue.otherIncome > 0
                ? ([["Other Income", fmt(r.revenue.otherIncome)]] as [
                    string,
                    string,
                  ][])
                : []),
              ["TOTAL REVENUE", fmt(r.revenue.totalRevenue)],
            ],
          },
          {
            title: "Cost of Goods Sold",
            columns: ["Line Item", "LKR"],
            boldCols: [0],
            redCols: [1],
            rows: [
              ["Product Cost", fmt(r.costOfGoodsSold.productCost)],
              ...(r.costOfGoodsSold.shippingCost > 0
                ? ([
                    [
                      "Shipping Cost",
                      `${fmt(r.costOfGoodsSold.shippingCost)} (Pass-through)`,
                    ],
                  ] as [string, string][])
                : []),
              ["TOTAL COGS", `(${fmt(r.costOfGoodsSold.totalCOGS)})`],
              [
                "GROSS PROFIT",
                `${r.grossProfitMargin.toFixed(1)}% · LKR ${fmt(r.grossProfit)}`,
              ],
            ],
          },
          {
            title: "Operating Expenses",
            columns: ["Category", "LKR", "% of OPEX"],
            boldCols: [0],
            redCols: [1],
            rows: [
              ...r.operatingExpenses.byCategory.map((e) => [
                e.category,
                fmt(e.amount),
                r.operatingExpenses.totalExpenses > 0
                  ? `${((e.amount / r.operatingExpenses.totalExpenses) * 100).toFixed(1)}%`
                  : "—",
              ]),
              ["TOTAL OPEX", `(${fmt(r.operatingExpenses.totalExpenses)})`, ""],
              ["OPERATING INCOME", fmt(r.operatingIncome), ""],
            ],
          },
          {
            title: "Non-Operating Expenses & Net Profit",
            columns: ["Line Item", "LKR"],
            boldCols: [0],
            rows: [
              ["Transaction Fees", `(${fmt(r.otherExpenses.transactionFees)})`],
              ...(r.otherExpenses.otherFees > 0
                ? ([["Other Fees", `(${fmt(r.otherExpenses.otherFees)})`]] as [
                    string,
                    string,
                  ][])
                : []),
              [
                "Total Non-Operating Exp.",
                `(${fmt(r.otherExpenses.totalOther)})`,
              ],
              [
                "NET PROFIT / (LOSS)",
                `${r.netProfitMargin.toFixed(1)}% · LKR ${fmt(r.netProfit)}`,
              ],
            ],
          },
        ],
        filename: `pnl_statement_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  /* ── helper components ─────────────────────────────────────── */

  const SectionHeader = ({ label }: { label: string }) => (
    <tr>
      <td colSpan={3} className="pt-5 pb-1 px-5">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
          {label}
        </span>
      </td>
    </tr>
  );

  const LineRow = ({
    label,
    value,
    note,
    indent = false,
    bold = false,
    negative = false,
    positive = false,
    dimmed = false,
    subtotal = false,
    highlight = false,
  }: {
    label: string;
    value?: number;
    note?: string;
    indent?: boolean;
    bold?: boolean;
    negative?: boolean;
    positive?: boolean;
    dimmed?: boolean;
    subtotal?: boolean;
    highlight?: boolean;
  }) => {
    const color =
      value === undefined
        ? ""
        : negative
          ? "text-red-600"
          : positive
            ? "text-emerald-600"
            : "text-gray-900";

    const sign = negative ? "(" : positive ? "+" : "";
    const signClose = negative ? ")" : "";

    return (
      <tr
        className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${subtotal ? "bg-gray-50" : ""} ${highlight ? "bg-emerald-50/50" : ""}`}
      >
        <td
          className={`py-2.5 px-5 text-sm ${indent ? "pl-10" : ""} ${bold ? "font-semibold" : "text-gray-600"} ${dimmed ? "text-gray-400" : ""}`}
        >
          <div className="flex flex-col leading-tight">
            <span>{label}</span>
            {note && (
              <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                {note}
              </span>
            )}
          </div>
        </td>
        <td className="py-2.5 px-5 text-right w-1/3">
          {value !== undefined && (
            <span
              className={`text-sm font-mono ${bold ? "font-bold" : ""} ${color}`}
            >
              {sign}Rs {fmt(Math.abs(value))}
              {signClose}
            </span>
          )}
        </td>
        <td className="py-2.5 pl-3 pr-5 w-20">
          {/* sparkline / badge column — used for margin rows */}
        </td>
      </tr>
    );
  };

  const TotalRow = ({
    label,
    value,
    margin,
    accent = false,
    dark = false,
    red = false,
  }: {
    label: string;
    value: number;
    margin?: number;
    accent?: boolean;
    dark?: boolean;
    red?: boolean;
  }) => {
    const positive = value >= 0;
    const bg = dark
      ? "bg-gray-900 text-white"
      : accent
        ? positive
          ? "bg-emerald-700 text-white"
          : "bg-red-700 text-white"
        : red
          ? "bg-red-50"
          : "bg-gray-100";

    return (
      <tr className={bg}>
        <td
          className={`py-3.5 px-5 text-sm font-bold ${dark || accent ? "text-white" : red ? "text-red-700" : "text-gray-900"}`}
        >
          <div className="flex items-center gap-2">
            {label}
            {margin !== undefined && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dark || accent ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
              >
                {margin.toFixed(1)}%
              </span>
            )}
          </div>
        </td>
        <td
          className={`py-3.5 px-5 text-right font-mono font-bold text-sm ${dark || accent ? "text-white" : red ? "text-red-700" : "text-gray-900"}`}
        >
          {!positive && "("}Rs {fmt(Math.abs(value))}
          {!positive && ")"}
        </td>
        <td className="py-2 pl-3 pr-5 w-20">
          {margin !== undefined && (
            <div className="flex items-center gap-1">
              {positive ? (
                <IconTrendingUp
                  size={14}
                  className={
                    dark || accent ? "text-white/70" : "text-emerald-600"
                  }
                />
              ) : (
                <IconTrendingDown
                  size={14}
                  className={dark || accent ? "text-white/70" : "text-red-500"}
                />
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  /* ── KPI scorecard ─────────────────────────────────────────── */
  const kpiCards = report
    ? [
        {
          label: "Total Revenue",
          value: report.revenue.totalRevenue,
          icon: <IconTrendingUp size={20} />,
          color: "text-blue-600",
          bg: "bg-blue-50",
          margin: null,
        },
        {
          label: "Gross Profit",
          value: report.grossProfit,
          icon:
            report.grossProfit >= 0 ? (
              <IconTrendingUp size={20} />
            ) : (
              <IconTrendingDown size={20} />
            ),
          color: report.grossProfit >= 0 ? "text-emerald-700" : "text-red-600",
          bg: report.grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
          margin: report.grossProfitMargin,
        },
        {
          label: "Operating Income",
          value: report.operatingIncome,
          icon:
            report.operatingIncome >= 0 ? (
              <IconTrendingUp size={20} />
            ) : (
              <IconTrendingDown size={20} />
            ),
          color:
            report.operatingIncome >= 0 ? "text-emerald-700" : "text-red-600",
          bg: report.operatingIncome >= 0 ? "bg-emerald-50" : "bg-red-50",
          margin: null,
        },
        {
          label: "Net Profit",
          value: report.netProfit,
          icon:
            report.netProfit >= 0 ? (
              <IconTrendingUp size={20} />
            ) : (
              <IconTrendingDown size={20} />
            ),
          color: report.netProfit >= 0 ? "text-emerald-700" : "text-red-600",
          bg: report.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
          margin: report.netProfitMargin,
        },
      ]
    : [];

  return (
    <PageContainer title="Profit & Loss Statement">
      <div className="w-full space-y-6">
        {/* ── Header & Controls ─────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Financial Statements
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Profit &amp; Loss
            </h2>
            {report && (
              <p className="text-xs text-gray-400 mt-1.5 font-mono">
                {report.period.from} &nbsp;–&nbsp; {report.period.to}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Space>
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<IconFilter size={15} />}
                    >
                      Filter
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Space>
              <Button
                onClick={handleExportExcel}
                disabled={!report}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!report}
                icon={<IconFileTypePdf size={16} />}
                danger
              >
                PDF
              </Button>
            </Space>
          </div>
        </div>

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── KPI Scorecards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}
                  >
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {card.label}
                  </p>
                  <p
                    className={`text-xl font-black tracking-tight ${card.color} leading-none`}
                  >
                    Rs {fmt(Math.abs(card.value))}
                  </p>
                  {card.margin !== null && card.margin !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400">
                          Margin
                        </span>
                        <span
                          className={`text-[10px] font-black ${card.color}`}
                        >
                          {card.margin.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(Math.abs(card.margin), 100)}
                        showInfo={false}
                        strokeColor={card.value >= 0 ? "#059669" : "#dc2626"}
                        trailColor="#f3f4f6"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Expense Category Breakdown ─────────────────────── */}
            {report.operatingExpenses.byCategory.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Operating Expense Breakdown
                </h4>
                <div className="space-y-2">
                  {report.operatingExpenses.byCategory.map((cat) => {
                    const pct =
                      report.operatingExpenses.totalExpenses > 0
                        ? (cat.amount /
                            report.operatingExpenses.totalExpenses) *
                          100
                        : 0;
                    return (
                      <div
                        key={cat.category}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-gray-600 font-medium w-36 truncate flex-shrink-0">
                          {cat.category}
                        </span>
                        <div className="flex-1">
                          <Progress
                            percent={pct}
                            showInfo={false}
                            strokeColor="#111827"
                            trailColor="#f9fafb"
                            size="small"
                            strokeLinecap="square"
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-900 w-28 text-right flex-shrink-0">
                          Rs {fmt(cat.amount)}
                        </span>
                        <span className="text-[10px] text-gray-400 w-10 text-right flex-shrink-0">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Main Statement Table ───────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* statement header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Statement of Operations
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {report.period.from} &nbsp;–&nbsp; {report.period.to}
                  </p>
                </div>
                <Tag
                  color="default"
                  className="text-[10px] font-bold uppercase"
                >
                  LKR
                </Tag>
              </div>

              {/* column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 py-2 border-b border-gray-100 bg-gray-50">
                <span>Description</span>
                <span className="w-48 text-right">Amount</span>
                <span className="w-20" />
              </div>

              <table className="w-full border-collapse">
                <tbody>
                  {/* ═══ REVENUE ═══ */}
                  <SectionHeader label="Revenue" />
                  <LineRow
                    label="Gross Sales"
                    value={report.revenue.grossSales}
                    indent
                    positive
                  />
                  <LineRow
                    label="Less: Discounts"
                    value={report.revenue.discounts}
                    indent
                    negative
                    note="Returns & allowances"
                  />
                  <LineRow
                    label="Net Sales"
                    value={report.revenue.netSales}
                    indent
                    bold
                  />
                  <LineRow
                    label="Shipping Income"
                    value={report.revenue.shippingIncome}
                    indent
                    note="Collected from customers"
                  />
                  {report.revenue.otherIncome > 0 && (
                    <LineRow
                      label="Other Income"
                      value={report.revenue.otherIncome}
                      indent
                    />
                  )}
                  <TotalRow
                    label="Total Revenue"
                    value={report.revenue.totalRevenue}
                  />

                  {/* ═══ COGS ═══ */}
                  <SectionHeader label="Cost of Goods Sold" />
                  <LineRow
                    label="Product Cost"
                    value={report.costOfGoodsSold.productCost}
                    indent
                    negative
                  />
                  {report.costOfGoodsSold.shippingCost > 0 && (
                    <LineRow
                      label="Shipping Cost"
                      value={report.costOfGoodsSold.shippingCost}
                      indent
                      negative
                      note="Paid to couriers (Pass-through)"
                    />
                  )}
                  <TotalRow
                    label="Total COGS"
                    value={-report.costOfGoodsSold.totalCOGS}
                    red
                  />

                  {/* ═══ GROSS PROFIT ═══ */}
                  <tr>
                    <td colSpan={3} className="h-1" />
                  </tr>
                  <TotalRow
                    label="Gross Profit"
                    value={report.grossProfit}
                    margin={report.grossProfitMargin}
                    accent
                  />
                  <tr>
                    <td colSpan={3} className="h-1" />
                  </tr>

                  {/* ═══ OPERATING EXPENSES ═══ */}
                  <SectionHeader label="Operating Expenses" />
                  {report.operatingExpenses.byCategory.map((exp) => (
                    <LineRow
                      key={exp.category}
                      label={exp.category}
                      value={exp.amount}
                      indent
                      negative
                    />
                  ))}
                  <TotalRow
                    label="Total Operating Expenses"
                    value={-report.operatingExpenses.totalExpenses}
                    red
                  />

                  {/* ═══ OPERATING INCOME ═══ */}
                  <tr>
                    <td colSpan={3} className="h-1" />
                  </tr>
                  <TotalRow
                    label="Operating Income (EBIT)"
                    value={report.operatingIncome}
                    accent={report.operatingIncome >= 0}
                    red={report.operatingIncome < 0}
                  />
                  <tr>
                    <td colSpan={3} className="h-1" />
                  </tr>

                  {/* ═══ OTHER EXPENSES ═══ */}
                  <SectionHeader label="Non-Operating Expenses" />
                  <LineRow
                    label="Transaction Fees"
                    value={report.otherExpenses.transactionFees}
                    indent
                    negative
                  />
                  {report.otherExpenses.otherFees > 0 && (
                    <LineRow
                      label="Other Fees"
                      value={report.otherExpenses.otherFees}
                      indent
                      negative
                    />
                  )}
                  <TotalRow
                    label="Total Non-Operating Expenses"
                    value={-report.otherExpenses.totalOther}
                    red
                  />

                  {/* ═══ NET PROFIT ═══ */}
                  <tr>
                    <td colSpan={3} className="h-2" />
                  </tr>
                  <TotalRow
                    label="Net Profit / (Loss)"
                    value={report.netProfit}
                    margin={report.netProfitMargin}
                    dark
                  />
                </tbody>
              </table>

              {/* statement footer note */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 font-medium">
                  All amounts in Sri Lankan Rupees (LKR). Figures may be subject
                  to audit adjustments. Parentheses indicate negative values.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────── */}
        {!loading && !report && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range and click Filter to load the report.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ProfitLossPage;
