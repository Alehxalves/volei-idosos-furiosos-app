"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseWhatsAppList,
  fuzzyMatchAll,
  type MatchResult,
} from "@/lib/parser/whatsapp";
import { defaultSessionTitle } from "@/lib/sessionTitle";
import { createSession, createPlayerOnFly } from "../actions";

type PlayerOpt = { id: string; name: string };

type Resolution = {
  playerId: string | null;
  isReserve: boolean;
  slot: number;
  displayName: string;
};

export function NewSessionWizard({
  players: initial,
}: {
  players: PlayerOpt[];
}) {
  const [players, setPlayers] = useState(initial);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<MatchResult[] | null>(null);
  const initialDate = new Date().toISOString().slice(0, 10);
  const [meta, setMeta] = useState({
    title: defaultSessionTitle(initialDate),
    date: initialDate,
    location: "",
  });
  const [resolutions, setResolutions] = useState<Record<number, Resolution>>(
    {},
  );
  const [pending, start] = useTransition();

  const doParse = () => {
    const session = parseWhatsAppList(text);
    const matches = fuzzyMatchAll(session.lines, players);
    setParsed(matches);
    setMeta((m) => ({ ...m, title: session.title ?? m.title }));

    const next: Record<number, Resolution> = {};
    for (const m of matches) {
      const top = m.candidates[0];
      next[m.line.slot] = {
        playerId: m.kind === "exact" ? top!.id : null,
        isReserve: m.line.isReserve,
        slot: m.line.slot,
        displayName: m.line.name,
      };
    }
    setResolutions(next);
  };

  const setRes = (slot: number, patch: Partial<Resolution>) =>
    setResolutions((r) => ({ ...r, [slot]: { ...r[slot], ...patch } }));

  const createNewPlayer = (slot: number, name: string) => {
    start(async () => {
      try {
        const p = await createPlayerOnFly(name);
        setPlayers((prev) => [...prev, p]);
        setRes(slot, { playerId: p.id });
        toast.success(`Criado: ${p.name}`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  const stats = useMemo(() => {
    if (!parsed) return null;
    const total = parsed.length;
    const exact = parsed.filter((p) => p.kind === "exact").length;
    const fuzzy = parsed.filter((p) => p.kind === "fuzzy").length;
    const missing = parsed.filter((p) => p.kind === "missing").length;
    const resolved = Object.values(resolutions).filter(
      (r) => r.playerId,
    ).length;
    return { total, exact, fuzzy, missing, resolved };
  }, [parsed, resolutions]);

  const submit = () => {
    if (!parsed) return;
    const attendees = Object.values(resolutions)
      .filter((r) => r.playerId)
      .map((r) => ({
        playerId: r.playerId!,
        slot: r.slot,
        isReserve: r.isReserve,
      }));
    if (attendees.length === 0)
      return toast.error("Resolva ao menos 1 jogador");

    start(async () => {
      try {
        await createSession({
          date: meta.date,
          title: meta.title || null,
          location: meta.location || null,
          attendees,
        });
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Cole a lista do WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={12}
            placeholder={`VÔLEI IDOSOS & FURIOSOS\nQuarta 19h|22h\n\n1. Fulano\n2. Ciclano\n...\n\nReserva\nBeltrano`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={doParse} disabled={!text.trim()}>
            Analisar lista
          </Button>
        </CardContent>
      </Card>

      {parsed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Dados da sessão</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={meta.date}
                  onChange={(e) => {
                    const date = e.target.value;
                    setMeta((m) => ({
                      ...m,
                      date,
                      title:
                        !m.title || m.title === defaultSessionTitle(m.date)
                          ? defaultSessionTitle(date)
                          : m.title,
                    }));
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loc">Local</Label>
                <Input
                  id="loc"
                  value={meta.location}
                  onChange={(e) =>
                    setMeta({ ...meta, location: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Confirme os jogadores</CardTitle>
              {stats && (
                <p className="text-sm text-muted-foreground">
                  {stats.resolved}/{stats.total} resolvidos · {stats.exact}{" "}
                  exatos · {stats.fuzzy} sugestões · {stats.missing} novos
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {parsed.map((m) => {
                const res = resolutions[m.line.slot];
                if (!res) return null;
                return (
                  <div
                    key={m.line.slot}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <span className="w-8 text-muted-foreground tabular-nums">
                      {m.line.slot}.
                    </span>
                    <span className="flex-1 font-medium">
                      {m.line.isEmpty ? (
                        <em className="text-muted-foreground">vaga vazia</em>
                      ) : (
                        m.line.name
                      )}
                      {m.line.isReserve && (
                        <span className="ml-2 text-xs text-amber-600">
                          (reserva)
                        </span>
                      )}
                    </span>

                    {m.line.isEmpty ? (
                      <span className="text-xs text-muted-foreground">
                        ignorada
                      </span>
                    ) : m.kind === "exact" ? (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />{" "}
                        {m.candidates[0].name}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select
                          value={res.playerId ?? "__none"}
                          onValueChange={(v) =>
                            setRes(m.line.slot, {
                              playerId: v === "__none" ? null : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Escolher jogador..." />
                          </SelectTrigger>
                          <SelectContent>
                            {m.candidates.length > 0 && (
                              <>
                                {m.candidates.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}{" "}
                                    <span className="text-xs text-muted-foreground">
                                      (dist {c.score})
                                    </span>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {players
                              .filter(
                                (p) => !m.candidates.find((c) => c.id === p.id),
                              )
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            createNewPlayer(m.line.slot, m.line.name)
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-1" /> Novo
                        </Button>
                        {m.kind === "missing" && !res.playerId && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={submit} disabled={pending}>
              {pending ? "Criando..." : "Criar sessão"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
