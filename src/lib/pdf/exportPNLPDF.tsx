import { pdf } from "@react-pdf/renderer";
import React from "react";
import { PNLPDFDocument, PNLPDFDocumentProps } from "./PNLPDFDocument";
import { fetchLogoBase64 } from "./exportReportPDF";

export async function exportPNLPDF(
  options: Omit<PNLPDFDocumentProps, "logoBase64" | "generatedAt"> & {
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
    <PNLPDFDocument
      logoBase64={logoBase64}
      generatedAt={generatedAt}
      periodLabel={options.periodLabel}
      report={options.report}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${options.filename || "pnl_statement"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
