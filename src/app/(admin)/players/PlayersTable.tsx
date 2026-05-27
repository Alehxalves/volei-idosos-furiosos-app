"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Search, Plus, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/players/TierBadge";
import { ROLE_LABEL } from "@/lib/rating";
import { PlayerForm } from "./PlayerForm";
import { deletePlayer, togglePlayerActive } from "./actions";
import type { PlayerRole } from "@/lib/supabase/types";

export type PlayerRow = {
  id: string;
  name: string;
  stars: number;
  roles: PlayerRole[];
  active: boolean;
  elo: number;
  pending_review: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function PlayersTable({ rows }: { rows: PlayerRow[] }) {
  const [editing, setEditing] = useState<PlayerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "review">("all");
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (filter === "active" && !r.active) return false;
      if (filter === "inactive" && r.active) return false;
      if (filter === "review" && !r.pending_review) return false;
      return true;
    });
  }, [rows, query, filter]);

  const counts = useMemo(() => ({
    all: rows.length,
    active: rows.filter((r) => r.active).length,
    inactive: rows.filter((r) => !r.active).length,
    review: rows.filter((r) => r.pending_review).length,
  }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Jogadores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {counts.active} ativos · {counts.all} no total
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button size="lg" className="rounded-full">
                <Plus className="h-4 w-4 mr-1" /> Novo jogador
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader><DialogTitle>Novo jogador</DialogTitle></DialogHeader>
            <PlayerForm onSaved={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <div className="inline-flex rounded-full bg-muted p-1 text-sm">
          {([
            ["all", "Todos"],
            ["active", "Ativos"],
            ["inactive", "Inativos"],
            ["review", "Revisar"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                filter === k
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => {
            const hue = hashHue(p.name);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <Card
                  className={`relative p-4 hover:shadow-md transition-shadow ${
                    p.pending_review ? "ring-1 ring-amber-300 bg-amber-50/40" : ""
                  } ${!p.active ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-12 w-12 rounded-full grid place-items-center text-white font-bold text-sm shrink-0 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 50%))`,
                      }}
                    >
                      {initials(p.name) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{p.name}</p>
                        {p.pending_review && (
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 rounded">
                            revisar
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <TierBadge stars={p.stars} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                        {p.roles.length
                          ? p.roles.map((r) => ROLE_LABEL[r]).join(" · ")
                          : "Sem posição definida"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ELO</p>
                      <p className="font-bold tabular-nums text-lg leading-none">{p.elo}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(v) =>
                          start(async () => {
                            try { await togglePlayerActive(p.id, v); }
                            catch (e) { toast.error((e as Error).message); }
                          })
                        }
                      />
                      Ativo
                    </label>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (!confirm(`Excluir ${p.name}?`)) return;
                          start(async () => {
                            try { await deletePlayer(p.id); toast.success("Removido"); }
                            catch (e) { toast.error((e as Error).message); }
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16 space-y-2">
          <UserX className="h-10 w-10 mx-auto opacity-50" />
          <p>{rows.length === 0 ? "Nenhum jogador cadastrado." : "Nada encontrado."}</p>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar jogador</DialogTitle></DialogHeader>
          {editing && (
            <PlayerForm
              initial={{
                id: editing.id,
                name: editing.name,
                stars: editing.stars,
                roles: editing.roles,
                active: editing.active,
              }}
              onSaved={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
