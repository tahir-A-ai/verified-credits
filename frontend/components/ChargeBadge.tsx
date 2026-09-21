export function ChargeBadge({ charged }: { charged: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        charged
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          charged ? "bg-emerald-400" : "bg-amber-500"
        }`}
      />
      {charged ? "Charged 1 credit" : "Not charged"}
    </span>
  );
}
