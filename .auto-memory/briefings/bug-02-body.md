## Comportamento atual

Aplicação permite signup público — qualquer um acessa https://sse-web-staging.vercel.app/sign-up e cria conta via Clerk, gerando tenant órfão ou ingresso indevido.

## Comportamento esperado

Acesso só por convite. Rota `/sign-up` retorna 404. Clerk rejeita signup direto via API. Único fluxo de novo usuário é convite enviado por admin de tenant existente (RF-008).

## Como reproduzir

1. Navegar para https://sse-web-staging.vercel.app/sign-up
2. Formulário de cadastro aparece e aceita submissão

## Regra violada

Modelo SaaS B2B definido em CLAUDE.md §1 (Multi-tenant — cada empresa tem schema próprio). Bússola §1 (ICP = body shop médio com 5–15 funcionários) e anti-target (PDR solo não é cliente). Onboarding deve ser gerenciado por admin, não auto-serviço.

## Critério de aceite

- [ ] Acesso direto a `/sign-up` retorna 404 (rota deletada)
- [ ] Link Sign up removido da página de login
- [ ] Clerk Dashboard: Sign-up mode = Restricted (allowlist vazia)
- [ ] curl POST direto na API do Clerk para criar usuário sem token admin é rejeitado
- [ ] Tenants e usuários existentes continuam logando normalmente
- [ ] Documentado em `docs/runbooks/clerk-signup-restrictions.md` (criar)

## Escopo negativo

- NÃO bloquear login de usuários existentes
- NÃO modificar middleware/guards
- NÃO implementar invite system aqui (escopo RF-008)
- NÃO mexer no fluxo de criação de tenant via CLI/seed

## Condição de reversão

Se algum cliente real estiver dependendo de auto-signup (improvável), reabrir Sign-up=Public e priorizar RF-008 como bloqueante de Fase 2.

## Subagentes PR

security-reviewer (OBRIGATÓRIO — mudança de superfície de auth) + test-runner

## Origem

UAT Bug 02 (sessão PO 2026-05-01).
