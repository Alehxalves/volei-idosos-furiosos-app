"use client";

import { useState, useTransition } from "react";
import { Dices, Lock, Unlink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TierBadge } from "@/components/players/TierBadge";
import { TeamReveal } from "@/components/draw/TeamReveal";
import { Scoreboard } from "@/components/score/Scoreboard";
import {
  drawTeams,
  addConstraint,
  removeConstraint,
  toggleAttendance,
} from "./actions";
import type { PlayerRole } from "@/lib/supabase/types";

type Attendance = {
  id: string;
  confirmed: boolean;
  is_reserve: boolean;
  player: { id: string; name: string; stars: number; roles: PlayerRole[] };
};
type Constraint = {
  id: string;
  type: "lock" | "avoid";
  player_a: string;
  player_b: string;
};
type Team = {
  id: string;
  label: "A" | "B" | "C";
  members: { id: string; name: string; stars: number }[];
};

type Props = {
  sessionId: string;
  publicSlug: string;
  attendances: Attendance[];
  constraints: Constraint[];
  teams: Team[];
  status: string;
};

export function SessionView({
  sessionId,
  publicSlug,
  attendances,
  constraints,
  teams,
  status,
}: Props) {
  const [pending, start] = useTransition();
  const [activeTab, setActiveTab] = useState(teams.length ? "teams" : "roster");
  const [showRoster, setShowRoster] = useState<"all" | "confirmed">(
    "confirmed",
  );
  const [warnings, setWarnings] = useState<string[]>([]);

  const playersById = new Map(attendances.map((a) => [a.player.id, a.player]));
  const confirmed = attendances.filter((a) => a.confirmed && !a.is_reserve);

  const doDraw = () => {
    start(async () => {
      try {
        const r = await drawTeams({ sessionId });
        setWarnings(r.warnings ?? []);
        toast.success("Times sorteados");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TabsList>
          <TabsTrigger value="roster">Lista ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="constraints">
            Restrições ({constraints.length})
          </TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="score">Placar</TabsTrigger>
        </TabsList>
        <a
          href={`/s/${publicSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Página pública ↗
        </a>
      </div>

      <TabsContent value="roster" className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Confirmados</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Switch
                  checked={showRoster === "all"}
                  onCheckedChange={(v) =>
                    setShowRoster(v ? "all" : "confirmed")
                  }
                />
                <span>Mostrar todos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {attendances
              .filter((a) => showRoster === "all" || a.confirmed)
              .map((a) => (
                <div key={a.id} className="py-2 flex items-center gap-3">
                  <Switch
                    checked={a.confirmed}
                    onCheckedChange={(v) =>
                      start(async () => {
                        try {
                          await toggleAttendance(a.id, sessionId, v);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      })
                    }
                  />
                  <span className="flex-1 font-medium">
                    {a.player.name}
                    {a.is_reserve && (
                      <span className="ml-2 text-xs text-amber-600">
                        (reserva)
                      </span>
                    )}
                  </span>
                  <TierBadge stars={a.player.stars} />
                </div>
              ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="constraints" className="mt-4">
        <ConstraintsPanel
          sessionId={sessionId}
          players={Array.from(playersById.values())}
          constraints={constraints}
        />
      </TabsContent>

      <TabsContent value="teams" className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={doDraw} disabled={pending} size="lg">
            <Dices className="h-4 w-4 mr-2" />
            {pending
              ? "Sorteando..."
              : teams.length
                ? "Re-sortear times"
                : "Sortear times"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {confirmed.length} jogadores confirmados. Snake draft com roles.
          </p>
        </div>

        {/* {warnings.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-3 text-sm text-amber-900">
              <p className="font-semibold mb-1">Avisos:</p>
              <ul className="list-disc ml-5">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </CardContent>
          </Card>
        )} */}

        {teams.length > 0 && (
          <TeamReveal
            teams={teams.map((t) => ({ label: t.label, players: t.members }))}
          />
        )}
      </TabsContent>

      <TabsContent value="score" className="mt-4">
        {teams.length >= 2 ? (
          <Scoreboard sessionId={sessionId} teams={teams} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Sorteie os times primeiro.
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground mt-2">Status: {status}</p>
      </TabsContent>
    </Tabs>
  );
}

function ConstraintsPanel({
  sessionId,
  players,
  constraints,
}: {
  sessionId: string;
  players: { id: string; name: string }[];
  constraints: Constraint[];
}) {
  const [type, setType] = useState<"lock" | "avoid">("lock");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pending, start] = useTransition();
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";

  const add = () => {
    if (!a || !b || a === b)
      return toast.error("Selecione 2 jogadores diferentes");
    start(async () => {
      try {
        await addConstraint(sessionId, type, a, b);
        setA("");
        setB("");
        toast.success("Adicionado");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restrições de sorteio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-4 gap-2">
          <Select
            value={type}
            onValueChange={(v) => setType(v as "lock" | "avoid")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lock">Juntar (mesmo time)</SelectItem>
              <SelectItem value="avoid">Separar (times diferentes)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={a} onValueChange={(v) => setA(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Jogador A" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={b} onValueChange={(v) => setB(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Jogador B" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={pending}>
            Adicionar
          </Button>
        </div>

        <div className="divide-y">
          {constraints.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              Nenhuma restrição.
            </p>
          )}
          {constraints.map((c) => (
            <div key={c.id} className="py-2 flex items-center gap-2">
              {c.type === "lock" ? (
                <Lock className="h-4 w-4 text-emerald-600" />
              ) : (
                <Unlink className="h-4 w-4 text-rose-600" />
              )}
              <span className="flex-1">
                <strong>{nameOf(c.player_a)}</strong>
                {c.type === "lock" ? " junto com " : " separado de "}
                <strong>{nameOf(c.player_b)}</strong>
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  start(async () => {
                    try {
                      await removeConstraint(c.id, sessionId);
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  })
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
