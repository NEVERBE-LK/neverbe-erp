export interface CustomerFormData {
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  zip?: string;
}

export interface ThirdPartyRiskResult {
  isHighRisk: boolean;
  fraudScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isValid: boolean;
  isActive: boolean;
  isDisposable: boolean;
  isSpammer: boolean;
  lineType: string;
  reasons: string[];
  actionRequired: "PREPAY_DELIVERY_FEE" | "FULL_PREPAYMENT_ONLY" | "FLAG_FOR_MANUAL_REVIEW" | "NONE";
  noticeMessage: string;
}

export interface FraudEngineResult {
  finalScore: number; // 0 - 100
  isHighRisk: boolean;
  subScores: {
    phoneScore: number;
    emailScore: number;
    addressScore: number;
    nameScore: number;
    historyScore: number;
    trustBonus: number;
  };
  reasons: string[];
  matchedFields: {
    phoneMatch: boolean;
    emailMatch: boolean;
    addressMatch: boolean;
    junkAddress: boolean;
    junkName: boolean;
    invalidCarrier: boolean;
  };
}

export interface CompositeRiskResult {
  isHighRisk: boolean;
  fraudScore: number;
  ipqsScore: number;
  localScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isValid: boolean;
  isActive: boolean;
  isDisposable: boolean;
  isSpammer: boolean;
  lineType: string;
  reasons: string[];
  actionRequired: "PREPAY_DELIVERY_FEE" | "FULL_PREPAYMENT_ONLY" | "FLAG_FOR_MANUAL_REVIEW" | "NONE";
  noticeMessage: string;
  engineUsed: "THIRD_PARTY_AND_LOCAL" | "LOCAL_ONLY_FALLBACK";
}
