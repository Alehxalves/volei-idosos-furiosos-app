import { normalizeName } from "../slug";

export type ParsedLine = {
  slot: number;
  rawName: string;        // como veio
  name: string;           // trim/cleanup
  isReserve: boolean;
  isEmpty: boolean;
};

export type ParsedSession = {
  title: string | null;
  weekday: string | null;
  timeRange: string | null;
  lines: ParsedLine[];
};

const RESERVE_HEADERS = /^(reserva|reservas|espera|suplente|suplentes|substituto|substitutos)\b/i;
const NUMBERED_LINE   = /^\s*\d+\s*[.)º\-:]\s*(.*)$/;
const TIME_RE         = /\b(\d{1,2}h(?:\d{2})?)\s*[••\-–|l]\s*(\d{1,2}h(?:\d{2})?)/i;
const WEEKDAY_RE      = /\b(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)\b/i;

export function parseWhatsAppList(input: string): ParsedSession {
  const rawLines = input.split(/\r?\n/);
  const lines: ParsedLine[] = [];
  let isReserve = false;
  let title: string | null = null;
  let weekday: string | null = null;
  let timeRange: string | null = null;

  for (const raw of rawLines) {
    const line = raw.replace(/⁠|​|‌|‍| /g, "").trimEnd();
    if (!line.trim()) continue;

    if (RESERVE_HEADERS.test(line.trim())) { isReserve = true; continue; }

    const m = NUMBERED_LINE.exec(line);
    if (m) {
      const slot = parseInt(line.match(/\d+/)![0], 10);
      const rawName = m[1] ?? "";
      const name = rawName.replace(/^[⁠\s]+/, "").trim();
      lines.push({
        slot,
        rawName,
        name,
        isReserve,
        isEmpty: name.length === 0,
      });
      continue;
    }

    // header lines (antes do primeiro numerado)
    if (lines.length === 0) {
      if (!title) title = line.trim();
      const w = line.match(WEEKDAY_RE);
      if (w) weekday = w[1];
      const t = line.match(TIME_RE);
      if (t) timeRange = `${t[1]}-${t[2]}`;
    }
  }

  return { title, weekday, timeRange, lines };
}

// Levenshtein distance (small strings)
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = a[i - 1] === b[j - 1]
        ? prev
        : Math.min(prev, dp[i], dp[i - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[a.length];
}

export type MatchKind = "exact" | "fuzzy" | "missing";

export type MatchResult = {
  line: ParsedLine;
  kind: MatchKind;
  candidates: { id: string; name: string; score: number }[];
};

export function fuzzyMatchAll(
  lines: ParsedLine[],
  players: { id: string; name: string }[],
): MatchResult[] {
  const normPlayers = players.map((p) => ({ ...p, norm: normalizeName(p.name) }));

  return lines.map((line) => {
    if (line.isEmpty) {
      return { line, kind: "missing", candidates: [] };
    }
    const target = normalizeName(line.name);

    const exact = normPlayers.find((p) => p.norm === target);
    if (exact) {
      return { line, kind: "exact", candidates: [{ id: exact.id, name: exact.name, score: 0 }] };
    }

    const ranked = normPlayers
      .map((p) => ({ id: p.id, name: p.name, score: levenshtein(target, p.norm), normLen: p.norm.length }))
      .filter((c) => {
        const tol = Math.max(2, Math.floor(Math.min(target.length, c.normLen) * 0.25));
        return c.score <= tol;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return { line, kind: ranked.length ? "fuzzy" : "missing", candidates: ranked };
  });
}
