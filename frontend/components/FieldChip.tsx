import type { FieldCheck } from "@/lib/types";
import { isFieldMissing } from "@/lib/mask";

interface FieldChipProps {
  label: string;
  value: string;
  maskedValue?: string;
  check: FieldCheck;
  required?: boolean;
  isLocked?: boolean;
}

export function FieldChip({
  label,
  value,
  maskedValue,
  check,
  required = true,
  isLocked = false,
}: FieldChipProps) {
  const isValid = check.status === "valid";
  const isMissing = isFieldMissing(value);

  let colorClasses =
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  let icon = "✓";

  if (!isValid) {
    if (required) {
      colorClasses = "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300";
      icon = "✗";
    } else {
      colorClasses =
        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700";
      icon = "–";
    }
  }

  // Blur all non-empty fields (valid or broken/typo) when locked. Missing/N/A values stay visible.
  const shouldBlur = isLocked && !isMissing;
  const displayVal = shouldBlur ? (maskedValue ?? value) : (isMissing ? "N/A" : value);

  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${colorClasses}`}
      title={shouldBlur ? "Click 'Enrich' to unmask this contact detail" : (check.reason ?? undefined)}
    >
      <span aria-hidden className="font-bold">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold">{label}:</span>

          {shouldBlur ? (
            <div className="inline-flex items-center gap-1.5">
              <span className="filter blur-[3.5px] select-none opacity-70 font-mono tracking-wider">
                {displayVal}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium inline-flex items-center gap-0.5">
                <span>🔒</span>
                <span>Locked</span>
              </span>
            </div>
          ) : (
            <span className="font-medium truncate">{displayVal}</span>
          )}

          {!required && (
            <span className="text-[10px] font-normal px-1 rounded bg-neutral-200/70 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              optional
            </span>
          )}
        </div>

        {check.reason && (
          <span className="block opacity-80 mt-0.5 text-[11px] leading-tight">
            {check.reason}
          </span>
        )}
      </div>
    </div>
  );
}
