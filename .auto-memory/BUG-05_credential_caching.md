---
name: BUG-05 — Credential Caching Issue IPv6 (2026-05-12)
description: Dev Manager task - Root cause found by Neon Support Sam - credenciais erradas cacheadas para IPv6; bloqueando T-20260509-2 seed Acme
type: project
---

## BUG-05: Credential Caching Issue — IPv6 Connections Failing

**Prioridade:** P1 BLOCKER  
**Status:** PENDING (awaiting DM pickup)  
**Data de Abertura:** 2026-05-12 00:15 UTC  
**Root Cause Identificada por:** Neon Support (Sam)  

---

## Diagnóstico (Confirmado por Sam)

> "Mix de conexões bem-sucedidas e rejeições - todas as rejeições contra o MESMO endereço IPv6 - **credenciais erradas estão sendo cacheadas em algum lugar**"

**Conclusão:** Problema está NO CÓDIGO SSE, não na plataforma Neon.

---

## Impacto

- 🚫 **T-20260509-2 BLOQUEADO** (Seed Acme em staging)
- 🚫 **UAT testing inoperante** 40+ horas
- 🚫 **Feature delivery adiada**
- ⚠️ Credential security risk

---

## Investigação Obrigatória

### Priority 1:
- [ ] `TenantDatabaseService.ts` - como credenciais são gerenciadas?
- [ ] Connection Pool - há cache de credentials?
- [ ] Onde exactly credenciais erradas estão armazenadas?

### Priority 2:
- [ ] Environment variables - credenciais hardcodeadas?
- [ ] Redis cache - credenciais em cache?
- [ ] IPv6 vs IPv4 - há lógica diferente?

---

## Critério de Aceite (MUST HAVE)

- [ ] **CA1:** Localizar EXATAMENTE onde credenciais erradas estão cacheadas
- [ ] **CA2:** Seed script roda sem erros: `pnpm --filter api seed:run`
- [ ] **CA3:** psql CLI conecta sem erro
- [ ] **CA4:** NestJS API conecta ao banco sem erro
- [ ] **CA5:** Nenhuma rejeição SQLSTATE 28P01
- [ ] **CA6:** IPv6 funciona identicamente a IPv4

---

## Arquivo Completo

Detalhamento completo em: `BUG_CREDENTIAL_CACHING_IPV6.md`

---

## Próximos Passos

1. **DM pickup** este BUG-05
2. **Investigar** áreas listadas acima
3. **Fix** credential caching
4. **Test** com seed script
5. **Inform Neon** que problema foi resolvido
6. **Resume T-20260509-2** seed Acme

---

## Contexto

- Neon Project: fragrant-sea-98082526 (Free tier)
- Discord Thread: https://discord.com/channels/1176467419317940276/1503583811001385010
- Blocking Task: T-20260509-2 (Seed Acme em staging)
- Previous BUG: BUG-04 (escalação Neon - resolvido via diagnóstico)
