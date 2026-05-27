"use client";

import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, signUpWithPassword } from "./actions";

type Mode = "login" | "signup";

function AuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [pending, start] = useTransition();

  const handle = (formData: FormData) => {
    start(async () => {
      const fn = mode === "login" ? signInWithPassword : signUpWithPassword;
      const result = await fn(formData);
      if (result && !result.ok) toast.error(result.error);
      else if (result?.ok) toast.success(mode === "login" ? "Bem-vindo!" : "Conta criada!");
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass rounded-3xl shadow-2xl shadow-volleyball-blue/10 p-8 ring-1 ring-foreground/5">
        {/* Tabs */}
        <div className="relative grid grid-cols-2 gap-1 p-1 mb-7 rounded-full bg-muted/60">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="relative z-10 py-2 text-sm font-semibold rounded-full transition-colors"
              style={{ color: mode === m ? "white" : "var(--muted-foreground)" }}
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--color-volleyball-blue) 0%, var(--color-volleyball-orange) 130%)",
              left: mode === "login" ? "0.25rem" : "calc(50% + 0rem)",
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            action={handle}
            initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 12 : -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <Field label="Nome" icon={<User className="h-4 w-4" />}>
                <Input name="displayName" placeholder="Como te chamam na quadra" required />
              </Field>
            )}
            <Field label="Email" icon={<Mail className="h-4 w-4" />}>
              <Input name="email" type="email" placeholder="voce@email.com" autoComplete="email" required />
            </Field>
            <Field label="Senha" icon={<Lock className="h-4 w-4" />}>
              <Input
                name="password" type="password" minLength={6}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </Field>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-1">
              {mode === "login" ? "Sem conta? " : "Já tem conta? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-primary hover:underline"
              >
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </motion.form>
        </AnimatePresence>
      </div>

      <div className="text-center mt-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar pra home
        </Link>
      </div>
    </motion.div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
        {icon} {label}
      </Label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh flex flex-1 items-center justify-center px-4 py-12 bg-court-mesh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.18), transparent 35%), radial-gradient(circle at 85% 85%, rgba(249,115,22,0.18), transparent 40%)",
        }}
      />
      <Suspense fallback={null}><AuthCard /></Suspense>
    </main>
  );
}
