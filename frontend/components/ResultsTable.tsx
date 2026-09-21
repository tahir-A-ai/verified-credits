"use client";

import { useMemo, useState } from "react";
import type { ValidatedLead } from "@/lib/types";
import { buildAuditCsv, downloadCsv } from "@/lib/export";
import { maskEmail, maskPhone, maskWebsite } from "@/lib/mask";
import { QualityBadge } from "./QualityBadge";
import { FieldChip } from "./FieldChip";

type StatusFilter = "all" | "high" | "medium" | "low" | "enriched";
type IssueFilter = "all" | "email" | "phone" | "website";
type SortOption = "default" | "company-asc" | "company-desc" | "high-first" | "enriched-first";

interface ResultsTableProps {
  results: ValidatedLead[];
  creditsRemaining?: number;
  onEnrichLead?: (index: number) => void;
  onEnrichBatch?: (indices: number[]) => void;
}

export function ResultsTable({
  results,
  creditsRemaining = 0,
  onEnrichLead,
  onEnrichBatch,
}: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Keep track of original indices for stable row enrichment
  const itemsWithIndex = useMemo(() => {
    return results.map((item, idx) => ({ ...item, _originalIndex: idx }));
  }, [results]);

  // Aggregate metrics for filter tabs
  const counts = useMemo(() => {
    return {
      all: results.length,
      high: results.filter((r) => r.quality_score === "high").length,
      medium: results.filter((r) => r.quality_score === "medium").length,
      low: results.filter((r) => r.quality_score === "low").length,
      enriched: results.filter((r) => r.enriched).length,
      emailIssues: results.filter((r) => r.email_check.status === "invalid").length,
      phoneIssues: results.filter((r) => r.phone_check.status === "invalid").length,
      websiteIssues: results.filter((r) => r.website_check.status === "invalid").length,
    };
  }, [results]);

  // Unenriched high quality leads ready for 1-click batch enrichment
  const unenrichedHighIndices = useMemo(() => {
    return itemsWithIndex
      .filter((r) => r.quality_score === "high" && !r.enriched)
      .map((r) => r._originalIndex);
  }, [itemsWithIndex]);

  // Main filter & sort pipeline
  const filteredResults = useMemo(() => {
    let list = itemsWithIndex;

    // 1. Filter by Quality Tier or Enriched
    if (statusFilter === "high") {
      list = list.filter((r) => r.quality_score === "high");
    } else if (statusFilter === "medium") {
      list = list.filter((r) => r.quality_score === "medium");
    } else if (statusFilter === "low") {
      list = list.filter((r) => r.quality_score === "low");
    } else if (statusFilter === "enriched") {
      list = list.filter((r) => r.enriched);
    }

    // 2. Filter by Specific Field Issue
    if (issueFilter === "email") {
      list = list.filter((r) => r.email_check.status === "invalid");
    } else if (issueFilter === "phone") {
      list = list.filter((r) => r.phone_check.status === "invalid");
    } else if (issueFilter === "website") {
      list = list.filter((r) => r.website_check.status === "invalid");
    }

    // 3. Search query across company, contact details, address & failure reasons
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const company = r.raw.company?.toLowerCase() || "";
        const email = r.raw.email?.toLowerCase() || "";
        const phone = r.raw.phone?.toLowerCase() || "";
        const website = r.raw.website?.toLowerCase() || "";
        const industry = r.raw.industry?.toLowerCase() || "";
        const address = r.raw.address?.toLowerCase() || "";
        const reasons = r.reasons.join(" ").toLowerCase();

        return (
          company.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          website.includes(q) ||
          industry.includes(q) ||
          address.includes(q) ||
          reasons.includes(q)
        );
      });
    }

    // 4. Sorting
    if (sortBy === "company-asc") {
      return [...list].sort((a, b) =>
        (a.raw.company || "").localeCompare(b.raw.company || "")
      );
    }
    if (sortBy === "company-desc") {
      return [...list].sort((a, b) =>
        (b.raw.company || "").localeCompare(a.raw.company || "")
      );
    }
    if (sortBy === "high-first") {
      const order = { high: 3, medium: 2, low: 1 };
      return [...list].sort(
        (a, b) => (order[b.quality_score] || 0) - (order[a.quality_score] || 0)
      );
    }
    if (sortBy === "enriched-first") {
      return [...list].sort((a, b) => (b.enriched ? 1 : 0) - (a.enriched ? 1 : 0));
    }

    return list;
  }, [itemsWithIndex, statusFilter, issueFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    issueFilter !== "all" ||
    sortBy !== "default";

  function resetAllFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setIssueFilter("all");
    setSortBy("default");
  }

  function handleExport() {
    const filename =
      filteredResults.length === results.length
        ? "verified-credits-audit.csv"
        : `verified-credits-audit-filtered-${filteredResults.length}.csv`;
    downloadCsv(buildAuditCsv(filteredResults), filename);
  }

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Top Bar: Search, Sort & Batch Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, email, phone, domain, reason..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-200 focus:border-transparent transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort & Export Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-200 shadow-xs cursor-pointer"
            aria-label="Sort leads by"
          >
            <option value="default">Sort: Default</option>
            <option value="high-first">Sort: High Quality first</option>
            <option value="enriched-first">Sort: Enriched first</option>
            <option value="company-asc">Sort: Company (A → Z)</option>
            <option value="company-desc">Sort: Company (Z → A)</option>
          </select>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
            title="Export current view to CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export ({filteredResults.length})</span>
          </button>
        </div>
      </div>

      {/* Batch Action Banner (If High Quality unenriched leads exist) */}
      {unenrichedHighIndices.length > 0 && (
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
              <strong>{unenrichedHighIndices.length} High-Quality leads</strong> have 100% verified email, phone &amp; website.
            </span>
          </div>

          <button
            type="button"
            disabled={creditsRemaining < unenrichedHighIndices.length}
            onClick={() => onEnrichBatch?.(unenrichedHighIndices)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡ Enrich All High Quality</span>
            <span className="opacity-90 font-normal">({unenrichedHighIndices.length} credits)</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Issue Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Quality & Enriched Filter Tabs */}
        <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            All <span className="ml-1 opacity-70 font-normal">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("high")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "high"
                ? "bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            High ({counts.high})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("medium")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "medium"
                ? "bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Medium ({counts.medium})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("low")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "low"
                ? "bg-white dark:bg-neutral-900 text-rose-700 dark:text-rose-400 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Low ({counts.low})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("enriched")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "enriched"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span>✓ Enriched</span>
            <span className="opacity-70 font-normal">({counts.enriched})</span>
          </button>
        </div>

        {/* Specific Field Failure Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-400 dark:text-neutral-500 text-[11px] uppercase tracking-wider mr-1 hidden sm:inline">
            Issues:
          </span>

          <button
            type="button"
            onClick={() => setIssueFilter(issueFilter === "email" ? "all" : "email")}
            className={`px-2.5 py-1 rounded-md border text-xs transition-all flex items-center gap-1 ${
              issueFilter === "email"
                ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 font-semibold shadow-xs"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            <span>Email</span>
            <span className="text-[10px] px-1 rounded bg-neutral-200/60 dark:bg-neutral-800">
              {counts.emailIssues}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIssueFilter(issueFilter === "phone" ? "all" : "phone")}
            className={`px-2.5 py-1 rounded-md border text-xs transition-all flex items-center gap-1 ${
              issueFilter === "phone"
                ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 font-semibold shadow-xs"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            <span>Phone</span>
            <span className="text-[10px] px-1 rounded bg-neutral-200/60 dark:bg-neutral-800">
              {counts.phoneIssues}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIssueFilter(issueFilter === "website" ? "all" : "website")}
            className={`px-2.5 py-1 rounded-md border text-xs transition-all flex items-center gap-1 ${
              issueFilter === "website"
                ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 font-semibold shadow-xs"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            <span>Website</span>
            <span className="text-[10px] px-1 rounded bg-neutral-200/60 dark:bg-neutral-800">
              {counts.websiteIssues}
            </span>
          </button>
        </div>
      </div>

      {/* Active Filter Bar / Lead Count Indicator */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span>
          Showing <strong className="text-neutral-800 dark:text-neutral-200">{filteredResults.length}</strong> of{" "}
          <strong>{results.length}</strong> leads
          {hasActiveFilters && " (filtered)"}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Reset filters</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Data Container or Empty State */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
        {filteredResults.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No matching leads found
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
              {searchQuery
                ? `No leads matched "${searchQuery}" with the current filters applied.`
                : "No leads match the selected filter criteria."}
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          /* Lead Cards List */
          <div className="grid grid-cols-1 divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredResults.map((lead) => (
              <div
                key={`${lead.raw.company}-${lead.raw.email}-${lead._originalIndex}`}
                className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span>{lead.raw.company || "(no company name)"}</span>
                      {lead.raw.bbb && lead.raw.bbb !== "N/A" && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          BBB {lead.raw.bbb}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {lead.raw.industry || "General"} {lead.raw.address ? `· ${lead.raw.address}` : ""}
                      {lead.raw.estimated_revenue && lead.raw.estimated_revenue !== "N/A" && (
                        <span> · Est: {lead.raw.estimated_revenue}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Quality Indicator + Enrich Action Button */}
                  <div className="flex items-center gap-2.5">
                    <QualityBadge
                      quality={lead.quality_score}
                      verifiedCount={lead.verified_count}
                    />

                    {lead.enriched ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <span>✓ Enriched</span>
                        <span className="text-[10px] opacity-80">(1 credit)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={creditsRemaining <= 0}
                        onClick={() => onEnrichLead?.(lead._originalIndex)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                        title={creditsRemaining <= 0 ? "Not enough wallet credits" : "Charge 1 credit to enrich"}
                      >
                        <span>Enrich</span>
                        <span className="text-[10px] font-normal opacity-80">(1 credit)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Field Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <FieldChip
                    label="Email"
                    value={lead.raw.email || "N/A"}
                    maskedValue={maskEmail(lead.raw.email)}
                    check={lead.email_check}
                    required={true}
                    isLocked={!lead.enriched}
                  />
                  <FieldChip
                    label="Phone"
                    value={lead.raw.phone || "N/A"}
                    maskedValue={maskPhone(lead.raw.phone)}
                    check={lead.phone_check}
                    required={true}
                    isLocked={!lead.enriched}
                  />
                  <FieldChip
                    label="Website"
                    value={lead.raw.website || "N/A"}
                    maskedValue={maskWebsite(lead.raw.website)}
                    check={lead.website_check}
                    required={true}
                    isLocked={!lead.enriched}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
