"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/sessions", label: "Rachas" },
  { href: "/players", label: "Jogadores" },
];

interface AdminNavProps {
  email: string;
}

export function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label }, i) => {
        const active = pathname.startsWith(href);
        return (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.08 + i * 0.08 }}
          >
            <Link
              href={href}
              className={[
                "relative text-sm font-medium transition-colors duration-150",
                "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-accent after:rounded-full after:transition-all after:duration-200",
                active
                  ? "text-foreground after:w-full"
                  : "text-muted-foreground after:w-0 hover:text-foreground hover:after:w-full",
              ].join(" ")}
            >
              {label}
            </Link>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.24 }}
        className="ml-auto flex items-center gap-4"
      >
        <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[180px]">
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
          >
            Sair
          </button>
        </form>
      </motion.div>
    </>
  );
}
