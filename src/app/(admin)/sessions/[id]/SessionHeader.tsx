"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSessionTitle, updateSessionDate } from "../actions";

type Props = {
  sessionId: string;
  title: string;
  date: string;
  location: string | null;
};

export function SessionHeader({ sessionId, title, date, location }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [editingDate, setEditingDate] = useState(false);
  const [draftDate, setDraftDate] = useState(date);
  const [pending, start] = useTransition();

  const saveTitle = () => {
    const clean = draftTitle.trim();
    if (!clean) return toast.error("Título não pode ficar vazio");
    if (clean === title) return setEditingTitle(false);
    start(async () => {
      try {
        await updateSessionTitle(sessionId, clean);
        toast.success("Título atualizado");
        setEditingTitle(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  const saveDate = () => {
    if (draftDate === date) return setEditingDate(false);
    start(async () => {
      try {
        await updateSessionDate(sessionId, draftDate);
        toast.success("Data atualizada");
        setEditingDate(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <div>
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") { setDraftTitle(title); setEditingTitle(false); }
            }}
            className="text-2xl md:text-3xl font-bold h-auto py-1.5"
          />
          <Button size="icon" onClick={saveTitle} disabled={pending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => { setDraftTitle(title); setEditingTitle(false); }}
            disabled={pending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-60 group-hover:opacity-100"
            onClick={() => setEditingTitle(true)}
            aria-label="Editar título"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
      {editingDate ? (
        <div className="flex items-center gap-2 mt-1">
          <Input
            autoFocus
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveDate();
              if (e.key === "Escape") { setDraftDate(date); setEditingDate(false); }
            }}
            className="w-44 h-8 text-sm"
          />
          <Button size="icon" onClick={saveDate} disabled={pending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => { setDraftDate(date); setEditingDate(false); }}
            disabled={pending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 mt-1 group">
          <p className="text-muted-foreground">
            {(() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); })()}
            {location && ` · ${location}`}
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-60"
            onClick={() => setEditingDate(true)}
            aria-label="Editar data"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
