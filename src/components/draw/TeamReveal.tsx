"use client";

import { motion } from "framer-motion";
import { TierBadge } from "@/components/players/TierBadge";

type RevealPlayer = { id: string; name: string; stars: number };
type RevealTeam = { label: "A" | "B" | "C"; players: RevealPlayer[]; color?: string };

const TEAM_COLORS: Record<string, string> = {
  A: "#FF6B6B",
  B: "#4ECDC4",
  C: "#FFD93D",
};

export function TeamReveal({ teams }: { teams: RevealTeam[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {teams.map((t, ti) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ti * 0.15 }}
          className="rounded-xl border-2 p-4 bg-card"
          style={{ borderColor: t.color ?? TEAM_COLORS[t.label] }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Time {t.label}</h3>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: t.color ?? TEAM_COLORS[t.label] }}
            >
              {t.players.length} jogadores
            </span>
          </div>
          <ul className="space-y-2">
            {t.players.map((p, pi) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ti * 0.15 + pi * 0.08 + 0.2 }}
                className="flex items-center justify-between gap-2"
              >
                <span className="font-medium">{p.name}</span>
                <TierBadge stars={p.stars} />
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
