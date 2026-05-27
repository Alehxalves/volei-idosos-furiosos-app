import { ELO_K } from "../rating";

function expected(a: number, b: number) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export function teamUpdate(eloA: number, eloB: number, winner: "A" | "B"): { a: number; b: number } {
  const ea = expected(eloA, eloB);
  const eb = 1 - ea;
  const sa = winner === "A" ? 1 : 0;
  const sb = 1 - sa;
  return {
    a: Math.round(eloA + ELO_K * (sa - ea)),
    b: Math.round(eloB + ELO_K * (sb - eb)),
  };
}

// Aplica delta médio do team update a cada jogador do time
export function distributeDelta(
  playerElos: { id: string; elo: number }[],
  teamElo: number,
  nextTeamElo: number,
): { id: string; elo: number; delta: number }[] {
  const delta = nextTeamElo - teamElo;
  return playerElos.map((p) => ({ id: p.id, elo: p.elo + delta, delta }));
}

export function teamAvg(elos: number[]) {
  return elos.length ? Math.round(elos.reduce((s, x) => s + x, 0) / elos.length) : 1000;
}
