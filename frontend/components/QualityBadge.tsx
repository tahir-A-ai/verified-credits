import type { QualityScore } from "@/lib/types";

interface QualityBadgeProps {
  quality: QualityScore;
  verifiedCount: number;
}

export function QualityBadge({ quality, verifiedCount }: QualityBadgeProps) {
  if (quality === "high") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        High Quality ({verifiedCount}/3)
      </span>
    );
  }

  if (quality === "medium") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Medium Quality ({verifiedCount}/3)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Low Quality ({verifiedCount}/3)
    </span>
  );
}
