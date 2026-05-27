"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";

export function Landing({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <main className="min-h-dvh bg-court-mesh relative overflow-hidden">
      <FloatingBalls />
      <Header isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <Footer />
    </main>
  );
}

function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="relative z-10">
      <div className="container mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 font-bold"
        >
          <Volleyball size={28} spin />
          <span className="tracking-tight">
            IDOSOS <span className="text-accent">&</span> FURIOSOS
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1"
        >
          {isLoggedIn ? (
            <>
              <Link
                href="/sessions"
                className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
              >
                Entrar <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "rounded-full",
                  )}
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              Entrar
            </Link>
          )}
        </motion.div>
      </div>
    </header>
  );
}

function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="container mx-auto max-w-3xl px-4 pt-20 pb-12 md:pt-32 md:pb-20 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        Sem treta. Sem mimimi.
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none"
      >
        Quem joga{" "}
        <motion.span
          initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 180 }}
          className="inline-block bg-volleyball-gradient bg-clip-text text-transparent"
        >
          com quem
        </motion.span>
        ?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
      >
        Acabou a discussão! A gente sorteia, vocês jogam, ninguém chora.{" "}
        <span className="whitespace-nowrap">(Tá, talvez um pouco.)</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-wrap gap-3 justify-center"
      >
        <Link
          href={isLoggedIn ? "/sessions" : "/login"}
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full px-8 text-base shadow-lg shadow-primary/30",
          )}
        >
          {isLoggedIn ? "Bora pro racha" : "Entrar na quadra"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
      >
        {[
          { emoji: "📋", label: "Cola a lista" },
          { emoji: "🎲", label: "Sorteia" },
          { emoji: "🏐", label: "Joga" },
          { emoji: "🏆", label: "Reclama do juiz" },
        ].map((s, i) => (
          <motion.span
            key={s.label}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            whileHover={{ y: -3 }}
            className="inline-flex items-center gap-2"
          >
            <span className="text-xl">{s.emoji}</span> {s.label}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}

function FloatingBalls() {
  const balls = [
    { left: "8%", top: "20%", size: 60, delay: 0, dur: 7 },
    { left: "85%", top: "15%", size: 40, delay: 1.2, dur: 9 },
    { left: "78%", top: "70%", size: 80, delay: 0.5, dur: 8 },
    { left: "12%", top: "75%", size: 50, delay: 2, dur: 10 },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {balls.map((b, i) => (
        <motion.div
          key={i}
          className="absolute opacity-[0.08]"
          style={{ left: b.left, top: b.top }}
          animate={{ y: [0, -22, 0], rotate: [0, 360] }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            delay: b.delay,
            ease: "easeInOut",
          }}
        >
          <Volleyball size={b.size} />
        </motion.div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-auto">
      <div className="container mx-auto max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground">
        Feito com 🏐 e um pouco de raiva · {new Date().getFullYear()}
      </div>
    </footer>
  );
}

export function Volleyball({
  size = 32,
  spin = false,
}: {
  size?: number;
  spin?: boolean;
}) {
  return (
    <motion.div
      whileHover={spin ? { rotate: 360 } : undefined}
      transition={{ duration: 0.6 }}
      className="grid place-items-center rounded-full shadow-md"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #2563EB 0%, #F97316 100%)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.65}
        height={size * 0.65}
        fill="none"
        stroke="white"
        strokeWidth="2.2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 12c5-2 13-2 17 0" />
        <path d="M12 3c-2 5-2 13 0 18" />
        <path d="M5 7c4 1 10 7 14 11" />
      </svg>
    </motion.div>
  );
}
