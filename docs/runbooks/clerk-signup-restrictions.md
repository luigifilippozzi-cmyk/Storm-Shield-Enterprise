# Runbook: Clerk Sign-Up Restrictions

**Status:** Active  
**Owner:** DM / Luigi  
**Related:** BUG-02 (SSE-070), CLAUDE.md §1 (Multi-tenant SaaS — invite-only)

---

## Overview

SSE is a B2B SaaS targeting body shops with 5–15 employees. Self-service sign-up is
disabled by design; new users join via admin invitation (RF-008, Fase 2). This runbook
documents both the code-level and dashboard-level configuration.

---

## Code-level gates (already deployed)

| Layer | File | What it does |
|---|---|---|
| Route | `apps/web/src/app/(auth)/register/page.tsx` | Returns HTTP 404 (Next.js `notFound()`) |
| Middleware | `apps/web/src/middleware.ts` | `/register` and `/sign-up` are not public routes — unauthenticated requests are redirected to login |
| UI | `apps/web/src/app/(auth)/login/page.tsx` | "Don't have an account? Sign up" link hidden via Clerk appearance (`footerAction__signUp: display:none`) |

These three layers are enforced automatically on every deploy. No manual action required.

---

## Clerk Dashboard configuration (manual — one-time)

> **Who:** Luigi (account owner)  
> **When:** Must be done once after the first staging/production deploy.

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → select the SSE application
2. Navigate to **User & Authentication → Restrictions**
3. Under **Sign-up mode**, select **Restricted**
4. Leave the allowlist empty — this means no one can self-register
5. Save

This prevents direct sign-up via Clerk's hosted pages and API even if the code-level
gates are bypassed.

---

## How new users are added (approved flows)

| Flow | Actor | Status |
|---|---|---|
| Tenant provisioning (CLI) | DM / Luigi via `pnpm --filter api tenant:create` | Active |
| Demo persona seed | DM via `pnpm --filter api seed:run --tenant=acme --type=personas` | Active (BUG-01a) |
| Admin invitation UI | Owner / Admin role in app | Planned — RF-008 (Fase 2) |

---

## Reverting (if needed)

If a production client depends on self-service sign-up before RF-008 ships:

1. Re-enable Clerk Dashboard → Sign-up mode = **Public**
2. In `apps/web/src/middleware.ts`, add back `/register(.*)` and `/sign-up(.*)` to `isPublicRoute`
3. Revert `apps/web/src/app/(auth)/register/page.tsx` to the SignUp component
4. Open a P0 task to prioritize RF-008

Document the reversal decision in a new ADR.

---

## Verification checklist

- [ ] `curl -I https://sse-web-staging.vercel.app/register` → 404
- [ ] Clerk Dashboard → Restrictions → Sign-up mode = Restricted
- [ ] Navigate to /login — no "Sign up" link visible
- [ ] Existing users can still log in normally
- [ ] Tenant provisioning via CLI still works
