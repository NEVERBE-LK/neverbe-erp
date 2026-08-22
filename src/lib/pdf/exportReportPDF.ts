import { pdf } from "@react-pdf/renderer";
import html2canvas from "html2canvas";
import React from "react";
import { ReportPDFDocument, ReportPDFDocumentProps } from "./ReportPDFDocument";
import { getLogoUrl } from "./companyConfig";

// ─────────────────────────────────────────────────────────────
// Utility: Fetch logo as base64
// ─────────────────────────────────────────────────────────────

export async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch(getLogoUrl());
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Utility: Capture a DOM element as base64 PNG
// ─────────────────────────────────────────────────────────────

export async function captureElementAsImage(
  elementId: string,
): Promise<string | null> {
  const el = document.getElementById(elementId);
  if (!el) return null;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2, // higher resolution
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────────────────────

export interface PDFChartSpec {
  title: string;
  elementId: string; // DOM element ID to screenshot
}

export interface ExportReportPDFOptions extends Omit<
  ReportPDFDocumentProps,
  "logoBase64" | "charts"
> {
  /** Filename (without .pdf extension) */
  filename?: string;
  /** Chart containers to capture via html2canvas */
  chartSpecs?: PDFChartSpec[];
}

/**
 * Captures charts, fetches logo, renders the PDF, and triggers download.
 *
 * @example
 * await exportReportPDF({
 *   title: "Cashflow Report",
 *   period: "2025-01-01 – 2025-01-31",
 *   summaryItems: [{ label: "Net Cash Flow", value: "Rs 45,200" }],
 *   chartSpecs: [{ title: "Cash Flow Trend", elementId: "cashflow-chart-1" }],
 *   tables: [{ title: "Daily Breakdown", columns: [...], rows: [...] }],
 * });
 */
export async function exportReportPDF(
  options: ExportReportPDFOptions,
): Promise<void> {
  const { filename, chartSpecs = [], ...docProps } = options;

  // 1. Fetch logo
  const logoBase64 = await fetchLogoBase64();

  // 2. Capture charts in parallel
  const chartResults = await Promise.all(
    chartSpecs.map(async (spec) => {
      const imageBase64 = await captureElementAsImage(spec.elementId);
      return imageBase64 ? { title: spec.title, imageBase64 } : null;
    }),
  );
  const charts = chartResults.filter(Boolean) as {
    title: string;
    imageBase64: string;
  }[];

  // 3. Render PDF
  const blob = await pdf(
    React.createElement(ReportPDFDocument, {
      ...docProps,
      logoBase64,
      charts,
    }),
  ).toBlob();

  // 4. Create object URL
  const url = URL.createObjectURL(blob);
  const safeName = (filename ?? docProps.title)
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const downloadName = `${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // 5. Display Preview Dialog
  const { Modal, Button } = await import("antd");
  
  const modal = Modal.info({
    title: "PDF Report Preview",
    width: "80vw",
    icon: null,
    closable: true,
    maskClosable: true,
    content: React.createElement(
      "div",
      { className: "mt-4 w-full h-[70vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800" },
      React.createElement("iframe", {
        src: url,
        className: "w-full h-full border-none",
        title: "PDF Preview"
      })
    ),
    footer: React.createElement(
      "div",
      { className: "flex items-center justify-end gap-3 mt-6" },
      React.createElement(Button, { onClick: () => modal.destroy() }, "Close"),
      React.createElement(
        Button,
        {
          type: "primary",
          className: "bg-rose-600 hover:bg-rose-700",
          onClick: () => {
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = downloadName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          },
        },
        "Download"
      )
    ),
    afterClose: () => URL.revokeObjectURL(url),
  });
}
