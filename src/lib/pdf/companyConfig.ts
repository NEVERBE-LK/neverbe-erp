// ─────────────────────────────────────────────────────────────
// Company Configuration — single source of truth for PDF branding
// Update this file to change company details across ALL reports.
// ─────────────────────────────────────────────────────────────

export interface CompanyConfig {
  name: string;
  tagline: string;
  addressLine1: string;
  addressLine2?: string;
  phone: string;
  email: string;
  website: string;
  /** Primary brand color (hex) used in PDF headers and accents */
  primaryColor: string;
  /** Secondary/accent color (hex) */
  accentColor: string;
}

export const companyConfig: CompanyConfig = {
  name: "Neverbe",
  tagline: "Business Intelligence & ERP Platform",
  addressLine1: "330/4/10, New Kandy Road, Delgoda",
  addressLine2: "Gampaha, Sri Lanka",
  phone: "+94 70 520 8999",
  email: "info@neverbe.com",
  website: "www.neverbe.lk",
  primaryColor: "#111827", // gray-900
  accentColor: "#16a34a", // green-600
};

/**
 * Returns the absolute URL for the company logo.
 * The logo is expected at /public/logo.png
 */
export const getLogoUrl = (): string => `${window.location.origin}/logo.png`;
