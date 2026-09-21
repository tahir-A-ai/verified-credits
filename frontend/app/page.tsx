"use client";

import { useState } from "react";
import { validateLeads } from "@/lib/api";
import type { ValidatedLead, ValidateResponse } from "@/lib/types";
import { UploadPanel } from "@/components/UploadPanel";
import { CreditMeter } from "@/components/CreditMeter";
import { ResultsTable } from "@/components/ResultsTable";

export default function Home() {
  const [creditsAvailable, setCreditsAvailable] = useState(10);
  const [rawValidatedLeads, setRawValidatedLeads] = useState<ValidatedLead[] | null>(null);
  const [enrichedIndices, setEnrichedIndices] = useState<Set<number>>(new Set());
  const [data, setData] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateEnrichment(newEnrichedSet: Set<number>, baseResults?: ValidatedLead[]) {
    const source = baseResults ?? rawValidatedLeads;
    if (!source) return;

    const enrichedCount = newEnrichedSet.size;
    const remaining = Math.max(0, creditsAvailable - enrichedCount);

    const updatedResults = source.map((lead, idx) => ({
      ...lead,
      enriched: newEnrichedSet.has(idx),
      charged: newEnrichedSet.has(idx),
    }));

    const highCount = updatedResults.filter((r) => r.quality_score === "high").length;
    const medCount = updatedResults.filter((r) => r.quality_score === "medium").length;
    const lowCount = updatedResults.filter((r) => r.quality_score === "low").length;

    setData({
      results: updatedResults,
      ledger: {
        credits_available: creditsAvailable,
        total_leads: updatedResults.length,
        charged: enrichedCount,
        refunded: updatedResults.length - enrichedCount,
        credits_remaining: remaining,
        credits_saved: updatedResults.length - enrichedCount,
        high_quality_count: highCount,
        medium_quality_count: medCount,
        low_quality_count: lowCount,
        enriched_count: enrichedCount,
      },
    });
  }

  function handleCreditsChange(newCredits: number) {
    setCreditsAvailable(newCredits);
    if (data) {
      const enrichedCount = enrichedIndices.size;
      const remaining = Math.max(0, newCredits - enrichedCount);
      setData({
        ...data,
        ledger: {
          ...data.ledger,
          credits_available: newCredits,
          credits_remaining: remaining,
        },
      });
    }
  }

  function handleEnrichLead(targetIndex: number) {
    if (enrichedIndices.has(targetIndex)) return;
    const currentRemaining = data?.ledger.credits_remaining ?? creditsAvailable;
    if (currentRemaining <= 0) return;

    const next = new Set(enrichedIndices);
    next.add(targetIndex);
    setEnrichedIndices(next);
    updateEnrichment(next);
  }

  function handleEnrichBatch(targetIndices: number[]) {
    const currentRemaining = data?.ledger.credits_remaining ?? creditsAvailable;
    if (currentRemaining <= 0) return;

    const toAdd = targetIndices
      .filter((idx) => !enrichedIndices.has(idx))
      .slice(0, currentRemaining);
    if (toAdd.length === 0) return;

    const next = new Set(enrichedIndices);
    for (const idx of toAdd) {
      next.add(idx);
    }
    setEnrichedIndices(next);
    updateEnrichment(next);
  }

  async function runValidation(file: File | null) {
    setLoading(true);
    setError(null);
    try {
      const response = await validateLeads(file, creditsAvailable);
      const initialEnriched = new Set<number>();
      setEnrichedIndices(initialEnriched);
      setRawValidatedLeads(response.results);

      const highCount = response.results.filter((r) => r.quality_score === "high").length;
      const medCount = response.results.filter((r) => r.quality_score === "medium").length;
      const lowCount = response.results.filter((r) => r.quality_score === "low").length;

      setData({
        results: response.results.map((r) => ({ ...r, enriched: false, charged: false })),
        ledger: {
          credits_available: creditsAvailable,
          total_leads: response.results.length,
          charged: 0,
          refunded: response.results.length,
          credits_remaining: creditsAvailable,
          credits_saved: response.results.length,
          high_quality_count: highCount,
          medium_quality_count: medCount,
          low_quality_count: lowCount,
          enriched_count: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-neutral-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Verified Credits · SaaSquatch
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            Quality-First Selective Lead Enrichment
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
            Preview data readiness with High, Medium, and Low quality indicators for free.
            Only spend wallet credits when you click <strong>Enrich</strong>.
          </p>
        </header>

        <div className="grid gap-6">
          <UploadPanel
            creditsAvailable={creditsAvailable}
            onCreditsChange={handleCreditsChange}
            onValidate={runValidation}
            loading={loading}
          />

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {data && (
            <>
              <CreditMeter ledger={data.ledger} />
              <ResultsTable
                results={data.results}
                creditsRemaining={data.ledger.credits_remaining}
                onEnrichLead={handleEnrichLead}
                onEnrichBatch={handleEnrichBatch}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
