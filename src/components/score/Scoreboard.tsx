"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveMatch } from "@/app/(admin)/sessions/[id]/actions";

type Team = { id: string; label: "A" | "B" | "C" };

export function Scoreboard({ sessionId, teams }: { sessionId: string; teams: Team[] }) {
  const [homeLabel, setHomeLabel] = useState<Team["label"] | "">(teams[0]?.label ?? "");
  const [awayLabel, setAwayLabel] = useState<Team["label"] | "">(teams[1]?.label ?? "");
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [pending, start] = useTransition();

  const home_team = teams.find((t) => t.label === homeLabel);
  const away_team = teams.find((t) => t.label === awayLabel);

  const finish = () => {
    if (!home_team || !away_team || homeLabel === awayLabel) {
      return toast.error("Selecione 2 times diferentes");
    }
    if (home === away) return toast.error("Sem empate");
    
    start(async () => {
      try {
        await saveMatch({ 
          sessionId, 
          teamHome: home_team.id, 
          teamAway: away_team.id, 
          scoreHome: home, 
          scoreAway: away 
        });
        toast.success(`Time ${home > away ? home_team.label : away_team.label} venceu!`);
        setHome(0); 
        setAway(0);
      } catch (e) { 
        toast.error((e as Error).message); 
      }
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Placar</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <TeamCol
            teams={teams.filter((t) => t.label !== awayLabel)}
            value={homeLabel} 
            onChange={(v) => setHomeLabel(v as Team["label"])}
            score={home} 
            setScore={setHome}
            color="#FF6B6B"
          />
          <TeamCol
            teams={teams.filter((t) => t.label !== homeLabel)}
            value={awayLabel} 
            onChange={(v) => setAwayLabel(v as Team["label"])}
            score={away} 
            setScore={setAway}
            color="#4ECDC4"
          />
        </div>
        <Button onClick={finish} disabled={pending} className="w-full" size="lg">
          <Trophy className="h-4 w-4 mr-2" /> {pending ? "Salvando..." : "Encerrar partida"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamCol({
  teams, value, onChange, score, setScore, color,
}: {
  teams: Team[]; value: string; onChange: (v: string) => void;
  score: number; setScore: (n: number) => void; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: `${color}11` }}>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full">
          <div className="flex gap-1 items-center">
            <span>Time</span>
            <SelectValue placeholder="" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.label}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-7xl font-bold tabular-nums" style={{ color }}>{score}</div>
      
      <div className="flex gap-2">
        <Button size="icon" variant="outline" onClick={() => setScore(Math.max(0, score - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setScore(score + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


