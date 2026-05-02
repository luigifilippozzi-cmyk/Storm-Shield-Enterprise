# Runbook — Super User Break-Glass (Regra 0 / ADR-017)

> **Audiência:** Platform Operator (Luigi) + qualquer engenheiro designado como backup.
> **Pré-requisito:** MFA ativo no Clerk para a conta `SUPER_USER_EMAIL`.

---

## 1. Visão Geral

O SSE tem exatamente **1 super user primário** identificado pelo env var `SUPER_USER_EMAIL`.
Um super user **backup dormente** pode ser ativado em emergência via `SUPER_USER_BACKUP_ACTIVE=true`.
Primário e backup NUNCA coexistem ativos simultaneamente.

O super user acessa `/app/platform-admin` para:
- Listar todos os tenants cross-tenant
- Provisionar o primeiro `owner`/`admin` de um tenant novo

Toda ação é registrada em `audit_logs` com `is_super_user_action=true`.

---

## 2. Verificar Super User Audit Log (CA4)

Para confirmar que uma ação do super user foi registrada:

```sql
-- Executar no DB admin (sse_user ou conexão direta)
-- Substituir <schema_name> pelo schema do tenant afetado
SELECT id, action, resource_type, resource_id, is_super_user_action, target_tenant_id, created_at
FROM "<schema_name>".audit_logs
WHERE is_super_user_action = TRUE
ORDER BY created_at DESC
LIMIT 20;
```

Via KNEX_ADMIN_CONNECTION no app (não precisa de sse_user):
```typescript
const logs = await knex.raw(
  `SELECT * FROM "${schemaName}".audit_logs WHERE is_super_user_action = TRUE ORDER BY created_at DESC LIMIT 20`
);
```

---

## 3. Ativar Backup Super User (Break-Glass)

**Contexto:** O super user primário ficou inacessível (senha perdida, conta comprometida, emergência).

### Passo 1 — Preparar
- Confirme que `SUPER_USER_BACKUP_EMAIL` está configurado com um email válido
- Verifique que a conta de backup tem MFA ativo no Clerk
- Documente o motivo da ativação (incident ticket, timestamp)

### Passo 2 — Mudar env e fazer deploy
```bash
# No Fly.io (staging)
fly secrets set SUPER_USER_BACKUP_ACTIVE=true --app sse-api-staging
fly secrets set SUPER_USER_BACKUP_ACTIVE=true --app sse-api-production

# No Vercel (frontend) — se necessário para variável pública
vercel env add SUPER_USER_BACKUP_ACTIVE production
```

### Passo 3 — Verificar
Após deploy, logar com `SUPER_USER_BACKUP_EMAIL` em `/app/platform-admin` deve funcionar.
Logar com `SUPER_USER_EMAIL` também funcionará até que o env var primário seja removido.

**ATENÇÃO:** Enquanto `SUPER_USER_BACKUP_ACTIVE=true`, AMBOS os emails têm acesso super user.
Remova o acesso do comprometido **imediatamente** após ativação do backup:
```bash
fly secrets set SUPER_USER_EMAIL=DISABLED --app sse-api-staging
fly secrets set SUPER_USER_EMAIL=DISABLED --app sse-api-production
```

### Passo 4 — Registrar no audit log
Após a operação de break-glass, registre manualmente no banco:
```sql
INSERT INTO "<schema_name>".audit_logs
  (id, tenant_id, user_id, action, resource_type, is_super_user_action, target_tenant_id, created_at)
VALUES
  (gen_random_uuid(), '<any-tenant-id>', NULL, 'BREAK_GLASS_ACTIVATED', 'platform',
   TRUE, '<any-tenant-id>', NOW());
```

### Passo 5 — Recuperar e restaurar primário
1. Faça os recovery codes do Clerk (armazenados offline)
2. Redefina a senha/MFA do email primário via Clerk Dashboard
3. Restaure `SUPER_USER_EMAIL` ao valor correto via `fly secrets set`
4. Restaure `SUPER_USER_BACKUP_ACTIVE=false`
5. Deploy novo para confirmar

---

## 4. Testar em Staging (CA7)

```bash
# 1. Configurar backup em staging
fly secrets set SUPER_USER_BACKUP_ACTIVE=true --app sse-api-staging
fly secrets set SUPER_USER_BACKUP_EMAIL=your-backup@example.com --app sse-api-staging

# 2. Fazer deploy
fly deploy --app sse-api-staging

# 3. Logar com backup email em https://sse-web-staging.vercel.app/app/platform-admin
# Confirmar que a página carrega e lista tenants

# 4. Verificar audit log no DB staging
# (use a consulta SQL da seção 2)

# 5. Restaurar
fly secrets set SUPER_USER_BACKUP_ACTIVE=false --app sse-api-staging
```

---

## 5. Checklist de Recovery Codes

- [ ] Recovery codes do Clerk armazenados em password manager offline
- [ ] `SUPER_USER_BACKUP_EMAIL` configurado em todos os envs (staging + production)
- [ ] Conta de backup tem MFA ativo no Clerk
- [ ] Este runbook foi testado end-to-end em staging (CA7)

---

*Última revisão: 2026-05-02 — DM Agent (SSE-Regra0)*
