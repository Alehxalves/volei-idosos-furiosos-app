"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TeamReveal } from "@/components/draw/TeamReveal";

type Team = { id: string; label: "A" | "B" | "C"; members: { id: string; name: string; stars: number }[] };
type Match = {
  id: string; team_home: string; team_away: string;
  score_home: number; score_away: number; winner: string | null; played_at: string;
};
type Session = { id: string; title: string | null; date: string; location: string | null };

export function PublicSession({ session, teams, matches }: { session: Session; teams: Team[]; matches: Match[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const labelOf = (id: string) => teams.find((t) => t.id === id)?.label ?? "?";

  const exportPng = async () => {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `volei-${session.date}.png`;
      a.click();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{session.title ?? "Vôlei"}</h1>
          <p className="text-muted-foreground">
            {new Date(session.date).toLocaleDateString("pt-BR")}
            {session.location && ` · ${session.location}`}
          </p>
        </div>
        <Button onClick={exportPng}><Download className="h-4 w-4 mr-2" /> Exportar imagem</Button>
      </div>

      <div ref={ref} className="bg-white p-6 rounded-xl border space-y-6">
        <h2 className="text-2xl font-bold text-center">🏐 {session.title ?? "Times"}</h2>
        {teams.length ? (
          <TeamReveal teams={teams.map((t) => ({ label: t.label, players: t.members }))} />
        ) : (
          <p className="text-center text-muted-foreground">Times ainda não sorteados.</p>
        )}

        {matches.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Partidas</h3>
            <ul className="divide-y border rounded-lg">
              {matches.map((m) => (
                <li key={m.id} className="px-3 py-2 flex justify-between items-center">
                  <span>Time {labelOf(m.team_home)} × Time {labelOf(m.team_away)}</span>
                  <span className="tabular-nums font-bold">
                    {m.score_home} - {m.score_away}
                    {m.winner && (
                      <span className="ml-2 text-xs text-emerald-700">
                        🏆 Time {labelOf(m.winner)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
