"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Credentials = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
  displayName: z.string().min(1).max(60).optional(),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };

  redirect("/sessions");
}

export async function signUpWithPassword(formData: FormData): Promise<AuthResult> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName ?? parsed.data.email.split("@")[0] },
    },
  });
  if (error) return { ok: false, error: error.message };

  // Tenta logar imediatamente (se Confirm Email estiver off no Supabase)
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInErr) {
    return { ok: false, error: "Cadastro feito. Confirme seu email pra entrar." };
  }
  redirect("/sessions");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
