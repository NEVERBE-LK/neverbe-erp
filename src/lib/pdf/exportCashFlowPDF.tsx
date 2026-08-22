import { pdf } from "@react-pdf/renderer";
import React from "react";
import { CashFlowPDFDocument, CashFlowPDFDocumentProps } from "./CashFlowPDFDocument";
import { fetchLogoBase64 } from "./exportReportPDF";

export async function exportCashFlowPDF(
  options: Omit<CashFlowPDFDocumentProps, "logoBase64" | "generatedAt"> & {
    filename?: string;
  }
): Promise<void> {
  const logoBase64 = await fetchLogoBase64();
  const generatedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const doc = (
    <CashFlowPDFDocument
      logoBase64={logoBase64}
      generatedAt={generatedAt}
      periodLabel={options.periodLabel}
      report={options.report}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  
  const safeName = options.filename 
    ? options.filename.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_")
    : "cash_flow_statement";
    
  const downloadName = `${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Display Preview Dialog
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
