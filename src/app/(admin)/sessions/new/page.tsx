import { createClient } from "@/lib/supabase/server";
import { NewSessionWizard } from "./NewSessionWizard";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("id,name")
    .eq("active", true)
    .order("name");

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Nova sessão</h1>
      <NewSessionWizard players={players ?? []} />
    </div>
  );
}
