import asyncio

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from .csv_io import SAMPLE_CSV, parse_csv
from .ledger import build_ledger, validate_lead
from .models import RawLead, ValidateResponse

app = FastAPI(title="Verified Credits API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/sample", response_class=PlainTextResponse)
def sample_csv() -> str:
    return SAMPLE_CSV


async def _validate_batch(
    leads: list[RawLead],
    require_email: bool = True,
    require_phone: bool = True,
    require_website: bool = True,
):
    loop = asyncio.get_running_loop()
    tasks = [
        loop.run_in_executor(None, validate_lead, lead, require_email, require_phone, require_website)
        for lead in leads
    ]
    return await asyncio.gather(*tasks)


@app.post("/api/validate", response_model=ValidateResponse)
async def validate_leads(
    credits_available: int = Query(10, ge=0),
    require_email: bool = Query(True),
    require_phone: bool = Query(True),
    require_website: bool = Query(True),
    file: UploadFile | None = File(default=None),
) -> ValidateResponse:
    if file is not None:
        content = await file.read()
        leads = parse_csv(content)
    else:
        leads = parse_csv(SAMPLE_CSV.encode("utf-8"))

    results = await _validate_batch(leads, require_email, require_phone, require_website)
    ledger = build_ledger(results, credits_available)

    return ValidateResponse(results=results, ledger=ledger)
