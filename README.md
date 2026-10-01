# RBAC management dashboard

Next.js/Supabase learning demo for members, protected roles, and assigned tasks. This repository is the maintained successor to `RBAC-Dashboard`.

## Security and setup

Use Node 22 or newer, copy `.env.example` to `.env.local`, install with `npm ci`, and run `npm run dev`. Configure a separate staging Supabase project before connecting real data.

Apply `supabase/migrations/202610010001_authorization.sql` in staging. It defines fresh tables, protected role/status records, RLS, immutable task identity, and least-privilege signup. On an existing database, inspect the actual schema and back up first: the migration replaces all policies on `member`, `permission`, and `task`. Never infer trusted roles from existing `user_metadata`. Bootstrap the first administrator with an explicit SQL update of its `permission` row through the trusted database console.

Each server action verifies Auth identity via `getUser` and reads authority from the protected `permission` row. Tasks use the caller-scoped client and RLS. Active admins/managers create and assign tasks; verified users update tasks they created or are assigned; newly registered and inactive users cannot mutate tasks. Only admins manage members and roles; account owners may update their own display name. Signup cannot choose a privileged role and respects the project's email confirmation settings. Enable Supabase signup rate limits/CAPTCHA as appropriate for a public deployment.

The service-role key is server-only and used solely for authenticated admin Auth operations. It must never appear in public environment variables. Roles and request identities are not kept in a global server store.

## Validation

`npm test` exercises anonymous/inactive/ordinary/staff boundaries and shipped task actions, including creator spoofing and forged user metadata. `npm run typecheck`, `npm run lint`, and `npm run build` validate the application. Database policy assertions are in `supabase/tests/authorization.sql`; run them against a disposable migrated database. CI uses placeholder configuration and does not certify a live deployment. Apply migrations and test staged Auth/RLS before deployment.

## Local workflow

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

The test suite runs the committed migration and SQL denial assertions in disposable PostgreSQL through PGlite, alongside action and identity tests. Supabase Auth/cookie integration still requires staging verification.

`app/dashboard/members/actions` handles admin account/role operations; `app/dashboard/tasks/actions` handles assigned tasks. `lib/actor.ts` supplies request identity and protected roles, and `lib/authorization.ts` defines action rules and input schemas. `proxy.ts` refreshes Auth cookies. The UI uses Shadcn/Radix components.

The earlier hosted demo may run an older revision. Source validation here does not certify its deployment or database policies. This remains a learning project, not a security-audited product.
