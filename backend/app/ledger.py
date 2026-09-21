from .models import LedgerSummary, RawLead, ValidatedLead
from .validators import validate_email, validate_phone, validate_website


def validate_lead(
    raw: RawLead,
    require_email: bool = True,
    require_phone: bool = True,
    require_website: bool = True,
) -> ValidatedLead:
    email_check = validate_email(raw.email)
    phone_check = validate_phone(raw.phone, raw.country_hint)
    website_check = validate_website(raw.website)

    reasons: list[str] = []
    if require_email and email_check.status == "invalid" and email_check.reason:
        reasons.append(email_check.reason)
    if require_phone and phone_check.status == "invalid" and phone_check.reason:
        reasons.append(phone_check.reason)
    if require_website and website_check.status == "invalid" and website_check.reason:
        reasons.append(website_check.reason)

    has_any_required = require_email or require_phone or require_website
    charged = has_any_required and len(reasons) == 0

    valid_checks = sum(
        1 for check in (email_check, phone_check, website_check)
        if check.status == "valid"
    )
    if valid_checks == 3:
        quality_score = "high"
    elif valid_checks >= 1:
        quality_score = "medium"
    else:
        quality_score = "low"

    return ValidatedLead(
        raw=raw,
        email_check=email_check,
        phone_check=phone_check,
        website_check=website_check,
        charged=charged,
        enriched=False,
        quality_score=quality_score,
        verified_count=valid_checks,
        reasons=reasons,
    )


def build_ledger(results: list[ValidatedLead], credits_available: int) -> LedgerSummary:
    charged = sum(1 for r in results if r.charged)
    enriched_count = sum(1 for r in results if r.enriched)
    refunded = len(results) - charged
    credits_remaining = max(credits_available - charged, 0)

    high_count = sum(1 for r in results if r.quality_score == "high")
    medium_count = sum(1 for r in results if r.quality_score == "medium")
    low_count = sum(1 for r in results if r.quality_score == "low")

    return LedgerSummary(
        credits_available=credits_available,
        total_leads=len(results),
        charged=charged,
        refunded=refunded,
        credits_remaining=credits_remaining,
        credits_saved=refunded,
        high_quality_count=high_count,
        medium_quality_count=medium_count,
        low_quality_count=low_count,
        enriched_count=enriched_count,
    )
