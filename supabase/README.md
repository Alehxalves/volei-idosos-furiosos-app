# Supabase setup

> Verificado contra docs Supabase em maio/2026. Dashboard atual usa **Sign In / Up** flow com **publishable key** (`sb_publishable_...`) no lugar de `anon key` legado.

## Local dev (recomendado)

```
pnpm dlx supabase@latest init
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset    # roda migrations + seed
```

Pegue as keys do `supabase status` e copie pro `.env.local`. Email confirmation já vem **desabilitado** local — signup vira sessão na hora.

## Produção (Supabase Cloud)

1. **Crie projeto** em [supabase.com](https://supabase.com) → New project
2. **Roda schema** — SQL Editor:
   - cole `migrations/0001_init.sql` → Run
   - cole `migrations/0002_rls.sql` → Run
   - cole `seed.sql` → Run (opcional, 32 jogadores reais)
3. **Pegue as keys** — Project Settings → **API Keys**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `publishable key` (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role secret` (`sb_secret_...`) → `SUPABASE_SERVICE_ROLE_KEY`
   - Cola tudo no `.env.local` (espelha `.env.local.example`)
4. **Habilita Email + Password** — Authentication → **Sign In / Up** (antiga "Providers"):
   - "Email" provider toggle ON
   - "Allow new users to sign up" ON
   - "Confirm email" (default ON) — **desligue** se quiser signup→login na hora (recomendado p/ MVP). Mantenha ON se quiser email de verificação.
5. **URL Configuration** — Authentication → **URL Configuration**:
   - Site URL = `http://localhost:3000` (dev) ou domínio prod
   - Redirect URLs = `http://localhost:3000/**` + `https://SEU-DOMINIO/**`
   - Sem isso, signup com confirmation falha no clique do email
6. **(Opcional) Email Template p/ confirmation** — Authentication → **Email Templates** → "Confirm signup":
   - Substitua link por: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
   - App tem rota [/auth/confirm](../src/app/auth/confirm/route.ts) que chama `verifyOtp({type, token_hash})` (padrão atual SSR)
7. **Promova seu user a admin** — após primeiro signup, SQL Editor:
   ```sql
   update profiles set role = 'admin' where id = (
     select id from auth.users where email = 'alehxalves@gmail.com'
   );
   ```

## Notas
- **Rate limit email built-in**: SMTP padrão Supabase = 2 emails/hora (anti-abuse). P/ produção real, configure SMTP custom (SendGrid/Resend) em Authentication → SMTP Settings.
- **Magic link removido** do app — email+senha não tem rate limit.
- **Rotas auth no app**:
  - `/login` — tabs login/signup com email+senha
  - `/auth/confirm` — verifica token signup/recovery
  - `/auth/callback` — exchange code OAuth/PKCE (futuro: Google login)
