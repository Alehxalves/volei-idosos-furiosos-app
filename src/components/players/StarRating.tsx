"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TIERS, tierOf } from "@/lib/rating";

type Props = {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  size?: number;
  showLabel?: boolean;
};

export function StarRating({ value, onChange, readOnly, size = 22, showLabel = true }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const tier = tierOf(display);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center"
        role={readOnly ? undefined : "radiogroup"}
        aria-label="Rating em estrelas"
      >
        {TIERS.map((t) => {
          const filled = t.stars <= display;
          return (
            <button
              key={t.stars}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(t.stars)}
              onMouseLeave={() => !readOnly && setHover(0)}
              onClick={() => !readOnly && onChange?.(t.stars)}
              className={cn(
                "p-0.5 transition-transform",
                !readOnly && "hover:scale-110 cursor-pointer",
                readOnly && "cursor-default",
              )}
              aria-label={`${t.stars} estrelas — ${t.name}`}
            >
              <Star
                size={size}
                strokeWidth={1.5}
                fill={filled ? tier.color : "transparent"}
                color={filled ? tier.color : "#9CA3AF"}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: tier.textColor }}>
          <span className="mr-1">{tier.icon}</span>
          {tier.name}
        </span>
      )}
    </div>
  );
}
