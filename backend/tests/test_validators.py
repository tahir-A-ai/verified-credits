from app.validators import validate_email, validate_phone, validate_website


def test_email_empty():
    assert validate_email("N/A").status == "invalid"


def test_email_bad_syntax():
    assert validate_email("not-an-email").status == "invalid"


def test_email_valid_domain():
    result = validate_email("someone@gmail.com")
    assert result.status == "valid"


def test_phone_empty():
    assert validate_phone("").status == "invalid"


def test_phone_wrong_country_code():
    assert validate_phone("+91 12345", "US").status == "invalid"


def test_phone_valid_us_number():
    assert validate_phone("(512) 452-4796", "US").status == "valid"


def test_website_empty():
    assert validate_website("N/A").status == "invalid"


def test_website_nonexistent_domain():
    result = validate_website("https://this-domain-does-not-exist-abcxyz123.com")
    assert result.status == "invalid"


def test_policy_email_only_charges_when_phone_is_broken():
    from app.ledger import validate_lead
    from app.models import RawLead

    lead = RawLead(
        email="someone@gmail.com",
        phone="555-broken",
        website="https://this-domain-does-not-exist-abcxyz123.com",
    )

    # Under strict policy: charged is False because phone & website fail
    strict_res = validate_lead(lead, require_email=True, require_phone=True, require_website=True)
    assert strict_res.charged is False
    assert len(strict_res.reasons) == 2

    # Under email-only policy: charged is True because email is valid!
    email_only_res = validate_lead(lead, require_email=True, require_phone=False, require_website=False)
    assert email_only_res.charged is True
    assert len(email_only_res.reasons) == 0


def test_policy_phone_and_email_required():
    from app.ledger import validate_lead
    from app.models import RawLead

    # Valid email & phone, but bad website
    lead = RawLead(
        email="someone@gmail.com",
        phone="(512) 452-4796",
        website="https://this-domain-does-not-exist-abcxyz123.com",
    )

    res = validate_lead(lead, require_email=True, require_phone=True, require_website=False)
    assert res.charged is True
    assert len(res.reasons) == 0


def test_quality_scores():
    from app.ledger import validate_lead
    from app.models import RawLead

    # High quality: all 3 pass
    high_lead = RawLead(
        email="someone@gmail.com",
        phone="(512) 452-4796",
        website="https://www.google.com",
    )
    res_high = validate_lead(high_lead)
    assert res_high.quality_score == "high"
    assert res_high.verified_count == 3

    # Medium quality: 1 or 2 pass
    med_lead = RawLead(
        email="someone@gmail.com",
        phone="555-broken",
        website="https://this-domain-does-not-exist-abcxyz123.com",
    )
    res_med = validate_lead(med_lead)
    assert res_med.quality_score == "medium"
    assert res_med.verified_count == 1

    # Low quality: 0 pass
    low_lead = RawLead(
        email="N/A",
        phone="N/A",
        website="N/A",
    )
    res_low = validate_lead(low_lead)
    assert res_low.quality_score == "low"
    assert res_low.verified_count == 0


