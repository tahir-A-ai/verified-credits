export type FieldStatus = "valid" | "invalid";
export type QualityScore = "high" | "medium" | "low";

export interface FieldCheck {
  status: FieldStatus;
  reason: string | null;
}

export interface RawLead {
  company: string;
  industry: string;
  address: string;
  bbb: string;
  phone: string;
  website: string;
  estimated_revenue: string;
  email: string;
  country_hint: string;
}

export interface ValidatedLead {
  raw: RawLead;
  email_check: FieldCheck;
  phone_check: FieldCheck;
  website_check: FieldCheck;
  charged: boolean;
  enriched?: boolean;
  quality_score: QualityScore;
  verified_count: number;
  reasons: string[];
}

export interface LedgerSummary {
  credits_available: number;
  total_leads: number;
  charged: number;
  refunded: number;
  credits_remaining: number;
  credits_saved: number;
  high_quality_count?: number;
  medium_quality_count?: number;
  low_quality_count?: number;
  enriched_count?: number;
}

export interface ValidateResponse {
  results: ValidatedLead[];
  ledger: LedgerSummary;
}

