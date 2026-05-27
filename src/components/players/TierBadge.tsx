import { tierOf } from "@/lib/rating";
import { cn } from "@/lib/utils";

export function TierBadge({ stars, className }: { stars: number; className?: string }) {
  const tier = tierOf(stars);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className,
      )}
      style={{
        backgroundColor: `${tier.color}22`,
        color: tier.textColor,
        boxShadow: `inset 0 0 0 1px ${tier.color}55`,
      }}
      title={`${tier.name} (${tier.stars}★)`}
    >
      <span aria-hidden>{tier.icon}</span>
      <span>{tier.name}</span>
      <span className="opacity-60">{"★".repeat(tier.stars)}</span>
    </span>
  );
}
