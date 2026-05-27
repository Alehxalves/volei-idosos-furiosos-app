"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { PlayerRole } from "@/lib/supabase/types";

const ROLES = ["levantador", "passador", "atacante", "defensor"] as const;

const PlayerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  stars: z.number().int().min(1).max(5),
  roles: z.array(z.enum(ROLES)),
  active: z.boolean().default(true),
});

export type PlayerInput = z.infer<typeof PlayerSchema>;

export async function upsertPlayer(input: PlayerInput) {
  const parsed = PlayerSchema.parse(input);
  const supabase = await createClient();
  const slug = slugify(parsed.name);

  const { error } = await supabase.from("players").upsert({
    id: parsed.id,
    name: parsed.name,
    slug,
    stars: parsed.stars,
    roles: parsed.roles as PlayerRole[],
    active: parsed.active,
    pending_review: false,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/players");
}

export async function deletePlayer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
}

export async function togglePlayerActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
}
