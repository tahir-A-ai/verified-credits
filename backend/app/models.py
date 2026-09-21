from typing import Literal, Optional

from pydantic import BaseModel

FieldStatus = Literal["valid", "invalid"]
QualityScore = Literal["high", "medium", "low"]


class FieldCheck(BaseModel):
    status: FieldStatus
    reason: Optional[str] = None


class RawLead(BaseModel):
    company: str = ""
    industry: str = ""
    address: str = ""
    bbb: str = ""
    phone: str = ""
    website: str = ""
    estimated_revenue: str = ""
    email: str = ""
    country_hint: str = "US"


class ValidatedLead(BaseModel):
    raw: RawLead
    email_check: FieldCheck
    phone_check: FieldCheck
    website_check: FieldCheck
    charged: bool = False
    enriched: bool = False
    quality_score: QualityScore = "low"
    verified_count: int = 0
    reasons: list[str] = []


class LedgerSummary(BaseModel):
    credits_available: int
    total_leads: int
    charged: int
    refunded: int
    credits_remaining: int
    credits_saved: int
    high_quality_count: int = 0
    medium_quality_count: int = 0
    low_quality_count: int = 0
    enriched_count: int = 0


class ValidateResponse(BaseModel):
    results: list[ValidatedLead]
    ledger: LedgerSummary
