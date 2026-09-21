import csv
import io

from .models import RawLead

# SaaSquatch export column names -> our RawLead fields.
COLUMN_MAP = {
    "company": "company",
    "industry": "industry",
    "address": "address",
    "bbb": "bbb",
    "phone": "phone",
    "website": "website",
    "estimated revenue": "estimated_revenue",
    "email": "email",
}


def parse_csv(content: bytes) -> list[RawLead]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    leads: list[RawLead] = []

    for row in reader:
        normalized = {}
        for key, value in row.items():
            if key is None:
                continue
            mapped = COLUMN_MAP.get(key.strip().lower())
            if mapped:
                normalized[mapped] = (value or "").strip()

        leads.append(RawLead(**normalized))

    return leads


SAMPLE_CSV = """Company,Industry,Address,BBB,Phone,Website,Estimated Revenue,Email
Efficient AC Electric & Plumbing,HVAC,"1200 W Anderson Ln, Austin, TX",A+,(512) 452-4796,https://www.wikipedia.org,N/A,kate@gmail.com
Elite Heating & Air,HVAC,"4009 Banister Ln, Austin, TX",A,(512) 733-6900,https://www.wikipedia.org,N/A,info@gmail.com
Missing Email HVAC Co,HVAC,"Austin, TX",N/A,(512) 733-6901,https://www.wikipedia.org,N/A,N/A
Bad Syntax Cooling,HVAC,"Austin, TX",N/A,(512) 733-6902,https://www.wikipedia.org,N/A,not-an-email
Broken Domain Cooling,HVAC,"Austin, TX",N/A,512-000-0000,https://this-domain-does-not-exist-abcxyz123.com,N/A,contact@this-domain-does-not-exist-abcxyz123.com
Bad Phone HVAC Co,HVAC,"Austin, TX",B,555-12,https://www.wikipedia.org,N/A,office@gmail.com
Wrong Country Code LLC,HVAC,"Austin, TX",B,+91 12345,https://www.wikipedia.org,N/A,sales@gmail.com
Dead Link Heating,HVAC,"Austin, TX",N/A,(512) 555-0111,https://en.wikipedia.org/wiki/ThisPageDefinitelyDoesNotExist_Xyz123,N/A,hello@gmail.com
No Data Row,HVAC,"Austin, TX",N/A,N/A,N/A,N/A,N/A
"""
