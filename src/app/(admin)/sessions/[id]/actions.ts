"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { snakeDraft, type DraftPlayer, type DraftConstraint } from "@/lib/draft/snake";
import { teamAvg, teamUpdate, distributeDelta } from "@/lib/elo";

export async function addConstraint(sessionId: string, type: "lock" | "avoid", a: string, b: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("constraints").insert({
    session_id: sessionId, type, player_a: a, player_b: b,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function removeConstraint(id: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("constraints").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function toggleAttendance(id: string, sessionId: string, confirmed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendances").update({ confirmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

const DrawSchema = z.object({ sessionId: z.string().uuid(), seed: z.number().optional() });

export async function drawTeams(input: z.infer<typeof DrawSchema>) {
  const { sessionId, seed } = DrawSchema.parse(input);
  const supabase = await createClient();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("player_id, is_reserve, confirmed, players(id,name,stars,elo,roles)")
    .eq("session_id", sessionId)
    .eq("confirmed", true)
    .eq("is_reserve", false);

  const players: DraftPlayer[] = (attendances ?? [])
    .map((a) => a.players as unknown as DraftPlayer)
    .filter(Boolean);

  if (players.length < 6) throw new Error("Pelo menos 6 jogadores confirmados.");

  const { data: cons } = await supabase
    .from("constraints").select("id,type,player_a,player_b").eq("session_id", sessionId);
  const constraints: DraftConstraint[] = (cons ?? []).map((c) => ({
    type: c.type, a: c.player_a, b: c.player_b,
  }));

  const result = snakeDraft(players, constraints, { seed: seed ?? Date.now() });

  // limpa teams existentes
  await supabase.from("teams").delete().eq("session_id", sessionId);

  const { data: createdTeams, error: tErr } = await supabase
    .from("teams")
    .insert(result.teams.map((t) => ({ session_id: sessionId, label: t.label })))
    .select("id,label");
  if (tErr || !createdTeams) throw new Error(tErr?.message ?? "Erro criando times");

  const memberRows = result.teams.flatMap((t) => {
    const team = createdTeams.find((ct) => ct.label === t.label)!;
    return t.players.map((p) => ({ team_id: team.id, player_id: p.id }));
  });

  if (memberRows.length) {
    const { error: mErr } = await supabase.from("team_members").insert(memberRows);
    if (mErr) throw new Error(mErr.message);
  }

  await supabase.from("sessions").update({ status: "drawn" }).eq("id", sessionId);

  revalidatePath(`/sessions/${sessionId}`);
  return { warnings: result.warnings, metrics: result.metrics };
}

const SaveMatchSchema = z.object({
  sessionId: z.string().uuid(),
  teamHome:  z.string().uuid(),
  teamAway:  z.string().uuid(),
  scoreHome: z.number().int().min(0),
  scoreAway: z.number().int().min(0),
});

export async function saveMatch(input: z.infer<typeof SaveMatchSchema>) {
  const { sessionId, teamHome, teamAway, scoreHome, scoreAway } = SaveMatchSchema.parse(input);
  const supabase = await createClient();

  if (scoreHome === scoreAway) throw new Error("Sem empate.");
  const winnerId = scoreHome > scoreAway ? teamHome : teamAway;

  const { error } = await supabase.from("matches").insert({
    session_id: sessionId,
    team_home: teamHome, team_away: teamAway,
    score_home: scoreHome, score_away: scoreAway,
    winner: winnerId,
  });
  if (error) throw new Error(error.message);

  // ELO update
  const { data: rows } = await supabase
    .from("team_members")
    .select("team_id, players(id,elo)")
    .in("team_id", [teamHome, teamAway]);

  const groupByTeam = (id: string) =>
    (rows ?? []).filter((r) => r.team_id === id)
                .map((r) => r.players as unknown as { id: string; elo: number });

  const home = groupByTeam(teamHome);
  const away = groupByTeam(teamAway);

  const eloHome = teamAvg(home.map((p) => p.elo));
  const eloAway = teamAvg(away.map((p) => p.elo));
  const winnerLabel: "A" | "B" = scoreHome > scoreAway ? "A" : "B";
  const next = teamUpdate(eloHome, eloAway, winnerLabel);

  const homeNext = distributeDelta(home, eloHome, next.a);
  const awayNext = distributeDelta(away, eloAway, next.b);

  for (const { id, elo } of [...homeNext, ...awayNext]) {
    await supabase.from("players").update({ elo }).eq("id", id);
  }

  revalidatePath(`/sessions/${sessionId}`);
}
