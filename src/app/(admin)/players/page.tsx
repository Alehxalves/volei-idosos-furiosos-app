import { createClient } from "@/lib/supabase/server";
import { PlayersTable, type PlayerRow } from "./PlayersTable";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("id,name,stars,roles,active,elo,pending_review")
    .order("name", { ascending: true });

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <PlayersTable rows={(data ?? []) as PlayerRow[]} />
    </div>
  );
}
