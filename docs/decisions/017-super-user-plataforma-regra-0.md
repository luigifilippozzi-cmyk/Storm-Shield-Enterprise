# ADR-017 — Super User Único de Plataforma (Regra 0)

Status: Accepted (2026-05-01)
Slot: 017 (após ADR-016 Bússola v1.3; ADR-015 reservado p/ release cadence; independente)

## Contexto
SSE é SaaS multi-tenant com 3 camadas de isolamento (schema-per-tenant + RLS + dual DB users).
Operações de governança (provisionar admin de novo tenant, suporte, audit cross-tenant) hoje
exigem acesso direto ao DB com `sse_user` — sem trilha de UI nem audit log estruturado.
Bússola §2.5 (ADR-016) já formalizou a persona Platform Operator; este ADR materializa
a infraestrutura de identidade + bypass + audit.

## Opções
| # | Opção | Trade-off |
|---|---|---|
| 1 | **Super user único via env var + break-glass dormente (escolhida)** | Simples, surface mínima, audit_log claro; SPOF mitigado por backup + MFA |
| 2 | Super user híbrido (env + flag DB + Clerk role) | Defesa em profundidade; 3 fontes de verdade = 3 surfaces para drift/erro |
| 3 | Sem super user — provisioning sempre via script `sse_user` | Zero exceção arquitetural; opera fora da app, sem UI, sem audit nativo |
| 4 | Múltiplos super users hierárquicos | Flexibilidade futura; prematuro; sobrepõe ao RBAC existente |

## Decisão
Opção 1 — env var + break-glass dormente.

## Justificativa
Simplicidade vence flexibilidade nesta fase. Surface mínima, auditável, alinhada com a filosofia
"uma pessoa = uma decisão" do Operating Model v2 e com a §2.5 da Bússola (não pluraliza neste estágio).
Backup dormente cobre bus-factor sem multiplicar superfície de ataque.

## Condição de reversão
Reabrir este ADR se:
- Surgir co-fundador / COO / Platform Support Engineer com necessidade de cascade view permanente
  (Bússola §2.5 prevê este gatilho — revisar §2.5 e ADR-017 juntos)
- Compliance (SOC2, equivalente) exigir aprovação multi-pessoa para provisioning
- SSE ultrapassar 100 tenants ativos e provisioning manual virar gargalo
- Incidente de segurança envolvendo a conta super user

## Consequências
+ Governança auditável via UI; provisioning sai do SQL manual
+ Audit log estruturado (`is_super_user_action=true`) para suporte/compliance futuro
+ MFA obrigatório no Clerk + recovery codes offline + backup dormente + sse_user via DB = 4 linhas de defesa
- Exceção formal ao tenant isolation (mitigada por SuperUserContext per-request + audit obrigatório)
- Conta única é alvo de alto valor (mitigada conforme acima)
- Migration 018 adiciona colunas a audit_logs (idempotente, não-breaking)

## Atualizações decorrentes
- Migration nova: `018_super_user_audit_flag.sql`
- `.env.example`: adicionado `SUPER_USER_EMAIL`, `SUPER_USER_BACKUP_EMAIL`, `SUPER_USER_BACKUP_ACTIVE`
- `apps/api/src/common/services/super-user.service.ts`: novo service
- `apps/api/src/common/guards/super-user.guard.ts`: novo guard
- `apps/web/src/app/(dashboard)/platform-admin/page.tsx`: nova área restrita
- `docs/runbooks/super-user-break-glass.md`: NOVO
- Bússola §2.5 (ADR-016) referenciada como persona primária na descrição do PR
- CLAUDE.md regra 16 satisfeita (PR cita §2.5 + gap)
