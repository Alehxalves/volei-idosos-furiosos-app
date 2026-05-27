import type { PlayerRole } from "../supabase/types";

export type DraftPlayer = {
  id: string;
  name: string;
  stars: number;
  elo: number;
  roles: PlayerRole[];
};

export type DraftConstraint = { type: "lock" | "avoid"; a: string; b: string };

export type DraftTeam = {
  label: "A" | "B" | "C";
  players: DraftPlayer[];
};

export type DraftResult = {
  teams: DraftTeam[];
  warnings: string[];
  metrics: { label: string; sumStars: number; setters: number; passers: number; attackers: number }[];
};

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const has = (p: DraftPlayer, r: PlayerRole) => p.roles.includes(r);
const sumStars = (t: DraftTeam) => t.players.reduce((s, p) => s + p.stars, 0);

function violatesConstraints(teams: DraftTeam[], constraints: DraftConstraint[]): DraftConstraint[] {
  const teamOf = new Map<string, string>();
  teams.forEach((t) => t.players.forEach((p) => teamOf.set(p.id, t.label)));
  return constraints.filter((c) => {
    const ta = teamOf.get(c.a), tb = teamOf.get(c.b);
    if (!ta || !tb) return false;
    return c.type === "lock" ? ta !== tb : ta === tb;
  });
}

function trySwapToFix(teams: DraftTeam[], constraints: DraftConstraint[]): boolean {
  for (let attempt = 0; attempt < 50; attempt++) {
    const v = violatesConstraints(teams, constraints);
    if (v.length === 0) return true;
    const c = v[0];
    const targetTeam = teams.find((t) => t.players.some((p) => p.id === c.a))!;
    const otherTeam  = teams.find((t) => t.players.some((p) => p.id === c.b))!;
    const player     = otherTeam.players.find((p) => p.id === c.b)!;

    const swap = targetTeam.players.find(
      (p) => Math.abs(p.stars - player.stars) <= 1 && p.id !== c.a,
    );
    if (!swap) return false;

    targetTeam.players = targetTeam.players.filter((p) => p.id !== swap.id).concat(player);
    otherTeam.players  = otherTeam.players.filter((p) => p.id !== player.id).concat(swap);
  }
  return false;
}

function metricsOf(teams: DraftTeam[]) {
  return teams.map((t) => ({
    label: t.label,
    sumStars: sumStars(t),
    setters:   t.players.filter((p) => has(p, "levantador")).length,
    passers:   t.players.filter((p) => has(p, "passador")).length,
    attackers: t.players.filter((p) => has(p, "atacante")).length,
  }));
}

function runOnce(
  players: DraftPlayer[],
  constraints: DraftConstraint[],
  seed: number,
): DraftResult {
  const rng = rand(seed);
  const warnings: string[] = [];
  const teams: DraftTeam[] = [
    { label: "A", players: [] },
    { label: "B", players: [] },
    { label: "C", players: [] },
  ];

  // FASE 1: levantadores
  const setters = players.filter((p) => has(p, "levantador"))
    .sort((a, b) => b.stars - a.stars || b.elo - a.elo);
  const rest = players.filter((p) => !setters.includes(p));

  if (setters.length < 3) {
    warnings.push(`Apenas ${setters.length} levantador(es) dedicado(s) — times podem ficar sem setter natural.`);
  }

  setters.slice(0, 3).forEach((s, i) => teams[i].players.push(s));
  const leftoverSetters = setters.slice(3);

  // FASE 2: distribuir restante (incluindo levantadores extras) por snake
  const pool = shuffle(rest.concat(leftoverSetters), rng)
    .sort((a, b) => b.stars - a.stars || b.elo - a.elo);

  for (const p of pool) {
    const minStars = Math.min(...teams.map(sumStars));
    const candidates = teams.filter((t) => sumStars(t) === minStars && t.players.length < 6);
    let target = candidates[0] ?? teams.find((t) => t.players.length < 6);
    if (!target) break;

    // soft preference: time que ainda não atingiu min passador/atacante
    const needs = candidates
      .map((t) => {
        const m = metricsOf([t])[0];
        const missing = (m.passers < 2 && has(p, "passador") ? 1 : 0)
                      + (m.attackers < 2 && has(p, "atacante") ? 1 : 0);
        return { t, missing };
      })
      .sort((x, y) => y.missing - x.missing);
    if (needs.length && needs[0].missing > 0) target = needs[0].t;

    target.players.push(p);
  }

  // FASE 3: constraints
  const constraintOk = trySwapToFix(teams, constraints);
  if (!constraintOk) warnings.push("Constraint impossível de satisfazer com swaps simples.");

  // FASE 4: validação
  const m = metricsOf(teams);
  m.forEach((tm) => {
    if (tm.passers < 2)   warnings.push(`Time ${tm.label}: ${tm.passers} passador(es) (<2)`);
    if (tm.attackers < 2) warnings.push(`Time ${tm.label}: ${tm.attackers} atacante(s) (<2)`);
  });

  return { teams, warnings, metrics: m };
}

export function snakeDraft(
  players: DraftPlayer[],
  constraints: DraftConstraint[] = [],
  opts: { seed?: number; maxSeeds?: number; balanceTolerance?: number } = {},
): DraftResult {
  const maxSeeds = opts.maxSeeds ?? 20;
  const tolerance = opts.balanceTolerance ?? 2;
  let best: DraftResult | null = null;
  let bestSpread = Infinity;

  for (let i = 0; i < maxSeeds; i++) {
    const result = runOnce(players, constraints, (opts.seed ?? 1) + i * 31);
    const sums = result.metrics.map((m) => m.sumStars);
    const spread = Math.max(...sums) - Math.min(...sums);
    if (spread < bestSpread) { best = result; bestSpread = spread; }
    if (spread <= tolerance) break;
  }

  return best!;
}
