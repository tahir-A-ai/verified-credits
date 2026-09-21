import type { ValidateResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchSampleCsv(): Promise<string> {
  const res = await fetch(`${API_URL}/api/sample`);
  if (!res.ok) throw new Error(`Failed to load sample CSV (${res.status})`);
  return res.text();
}

export async function validateLeads(
  file: File | null,
  creditsAvailable: number
): Promise<ValidateResponse> {
  let body: FormData | undefined;
  if (file) {
    body = new FormData();
    body.append("file", file);
  }

  const query = new URLSearchParams({
    credits_available: String(creditsAvailable),
    require_email: "true",
    require_phone: "true",
    require_website: "true",
  });

  const res = await fetch(`${API_URL}/api/validate?${query.toString()}`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    throw new Error(`Validation request failed (${res.status})`);
  }

  return res.json();
}

export function csvFileFromText(text: string, name = "sample.csv"): File {
  return new File([text], name, { type: "text/csv" });
}
