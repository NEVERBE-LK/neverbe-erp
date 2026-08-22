import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { companyConfig } from "./companyConfig";

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  headerBand: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 36,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  companyNameText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  companyTagline: {
    color: "#94a3b8",
    fontSize: 8,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  docTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  periodText: {
    color: "#cbd5e1",
    fontSize: 8,
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
  },
  accentStripe: {
    backgroundColor: "#10b981",
    height: 3,
  },
  content: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  metaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  metaValue: {
    fontSize: 9,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiTitle: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  kpiSub: {
    fontSize: 7,
    color: "#10b981",
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    width: "100%",
    marginBottom: 14,
  },
  sectionTitleRow: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowAlt: {
    backgroundColor: "#fafafa",
  },
  rowSubtotal: {
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    fontFamily: "Helvetica-Bold",
  },
  rowTotal: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderRadius: 4,
    paddingVertical: 7,
    marginTop: 4,
  },
  cellLabel: {
    fontSize: 8.5,
    color: "#334155",
  },
  cellLabelIndent: {
    fontSize: 8.5,
    color: "#475569",
    paddingLeft: 12,
  },
  cellLabelBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  cellLabelTotal: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  cellValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  cellValueTotal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#10b981",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
});

export interface CashFlowPDFDocumentProps {
  logoBase64: string | null;
  periodLabel: string;
  generatedAt: string;
  report: {
    summary: {
      totalOrders: number;
      totalCashIn: number;
      totalTransactionFees: number;
      totalExpenses: number;
      totalNetCashFlow: number;
      byMethod: { method: string; total: number; fee: number; orders: number }[];
    };
    daily: {
      date: string;
      orders: number;
      cashIn: number;
      transactionFees: number;
      expenses: number;
      netCashFlow: number;
    }[];
  };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export const CashFlowPDFDocument: React.FC<CashFlowPDFDocumentProps> = ({
  logoBase64,
  periodLabel,
  generatedAt,
  report,
}) => {
  const { summary } = report;
  const net = summary.totalNetCashFlow;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.headerBand}>
          <View style={S.headerLeft}>
            {logoBase64 && <Image src={logoBase64} style={S.logo} />}
            <View>
              <Text style={S.companyNameText}>{companyConfig.name}</Text>
              <Text style={S.companyTagline}>{companyConfig.tagline}</Text>
            </View>
          </View>
          <View style={S.headerRight}>
            <Text style={S.docTitle}>Statement of Cash Flows</Text>
            <Text style={S.periodText}>{periodLabel}</Text>
          </View>
        </View>
        <View style={S.accentStripe} />

        <View style={S.content}>
          {/* Metadata bar */}
          <View style={S.metaBar}>
            <Text style={S.metaLabel}>Statement Period: <Text style={S.metaValue}>{periodLabel}</Text></Text>
            <Text style={S.metaLabel}>Generated On: <Text style={S.metaValue}>{generatedAt}</Text></Text>
          </View>

          {/* KPI Summary Cards */}
          <View style={S.kpiRow}>
            <View style={S.kpiCard}>
              <Text style={S.kpiTitle}>Total Orders</Text>
              <Text style={S.kpiValue}>{summary.totalOrders}</Text>
            </View>
            <View style={S.kpiCard}>
              <Text style={S.kpiTitle}>Cash Inflows</Text>
              <Text style={S.kpiValue}>LKR {fmt(summary.totalCashIn)}</Text>
            </View>
            <View style={S.kpiCard}>
              <Text style={S.kpiTitle}>Cash Outflows</Text>
              <Text style={S.kpiValue}>LKR {fmt(summary.totalExpenses + summary.totalTransactionFees)}</Text>
            </View>
            <View style={[S.kpiCard, { backgroundColor: net >= 0 ? "#f0fdf4" : "#fef2f2", borderColor: net >= 0 ? "#bbf7d0" : "#fecaca" }]}>
              <Text style={S.kpiTitle}>Net Cash Flow</Text>
              <Text style={[S.kpiValue, { color: net >= 0 ? "#15803d" : "#b91c1c" }]}>
                {net < 0 && "("}LKR {fmt(Math.abs(net))}{net < 0 && ")"}
              </Text>
            </View>
          </View>

          {/* Statement Tables */}

          {/* 1. Operating Cash Inflows */}
          <View style={S.table}>
            <View style={S.sectionTitleRow}>
              <Text style={S.sectionTitleText}>1. Operating Cash Inflows</Text>
            </View>
            <View style={S.row}>
              <Text style={S.cellLabelIndent}>Cash Received from Customers</Text>
              <Text style={S.cellValue}>LKR {fmt(summary.totalCashIn)}</Text>
            </View>
            <View style={[S.row, S.rowSubtotal]}>
              <Text style={S.cellLabelBold}>Total Cash Inflows</Text>
              <Text style={S.cellValue}>LKR {fmt(summary.totalCashIn)}</Text>
            </View>
          </View>

          {/* 2. Operating Cash Outflows */}
          <View style={S.table}>
            <View style={S.sectionTitleRow}>
              <Text style={S.sectionTitleText}>2. Operating Cash Outflows</Text>
            </View>
            <View style={S.row}>
              <Text style={S.cellLabelIndent}>Operating Expenses</Text>
              <Text style={S.cellValue}>LKR {fmt(summary.totalExpenses)}</Text>
            </View>
            <View style={[S.row, S.rowAlt]}>
              <Text style={S.cellLabelIndent}>Transaction Fees</Text>
              <Text style={S.cellValue}>LKR {fmt(summary.totalTransactionFees)}</Text>
            </View>
            <View style={[S.row, S.rowSubtotal]}>
              <Text style={S.cellLabelBold}>Total Cash Outflows</Text>
              <Text style={S.cellValue}>LKR {fmt(summary.totalExpenses + summary.totalTransactionFees)}</Text>
            </View>
          </View>

          {/* Payment Method Breakdown */}
          {summary.byMethod && summary.byMethod.length > 0 && (
            <View style={S.table}>
              <View style={S.sectionTitleRow}>
                <Text style={S.sectionTitleText}>Payment Method Breakdown</Text>
              </View>
              {summary.byMethod.map((method, idx) => (
                <View key={method.method} style={[S.row, idx % 2 === 1 ? S.rowAlt : {}]}>
                  <Text style={S.cellLabelIndent}>{method.method}</Text>
                  <Text style={S.cellValue}>LKR {fmt(method.total)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Net Cash Flow Final Section */}
          <View style={S.table}>
            <View style={[S.row, S.rowTotal]}>
              <Text style={S.cellLabelTotal}>NET CASH FLOW</Text>
              <Text style={[S.cellValueTotal, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
                {net < 0 && "("}LKR {fmt(Math.abs(net))}{net < 0 && ")"}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>NEVERBE ERP Financial Systems — Confidential Statement</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
