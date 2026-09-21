import type { ValidatedLead } from "./types";
import { maskEmail, maskPhone, maskWebsite } from "./mask";

// Neutralize spreadsheet formula injection (=, +, -, @, tab, CR) per OWASP CSV guidance.
function sanitizeCell(value: string): string {
  const needsEscape = /^[=+\-@\t\r]/.test(value);
  const escaped = needsEscape ? `'${value}` : value;
  if (/[",\n]/.test(escaped)) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}

export function buildAuditCsv(results: ValidatedLead[]): string {
  const header = [
    "Company",
    "Email",
    "Phone",
    "Website",
    "Quality Tier",
    "Verified Fields",
    "Enrichment Status",
    "Charged",
    "Reasons",
  ];

  const rows = results.map((r) => [
    r.raw.company,
    r.enriched ? r.raw.email : maskEmail(r.raw.email),
    r.enriched ? r.raw.phone : maskPhone(r.raw.phone),
    r.enriched ? r.raw.website : maskWebsite(r.raw.website),
    (r.quality_score || "low").toUpperCase(),
    `${r.verified_count || 0}/3`,
    r.enriched ? "Enriched (1 Credit)" : "Preview Only (Masked)",
    r.charged ? "Charged" : "Not charged",
    r.reasons.join(" | "),
  ]);

  return [header, ...rows]
    .map((row) => row.map(sanitizeCell).join(","))
    .join("\r\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
