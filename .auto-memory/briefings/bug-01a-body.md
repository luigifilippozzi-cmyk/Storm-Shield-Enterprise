## Comportamento atual

Login das 7 personas Acme do plano de testes (SSE TOUR COMPLETO TESTES PO.docx) falha — Clerk responde user not found. Tabela `tenant_acme.users` provavelmente vazia ou só com 1 owner de provisioning.

Personas afetadas:

- owner@acme.sse-demo.test (John O'Connor)
- admin@acme.sse-demo.test (Maria Santos)
- manager@acme.sse-demo.test (David Kim)
- estimator@acme.sse-demo.test (Sarah Johnson)
- tech@acme.sse-demo.test (Carlos Mendez)
- accountant@acme.sse-demo.test (Linda Foster)
- viewer@acme.sse-demo.test (Robert Taylor)

Senha (todos): `DemoPass!2026`

## Comportamento esperado

As 7 personas logam em staging e cada uma vê a UI conforme sua role (RBAC). publicMetadata do Clerk traz tenantId Acme + role correta.

## Como reproduzir

1. https://sse-web-staging.vercel.app/sign-in
2. Email: owner@acme.sse-demo.test | Senha: DemoPass!2026
3. Erro Clerk

## Pré-fix obrigatório (DM rodar antes de codar)

1. `clerkClient.users.getUserList({ emailAddress: [...] })` → confirmar 0 results
2. Como `sse_user`: `SELECT email, role FROM tenant_acme.users;` → vazio ou 1
3. `SELECT id, slug, status FROM public.tenants WHERE slug = 'acme';` → tenant existe e status='active'

Se (3) falhar: bug é em `tenant-provisioning.ts`, não em seed — escalar P0 com db-reviewer.

## Critério de aceite

- [ ] Login das 7 emails + senha DemoPass!2026 funciona em staging
- [ ] Cada persona vê telas conforme RBAC
- [ ] publicMetadata Clerk traz tenantId + role
- [ ] Idempotência: rodar seed 2x não duplica nem reseta senha de existentes
- [ ] Documentado em `docs/runbooks/tenant-provisioning.md`

## Escopo negativo

- NÃO criar usuários em outros tenants
- NÃO alterar migrations ou schema
- NÃO modificar fluxo de auth/Clerk middleware
- NÃO implementar invite system (escopo RF-008)

## Subagentes PR

test-runner + security-reviewer (Clerk publicMetadata + RBAC + RLS)

## Origem

UAT Bug 01 (sessão PO 2026-05-01) — bloqueia tour completo de testes.
