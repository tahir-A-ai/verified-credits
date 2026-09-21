import type { LedgerSummary } from "@/lib/types";

export function CreditMeter({ ledger }: { ledger: LedgerSummary }) {
  const pctRemaining = ledger.credits_available
    ? Math.round((ledger.credits_remaining / ledger.credits_available) * 100)
    : 0;

  const enrichedCount = ledger.enriched_count ?? ledger.charged ?? 0;
  const highCount = ledger.high_quality_count ?? 0;
  const medCount = ledger.medium_quality_count ?? 0;
  const lowCount = ledger.low_quality_count ?? 0;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs flex flex-col gap-4">
      {/* Wallet Balance & Meter */}
      <div>
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Wallet Credit Balance
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              Credits are only charged when you click &quot;Enrich&quot;
            </p>
          </div>
          <span className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
            {ledger.credits_remaining}
            <span className="text-neutral-400 text-sm font-normal"> / {ledger.credits_available} left</span>
          </span>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              pctRemaining > 30 ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${pctRemaining}%` }}
          />
        </div>
      </div>

      {/* Quality Assessment Breakdown & Usage */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
        <Stat
          label="Enriched (Charged)"
          value={enrichedCount}
          tone="text-emerald-700 dark:text-emerald-400"
          sub="Credits spent"
        />
        <Stat
          label="High Quality"
          value={highCount}
          tone="text-emerald-600 dark:text-emerald-400"
          sub="3/3 verified"
        />
        <Stat
          label="Medium Quality"
          value={medCount}
          tone="text-amber-600 dark:text-amber-400"
          sub="1-2/3 verified"
        />
        <Stat
          label="Low Quality"
          value={lowCount}
          tone="text-rose-600 dark:text-rose-400"
          sub="Unusable leads"
        />
      </div>

      {highCount > 0 && enrichedCount === 0 && (
        <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3.5 py-2 flex items-center justify-between">
          <span>
            Found <strong>{highCount} high-quality leads</strong> with complete verified contact info.
          </span>
        </p>
      )}

      {enrichedCount > 0 && (
        <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg px-3.5 py-2">
          ✓ Successfully enriched <strong>{enrichedCount} leads</strong> ({enrichedCount} credits deducted from wallet).
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number;
  tone: string;
  sub?: string;
}) {
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{sub}</div>}
    </div>
  );
}
