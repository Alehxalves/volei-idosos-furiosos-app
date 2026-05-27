import Link from "next/link";
import { Plus, Calendar, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { defaultSessionTitle } from "@/lib/sessionTitle";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  draft:   "bg-muted text-muted-foreground",
  drawn:   "bg-blue-100 text-blue-800",
  playing: "bg-amber-100 text-amber-800",
  done:    "bg-emerald-100 text-emerald-800",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  drawn: "Sorteado",
  playing: "Em jogo",
  done: "Concluído",
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id,date,title,location,status,slug")
    .order("date", { ascending: false });

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4 space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Rachas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Histórico e próximos jogos.
          </p>
        </div>
        <Link href="/sessions/new" className={buttonVariants({ size: "lg" }) + " rounded-full"}>
          <Plus className="h-4 w-4 mr-1" /> Novo racha
        </Link>
      </div>

      {!sessions?.length && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground space-y-2">
            <p className="text-4xl">🏐</p>
            <p>Nenhum racha por aqui ainda.</p>
            <p className="text-xs">Clica em <strong>Novo racha</strong> pra começar.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {sessions?.map((s) => {
          const title = s.title?.trim() || defaultSessionTitle(s.date);
          const dateStr = new Date(s.date).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
          });
          return (
            <Link key={s.id} href={`/sessions/${s.id}`} className="group">
              <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4 border-l-primary/70">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {dateStr}
                      </span>
                      {s.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {s.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status] ?? ""}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
