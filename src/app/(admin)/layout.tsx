import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLogo } from "./AdminLogo";
import Link from "next/link";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="container mx-auto max-w-xl py-16 px-4 text-center space-y-3">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="text-muted-foreground">
          Sua conta ({user.email}) não tem permissão de admin. Peça liberação a
          um organizador.
        </p>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <nav className="container mx-auto max-w-6xl px-4 py-3 flex items-center gap-6 text-sm">
          <Link href="/">
            <AdminLogo />
          </Link>
          <AdminNav email={user.email!} />
        </nav>
      </header>
      {children}
    </>
  );
}
