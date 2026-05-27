"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { defaultSessionTitle } from "@/lib/sessionTitle";

const CreateSchema = z.object({
  date: z.string().min(8),         // YYYY-MM-DD
  title: z.string().nullable(),
  location: z.string().nullable(),
  attendees: z.array(z.object({
    playerId: z.string().uuid(),
    slot: z.number().int().min(1).max(99),
    isReserve: z.boolean(),
  })),
});

export type CreateInput = z.infer<typeof CreateSchema>;

export async function createSession(input: CreateInput) {
  const parsed = CreateSchema.parse(input);
  const supabase = await createClient();

  const title = parsed.title?.trim() || defaultSessionTitle(parsed.date);
  const baseSlug = slugify(`${parsed.date}-${title}`);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      date: parsed.date,
      title,
      location: parsed.location,
      slug,
    })
    .select("id")
    .single();
  if (error || !session) throw new Error(error?.message ?? "Falha ao criar sessão");

  if (parsed.attendees.length) {
    const { error: attErr } = await supabase.from("attendances").insert(
      parsed.attendees.map((a) => ({
        session_id: session.id,
        player_id: a.playerId,
        slot: a.slot,
        is_reserve: a.isReserve,
      })),
    );
    if (attErr) throw new Error(attErr.message);
  }

  revalidatePath("/sessions");
  redirect(`/sessions/${session.id}`);
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const clean = title.trim();
  if (!clean) throw new Error("Título não pode ficar vazio");
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ title: clean })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
}

export async function updateSessionDate(sessionId: string, date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data inválida");
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ date })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
}

export async function createPlayerOnFly(name: string) {
  const supabase = await createClient();
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
  const { data, error } = await supabase
    .from("players")
    .insert({ name, slug, pending_review: true })
    .select("id,name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar jogador");
  return data;
}
