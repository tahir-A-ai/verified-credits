export function isFieldMissing(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim().toLowerCase();
  return (
    trimmed === "" ||
    trimmed === "n/a" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "none"
  );
}

export function maskEmail(email?: string | null): string {
  if (isFieldMissing(email)) return "N/A";
  const trimmed = (email || "").trim();
  const parts = trimmed.split("@");

  // Broken or typo email without single @
  if (parts.length !== 2) {
    if (trimmed.length <= 3) return "••••••";
    return `${trimmed.slice(0, 2)}••••••••••`;
  }

  const [user, domain] = parts;
  const safeDomain = domain.trim() || "••••••";
  if (user.length <= 2) {
    return `${user[0] || "•"}••••@${safeDomain}`;
  }
  return `${user.slice(0, 2)}••••••@${safeDomain}`;
}

export function maskPhone(phone?: string | null): string {
  if (isFieldMissing(phone)) return "N/A";
  const trimmed = (phone || "").trim();
  const digits = trimmed.replace(/\D/g, "");

  // Broken or short phone
  if (digits.length <= 4) {
    return "(•••) •••-••••";
  }

  const last2 = digits.slice(-2);
  return `(•••) •••-••${last2}`;
}

export function maskWebsite(website?: string | null): string {
  if (isFieldMissing(website)) return "N/A";
  const trimmed = (website || "").trim();

  let proto = "";
  let rest = trimmed;
  if (trimmed.startsWith("https://")) {
    proto = "https://";
    rest = trimmed.slice(8);
  } else if (trimmed.startsWith("http://")) {
    proto = "http://";
    rest = trimmed.slice(7);
  }

  let prefix = "";
  if (rest.startsWith("www.")) {
    prefix = "www.";
    rest = rest.slice(4);
  }

  const slashIdx = rest.indexOf("/");
  const domain = slashIdx !== -1 ? rest.slice(0, slashIdx) : rest;
  const path = slashIdx !== -1 ? rest.slice(slashIdx) : "";

  const dotIdx = domain.lastIndexOf(".");
  if (dotIdx > 0 && dotIdx < domain.length - 1) {
    const name = domain.slice(0, dotIdx);
    const tld = domain.slice(dotIdx);
    const maskedName =
      name.length <= 2 ? `${name[0]}••••` : `${name.slice(0, 2)}••••••`;
    return `${proto}${prefix}${maskedName}${tld}${path ? "/••••" : ""}`;
  }

  // Broken or typo URL without standard domain dot
  if (trimmed.length <= 4) return "••••••";
  return `${proto}${trimmed.slice(0, 2)}••••••••••`;
}
