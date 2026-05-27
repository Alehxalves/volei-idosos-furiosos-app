import type { PlayerRole } from "./supabase/types";

export type Tier = {
  stars: 1 | 2 | 3 | 4 | 5;
  name: string;
  icon: string;
  color: string;
  textColor: string;
};

export const TIERS: Tier[] = [
  { stars: 1, name: "Bronze",   icon: "🥉", color: "#CD7F32", textColor: "#3C2410" },
  { stars: 2, name: "Prata",    icon: "🥈", color: "#C0C0C0", textColor: "#2A2A2A" },
  { stars: 3, name: "Ouro",     icon: "🥇", color: "#FFD700", textColor: "#3A2E00" },
  { stars: 4, name: "Platinum", icon: "💠", color: "#B4C7DC", textColor: "#1B2C40" },
  { stars: 5, name: "Diamante", icon: "💎", color: "#5BC0EB", textColor: "#0B2A3A" },
];

export const DEFAULT_STARS = 3;
export const DEFAULT_ELO = 1000;
export const ELO_K = 24;

export function tierOf(stars: number): Tier {
  const idx = Math.min(5, Math.max(1, Math.round(stars))) - 1;
  return TIERS[idx];
}

export const ROLES: { value: PlayerRole; label: string }[] = [
  { value: "levantador", label: "Levantador" },
  { value: "passador",   label: "Passador" },
  { value: "atacante",   label: "Atacante" },
  { value: "defensor",   label: "Defensor" },
];

export const ROLE_LABEL: Record<PlayerRole, string> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.value]: r.label }),
  {} as Record<PlayerRole, string>,
);

export function eloToStars(elo: number): number {
  return Math.min(5, Math.max(1, Math.round(elo / 200 - 2)));
}
