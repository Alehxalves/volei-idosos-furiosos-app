import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSession } from "./PublicSession";

export const dynamic = "force-dynamic";

export default async function PublicSessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id,title,date,location")
    .eq("slug", slug)
    .maybeSingle();
  if (!session) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("id,label,members:team_members(player:players(id,name,stars))")
    .eq("session_id", session.id)
    .order("label");

  const { data: matches } = await supabase
    .from("matches")
    .select("id,team_home,team_away,score_home,score_away,winner,played_at")
    .eq("session_id", session.id)
    .order("played_at");

  return (
    <PublicSession
      session={session}
      teams={(teams ?? []).map((t) => ({
        id: t.id,
        label: t.label as "A" | "B" | "C",
        members: (t.members ?? [])
          .map((m) => m.player as unknown as { id: string; name: string; stars: number })
          .filter(Boolean),
      }))}
      matches={matches ?? []}
    />
  );
}
