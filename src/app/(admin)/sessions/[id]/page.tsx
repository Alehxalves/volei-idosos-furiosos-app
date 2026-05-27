import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { defaultSessionTitle } from "@/lib/sessionTitle";
import { SessionHeader } from "./SessionHeader";
import { SessionView } from "./SessionView";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions").select("*").eq("id", id).maybeSingle();
  if (!session) notFound();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("id,confirmed,is_reserve,player:players(id,name,stars,roles)")
    .eq("session_id", id)
    .order("slot");

  const { data: constraints } = await supabase
    .from("constraints").select("id,type,player_a,player_b").eq("session_id", id);

  const { data: teams } = await supabase
    .from("teams")
    .select("id,label,members:team_members(player:players(id,name,stars))")
    .eq("session_id", id)
    .order("label");

  const teamRows = (teams ?? []).map((t) => ({
    id: t.id,
    label: t.label as "A" | "B" | "C",
    members: (t.members ?? [])
      .map((m) => m.player as unknown as { id: string; name: string; stars: number })
      .filter(Boolean),
  }));

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
      <SessionHeader
        sessionId={id}
        title={session.title?.trim() || defaultSessionTitle(session.date)}
        date={session.date}
        location={session.location}
      />

      <SessionView
        sessionId={id}
        publicSlug={session.slug}
        attendances={
          (attendances ?? []).map((a) => ({
            ...a,
            player: a.player as unknown as { id: string; name: string; stars: number; roles: ("levantador"|"passador"|"atacante"|"defensor")[] },
          }))
        }
        constraints={constraints ?? []}
        teams={teamRows}
        status={session.status}
      />
    </div>
  );
}
