"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/players/StarRating";
import { RoleSelector } from "@/components/players/RoleSelector";
import { upsertPlayer, type PlayerInput } from "./actions";
import type { PlayerRole } from "@/lib/supabase/types";

type Props = {
  initial?: Partial<PlayerInput> & { id?: string };
  onSaved?: () => void;
};

export function PlayerForm({ initial, onSaved }: Props) {
  const [name,   setName]   = useState(initial?.name   ?? "");
  const [stars,  setStars]  = useState<number>(initial?.stars  ?? 3);
  const [roles,  setRoles]  = useState<PlayerRole[]>(initial?.roles ?? []);
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    start(async () => {
      try {
        await upsertPlayer({ id: initial?.id, name: name.trim(), stars, roles, active });
        toast.success("Jogador salvo");
        onSaved?.();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label>Rating</Label>
        <StarRating value={stars} onChange={setStars} />
      </div>

      <div className="grid gap-2">
        <Label>Posições</Label>
        <RoleSelector value={roles} onChange={setRoles} />
      </div>

      <div className="flex items-center gap-3">
        <Switch id="active" checked={active} onCheckedChange={setActive} />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <Button onClick={submit} disabled={pending}>
        {pending ? "Salvando..." : initial?.id ? "Atualizar" : "Cadastrar"}
      </Button>
    </div>
  );
}
