# BUG-05 — Credential Caching Issue: IPv6 Connections Failing with Incorrect Credentials

## Bug Summary
**Título:** Neon Database: Incorrect Credentials Being Cached for IPv6 Connections  
**Módulo:** `TenantDatabaseService`, Connection Pool Management  
**Prioridade:** P1 (BLOCKER)  
**Status:** OPEN  
**Reportado por:** Neon Support (Sam)  
**Data:** 2026-05-12

---

## The Problem

### Comportamento Atual:
- Mix de conexões bem-sucedidas e rejeições
- **Todas as rejeições contra o MESMO endereço IPv6**
- SQLSTATE 28P01 (password authentication failed)
- Credenciais corretas funcionam em Neon Console SQL Editor
- Credenciais **erradas estão sendo cacheadas** em algum lugar do código

### Comportamento Esperado:
- Todas as conexões devem usar credenciais corretas
- IPv4 e IPv6 devem funcionar identicamente
- Nenhum cache de credentials incorretas
- Conexão consistente sem rejeições

---

## Root Cause Analysis

**Diagnóstico Neon (confirmado):**
> "Mix de conexões bem-sucedidas e rejeições - todas as rejeições contra o MESMO endereço IPv6 - credenciais erradas estão sendo cacheadas em algum lugar"

**Implicação:**
- Problema está NO CÓDIGO SSE, não na plataforma Neon
- Um componente está armazenando/reutilizando credenciais incorretas
- Afeta especificamente conexões IPv6

---

## Como Reproduzir

### Passo 1: Setup
```bash
cd C:\Dev\storm-shield-enterprise
pnpm install
pnpm --filter api dev
```

### Passo 2: Tentar conectar ao banco Neon (projeto: fragrant-sea-98082526)
```bash
# Via Node.js pg driver
pnpm --filter api seed:run

# Via psql CLI
psql "postgresql://neondb_owner:npg_Tnv96ortDNpS@ep-shiny-moon-amaw1omz-c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Via NestJS API
curl http://localhost:3000/customers
```

### Passo 3: Observar erro
```
Error: password authentication failed for user 'neondb_owner' (SQLSTATE 28P01)
```

### Passo 4: Verificar logs
- Logs da aplicação mostram credenciais sendo usadas incorretamente
- Mix de sucesso/falha indica cache inconsistente

---

## Regra Violada
- **Princípio de Isolamento Multi-tenant:** Credenciais não devem ser cacheadas incorretamente
- **Princípio de Segurança:** Credenciais erradas em cache é risco de segurança

---

## Áreas de Investigação Obrigatória

### 1. **TenantDatabaseService** 🔴 PRIORITÁRIO
**Arquivo:** `apps/api/src/database/tenant-database.service.ts`
- [ ] Como credenciais são passadas ao Knex?
- [ ] Há cache de connection strings?
- [ ] Como `search_path` é setado?
- [ ] Há hardcoding de IPs/passwords?

### 2. **Connection Pool Management**
**Arquivos a revisar:**
- `apps/api/src/config/database.config.ts`
- Qualquer lugar que use `KNEX_CONNECTION` ou `KNEX_ADMIN_CONNECTION`
- [ ] Connection pool está cacheando credentials?
- [ ] Pool reusa conexões com credenciais antigas?

### 3. **Environment Variables & .env Handling**
- [ ] `.env` tem credenciais hardcodeadas?
- [ ] Variáveis de ambiente estão sendo lidas corretamente?
- [ ] Há cache de `process.env` em algum lugar?

### 4. **Redis Cache (se aplicável)**
- [ ] Redis está cacheando connection strings?
- [ ] Há TTL incorreto em cache de credentials?
- [ ] Session data contém credentials?

### 5. **IPv6 vs IPv4 Handling**
- [ ] Há lógica especial para IPv6?
- [ ] Connection string é construída diferente para IPv6?
- [ ] Host resolution diferencia IPv4/IPv6?

---

## Critério de Aceite

- [ ] **CA1:** Identificar EXATAMENTE onde credenciais incorretas estão sendo cacheadas
- [ ] **CA2:** Credenciais corretas são usadas para TODAS as conexões (IPv4 e IPv6)
- [ ] **CA3:** Nenhuma rejeição SQLSTATE 28P01 em conexões Neon
- [ ] **CA4:** Seed script roda sem erros: `pnpm --filter api seed:run`
- [ ] **CA5:** psql CLI conecta sem erro: `psql "postgresql://neondb_owner:...@..."`
- [ ] **CA6:** NestJS API conecta ao banco sem erro: `curl http://localhost:3000/customers`
- [ ] **CA7:** 100% testes passando em connection layer (se existirem)
- [ ] **CA8:** IPv6 funciona identicamente a IPv4 (nenhuma diferença de comportamento)

---

## Escopo Negativo

❌ **O que NÃO fazer neste fix:**
- Não mudar Neon project settings
- Não resetar Neon database password (já foi feito 5+ vezes)
- Não mexer em RLS policies
- Não alterar schema per tenant isolation
- Não criar workarounds - resolver o root cause
- Não esconder o erro em try/catch

---

## Impacto

### Business Impact:
- 🚫 **UAT testing BLOQUEADO** 40+ horas
- 🚫 **Seed data NÃO pode ser criado**
- 🚫 **Staging API completamente inoperante**
- 🚫 **Feature delivery adiada indefinidamente**

### Technical Impact:
- Cross-tenant data integrity at risk
- Credential exposure risk
- Production readiness compromised

---

## Próximos Passos para DM

### Phase 1: Investigation (Today)
```
1. Ler este BUG-05 completamente
2. Revisar TenantDatabaseService.ts
3. Search codebase para: "npg_", "password", "credential", "cache"
4. Listar todos os lugares onde connection strings são construídas/armazenadas
5. Gerar relatório de achados
```

### Phase 2: Root Cause (Today/Tomorrow)
```
1. Localizar EXATAMENTE onde credenciais erradas estão
2. Entender por quê IPv6 especificamente é afetado
3. Verificar se há credential leakage em logs/monitoring
```

### Phase 3: Fix (Tomorrow)
```
1. Remover/corrigir credential cache
2. Garantir credenciais frescas para cada conexão
3. Testar IPv4 e IPv6 identicamente
```

### Phase 4: Verification (Tomorrow)
```
1. Rodar seed script → sucesso
2. Rodar psql CLI → sucesso
3. Rodar API tests → sucesso
4. Informar Neon que problema foi resolvido
```

---

## Communication with Neon

**Quando merged/resolvido:**
- Enviar DM a Sam confirmando fix
- Reabrir seed process
- Pedir confirmação se problema está resolvido

---

## References

- **Discord Thread:** https://discord.com/channels/1176467419317940276/1503583811001385010
- **Sam's Diagnosis:** "Mix de conexões e rejeições contra MESMO IPv6 - credenciais erradas cacheadas"
- **Neon Project:** fragrant-sea-98082526 (Free tier)
- **Timeline:** Problema persistindo 40+ horas (desde 2026-05-09 17:00)

---

## Task Metadata

- **Assignee:** Dev Manager
- **Subagentes recomendados:** 
  - security-reviewer (credential handling)
  - test-runner (connection tests)
  - db-reviewer (if migrations needed)
- **Estimated Effort:** 2-4 horas
- **Blocking:** T-20260509-2 (Seed Acme em staging)
