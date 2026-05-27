"use client";

import { ROLES } from "@/lib/rating";
import type { PlayerRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ROLE_EMOJI: Record<PlayerRole, string> = {
  levantador: "🙌",
  passador:   "🤲",
  atacante:   "💥",
  defensor:   "🛡️",
};

export function RoleSelector({
  value,
  onChange,
  readOnly,
}: {
  value: PlayerRole[];
  onChange?: (next: PlayerRole[]) => void;
  readOnly?: boolean;
}) {
  const toggle = (role: PlayerRole) => {
    if (readOnly) return;
    onChange?.(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => {
        const active = value.includes(r.value);
        return (
          <button
            key={r.value}
            type="button"
            disabled={readOnly}
            onClick={() => toggle(r.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-all",
              active
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-muted text-muted-foreground ring-border hover:ring-primary/50",
              readOnly && "cursor-default opacity-80",
            )}
          >
            <span aria-hidden>{ROLE_EMOJI[r.value]}</span>
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
