---
name: PO Sessions Log
description: Registro datado de sessões do Product Owner — decisões estratégicas, artefatos produzidos, handoffs ao DM
type: project
---
> **Nota:** "NS" = ERP de referência externo. Nome substituído por precaução (ADR-014).


# PO Sessions — Storm Shield Enterprise

> Log mantido pelo PO Assistant (modo Cowork). Complementar ao `project_sse_status.md` (mantido pelo PM Agent).

---

## Sessão 2026-04-22 (parte 2) — PO Cowork (Trademark hygiene — substituição de marca de ERP externo por sigla NS)

**Contexto:** Luigi abriu a sessão para escopar a substituição de menções diretas à marca registrada de um ERP proprietário usado como referência comparativa na documentação do SSE. Motivação: reduzir exposição jurídica — o SSE não tem relação comercial, licenciamento nem endosso do fornecedor; o uso nominativo em repo versionado cria risco latente.

### Decisões de produto

1. **Estratégia de substituição: disclaimer + sigla NS.** Disclaimer canônico padronizado no topo de cada doc impactado + substituição textual uniforme. Rejeitada a substituição literal pura (sigla ambígua sem contexto) e a opção "NS-REF" (quebra fluidez). **Condição de reversão:** ADR suplementar se (a) parecer jurídico posterior indicar risco residual, (b) sigla "NS" gerar confusão interna, (c) mudança de relação com o fornecedor.
2. **Renames com stubs de 60 dias** (até 2026-06-22) para os 3 arquivos cujos nomes contêm a marca: 2 em `docs/strategy/` (ANALISE_*_vs_BUSSOLA_v1.{md,html}) e 1 em `docs/decisions/` (012-*-incorporacao-parcial.md). Rejeitados: rename sem stub (quebra bookmarks externos sem aviso) e "manter filename com conteúdo trocado" (inconsistência visível).
3. **Escopo GitHub: abrangente.** Editar título + corpo de issues e PRs em todos os estados (abertos, fechados, mergeados) via `gh api PATCH`. **NÃO editar** comentários nem reviews (escopo negativo honrado). **NÃO reescrever** commits históricos (violaria regra 1 do CLAUDE.md). Rejeitada a opção conservadora (só arquivos versionados) — exposição no GitHub seria residual inaceitável.
4. **Executar sem aguardar parecer jurídico.** Mitigação precautória, reversível, não bloqueia trabalho estratégico. ADR-014 documenta a decisão e os critérios de reversão.

### Artefatos produzidos

- **T-20260422-1** (P2, PENDING) registrada em `.auto-memory/dm_queue.md` — corpo canônico com 19 arquivos listados, escopo negativo explícito, critérios de aceite, dependência invertida com T-20260421-1 (sync dashboard aguarda renames).
- **Rascunho ADR-014** em `.auto-memory/proposals/adr_014_draft.md` — decisão, disclaimer canônico, política de referência a produtos de terceiros, condição de reversão. DM publica em `docs/decisions/014-remocao-mencao-marca-erp-referencia.md` durante o PR.
- **3 snippets PowerShell canônicos** (discovery → execution → verify) para o sweep do GitHub via `gh api`. Preservados aqui abaixo para uso do DM.

### Snippets canônicos — Sweep GitHub (para DM)

```powershell
# ===== ETAPA 1 — DISCOVERY (dry-run, só lista) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
$out = ".auto-memory\sweeps\trademark-sweep-discovery-$data.csv"
New-Item -ItemType Directory -Force -Path ".auto-memory\sweeps" | Out-Null

$issues = gh issue list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,body,state,url,isPullRequest | ConvertFrom-Json
$prs = gh pr list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,body,state,url | ConvertFrom-Json
$issuesOnly = $issues | Where-Object { -not $_.isPullRequest }

$all = @()
$all += $issuesOnly | ForEach-Object {
  [PSCustomObject]@{ Type="issue"; Number=$_.number; State=$_.state; Title=$_.title; URL=$_.url }
}
$all += $prs | ForEach-Object {
  [PSCustomObject]@{ Type="pr"; Number=$_.number; State=$_.state; Title=$_.title; URL=$_.url }
}
$all | Export-Csv -Path $out -NoTypeInformation -Encoding UTF8
$all | Format-Table Type,Number,State,Title -AutoSize
Write-Host "CSV: $out — REVISAR antes de Etapa 2"

# ===== ETAPA 2 — EXECUÇÃO (aplica substituição via gh api) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
$discovery = Get-ChildItem ".auto-memory\sweeps\trademark-sweep-discovery-*.csv" `
  | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $discovery) { throw "Rode a Etapa 1 antes." }
$items = Import-Csv $discovery.FullName
$log = ".auto-memory\sweeps\trademark-sweep-exec-$data.log"
Add-Content $log "=== Sweep execução $data ==="
$repo = "luigifilippozzi-cmyk/Storm-Shield-Enterprise"
$owner, $name = $repo -split "/"

function Replace-Mark {
  param([string]$text)
  if (-not $text) { return $text }
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  return $text
}

foreach ($item in $items) {
  $num = $item.Number; $type = $item.Type
  if ($type -eq "issue") {
    $current = gh issue view $num --repo $repo --json title,body | ConvertFrom-Json
  } else {
    $current = gh pr view $num --repo $repo --json title,body | ConvertFrom-Json
  }
  $newTitle = Replace-Mark $current.title
  $newBody  = Replace-Mark $current.body
  $titleChanged = ($newTitle -ne $current.title)
  $bodyChanged  = ($newBody  -ne $current.body)
  if (-not ($titleChanged -or $bodyChanged)) {
    Add-Content $log "[$type #$num] NO-OP"; continue
  }
  $endpoint = if ($type -eq "issue") { "repos/$owner/$name/issues/$num" } `
              else { "repos/$owner/$name/pulls/$num" }
  $payload = @{}
  if ($titleChanged) { $payload.title = $newTitle }
  if ($bodyChanged)  { $payload.body  = $newBody  }
  ($payload | ConvertTo-Json -Compress) | gh api --method PATCH $endpoint --input - | Out-Null
  Add-Content $log "[$type #$num] UPDATED — title:$titleChanged body:$bodyChanged"
  Write-Host "✓ $type #$num"
}
Write-Host "Log: $log"

# ===== ETAPA 3 — VERIFY (lê de volta) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$residual = @()
$residual += (gh issue list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,state,url,isPullRequest | ConvertFrom-Json `
  | Where-Object { -not $_.isPullRequest })
$residual += (gh pr list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,state,url | ConvertFrom-Json)
if ($residual.Count -eq 0) {
  Write-Host "✓ GitHub limpo" -ForegroundColor Green
} else {
  Write-Host "⚠ $($residual.Count) residuais:" -ForegroundColor Yellow
  $residual | Select-Object number,title,state,url | Format-Table -AutoSize
}
```

### Task list do acompanhamento (Cowork)

9 tasks criadas, dependências configuradas:
- #1 → #2 → #3 (PO): registro da tarefa, rascunho ADR-014, log da sessão — **concluídas nesta sessão**
- #4 (Luigi): despachar ao PM/DM
- #5 (DM): executar substituições + renames + stubs + publicar ADR-014
- #6 (DM): rodar sweep GitHub (3 etapas)
- #7 (DM): abrir PR + CI verde + mergear
- #8 (PO): revisar PR
- #9 (PO): atualizar MEMORY.md pós-merge + arquivar T-20260422-1

### Alinhamento Bússola

N/A — mudança de compliance/hygiene, não afeta personas, ICP ou métrica-norte. O ADR-014 é o veículo formal da decisão.

### Próxima sessão

Aguardar despacho de Luigi ao PM/DM. Próximo checkpoint: revisão do PR do DM (task #8). Sem dependência de Bússola ou de T-20260421-10 (independente do deploy API).

---

## Sessão 2026-04-22 — PO Cowork (Split RF-005 XL ratificado — Split A)

**Contexto:** Luigi abriu a sessão para validar o split do RF-005 antes do DM abrir branch (T-20260421-3 estava PENDING com complexidade XL e recomendação explícita de split no próprio spec). Luigi pediu análise comparativa e ratificou a recomendação do PO.

### Decisões de produto

1. **Split A ratificado** para RF-005 (Estimate State Machine + Inbox):
   - **RF-005a** (backend state machine + ENUM + migration 014 + validator + estimate_status_changes) — T-20260421-3a, P1, PENDING
   - **RF-005b** (frontend tabela + filtros + ownership + estimate-status-badge) — T-20260421-3b, P1, BLOCKED by 3a
   - **RF-005c** (frontend kanban drag-drop + SLA jobs) — T-20260421-3c, P1, BLOCKED by 3a (soft-dep em 3b)
   - **Split B rejeitado** (tabela+kanban bundled): perderia ship incremental do tabela antes do kanban; drag-drop é maior fonte de incerteza técnica e não deve bloquear o uso da tabela.
   - **Condição de reversão:** se após 3a + 3b em staging o Estimator (via ritual Operating Model §5.4) indicar que kanban não agrega valor frente ao esforço, canibalizar 3c — entregar só SLA como ENH, rebater kanban como ENH P2.

2. **RF-006 (T-20260421-4) — dependência reduzida.** Estava BLOCKED por T-20260421-3 inteiro. Agora BLOCKED **apenas** por T-20260421-3a (o estado `disputed` do ENUM basta para o Payment Hold escutar eventos). Ganho de calendário: 3b e 3c podem rodar em paralelo com RF-006.

3. **T-20260421-3 original marcada SUPERSEDED** em `dm_queue.md` com nota histórica apontando para os três sub-RFs.

4. **RF-005 no `RF_BACKLOG.md`** anotado com tabela de split + referência à task DM de cada parte + condição de reversão. RF-005 só fecha DONE quando 3c mergear (último sub-RF do split).

### Alinhamento Bússola

- Persona tocada: Estimator (primária) — Bússola §2. RN5 de ownership é princípio P5 (insurance-first) + princípio P1 (simplificar > completar) — separar em 3 PRs é simplificação, não complexificação.
- Gap fechado: Gap 5 (Insurance workflow) — Bússola §4.
- Regras CLAUDE.md §10: Regra 16 (persona+gap) já está obrigatória nos 3 PRs via `Done quando`; Regra 17 (handoff canônico §4) respeitada — tasks seguem template; Regra 19 (PV/PUX via frontend-reviewer) obrigatória em 3b e 3c.

### Artefatos produzidos

| Artefato | Arquivo | Mudança |
|---|---|---|
| Task T-20260421-3 superseded | `.auto-memory/dm_queue.md` | Bloco substituído por nota histórica curta |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3a (backend state machine) |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3b (frontend tabela) BLOCKED by 3a |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3c (frontend kanban + SLA) BLOCKED by 3a |
| Task T-20260421-4 atualizada | `.auto-memory/dm_queue.md` | Dependência de T-3 inteiro → apenas T-3a |
| Anotação RF-005 | `docs/strategy/RF_BACKLOG.md` | Tabela de split + condição de reversão |
| Sessão logada | `.auto-memory/po_sessions.md` | Esta entrada (append-top) |

### Handoffs

- **Dev Manager:** 3 tarefas novas em `dm_queue.md` (origin=PO). IDs: T-20260421-3a, T-20260421-3b, T-20260421-3c. 1 tarefa atualizada: T-20260421-4 (dependência reduzida).
- **PM Agent:** na próxima revisão diária, atualizar "Handoff DM aberto" em `project_sse_status.md` — substituir T-20260421-3 pelas três sub-tasks + notar que T-4 está BLOCKED por 3a apenas.

### Bloqueios / alertas

- Nenhum bloqueio novo. T-20260421-3a agora é a próxima P1 do DM (podia iniciar imediatamente após sessão DM disponível).
- Alerta para o DM: não acumular 3a+3b+3c num único PR "para otimizar" — Split A foi ratificado exatamente para evitar isso. Violação = reabrir consulta PO.

### Próxima sessão

Quando T-20260421-3a mergear em staging: sessão PO curta para (1) marcar T-20260421-4 como PENDING (desbloqueado), (2) validar se algum ajuste de escopo em 3b/3c virou visível após ver o backend real em staging, (3) monitorar condição de reversão do kanban.

### Escopo negativo desta sessão

- Não escrevi código (apenas artefatos de decisão/handoff — conforme PO não executa).
- Não redigi ADR novo (Split A é decisão operacional, não arquitetural — cabe no po_sessions + RF_BACKLOG, não em ADR).
- Não mexi em CLAUDE.md, AGENTS.md, Bússola, Operating Model.
- Não toquei ADR-011 (continua reservado — última condição de destrave já ocorreu com T-20260421-10 COMPLETED; cabe avaliar ADR-011 em sessão dedicada).
- Não alterei `CHANGELOG`.

---

## Sessão 2026-04-21 (noite, parte 3) — PO Cowork (Debug assistido do deploy API — causa real identificada)

**Contexto:** Luigi pediu *"resolver bloqueios existentes"* após a sessão parte 2. Após AskUserQuestion com 2 perguntas, escopo foi limitado a **T-20260412-1 (Deploy API)** com saída tipo **"análise PO + plano de ação"**. O diagnóstico anterior no `project_sse_status.md` dizia *"máquina sobe mas /ready timeout, possível DATABASE_URL_UNPOOLED inválida ou port mismatch"* — hipóteses nunca verificadas contra logs.

Plano inicial (4 passos) previa debug incremental via flyctl com 4 hipóteses ranqueadas: (1) REDIS_URL ausente, (2) DATABASE_URL pooled ausente, (3) Neon IP allow-list, (4) Redis não provisionado. **Todas erradas.**

### Decisões de produto

1. **Diagnóstico anterior (T-20260412-1) foi REFUTADO.** Não é problema de secret, nem de port, nem de Redis, nem de Neon. Logs Fly.io da máquina `6837ee3c513728` mostram `ERR_MODULE_NOT_FOUND: '/app/packages/shared-utils/dist/uuid'` em loop — processo Node crasha no boot há 9 dias.
   - *Causa raiz:* `packages/shared-utils/src/index.ts` (e provavelmente `shared-types/src/index.ts`) tem `export * from './uuid'` **sem extensão `.js`**. Combinado com `tsconfig.base.json` usando `moduleResolution: "bundler"` (config para webpack/vite, não para Node runtime), o `dist/index.js` compilado mantém os imports sem extensão. Node ESM quebra.
   - *Por que CI passa:* ts-jest transpila on-the-fly, não executa `dist/`. Dev local usa Nest com ts-node. **Só o Docker runtime (que roda `node apps/api/dist/main`) força esse caminho.**
   - *Condição de reversão do diagnóstico:* se após Opção A os logs ainda mostrarem ERR_MODULE_NOT_FOUND em outro módulo, o diagnóstico estava incompleto — rever dependências transitivas.

2. **T-20260412-1 marcada como SUPERSEDED.** Não requer ação humana. Escopo migrado para nova tarefa.

3. **T-20260421-10 criada** (P0, PENDING, DM). Escopo surgical Opção A — adicionar `.js` aos barrels de `shared-utils` e `shared-types`, trocar `moduleResolution` para `"NodeNext"` em `tsconfig.base.json`. Condição de reversão: se Opção A romper 3+ módulos em cascata, DM aplica Opção B (override `module: "CommonJS"` só nos packages, sem tocar root).

4. **ADR-011 continua reservado** — destrava só quando T-20260421-10 fechar com `/ready` verde em staging. ADR candidato **ADR-014** (Module resolution strategy) fica a critério do DM se a mudança tiver impacto material.

5. **Aprendizado documentado** (na própria tarefa T-20260412-1 como footer histórico): diagnóstico de deploy sem consumir logs de boot é especulação. Próxima vez, primeiro comando é `flyctl logs --no-tail`. DM pode opcionalmente atualizar `docs/runbooks/staging-deploy.md` no PR da fix.

### Alinhamento Bússola

- Personas tocadas: N/A — é bug de infra/build.
- Gaps tocados: nenhum direto. Indireto: destrava pipeline para entrega de qualquer gap (Fase 1 fechar + Fase 2 começar).
- Princípios: nenhum.

### Intervenções humanas executadas por Luigi

1. `flyctl version` / `auth whoami` / `apps list` — confirmaram login e app "suspended" (que na verdade é cold-stop + crash loop).
2. `flyctl machine start 6837ee3c513728` — máquina subiu e caiu em ~10s (exit_code=1, oom_killed=false).
3. `flyctl status` antes e depois — mostrou `1 total, 1 warning` nas checks, state `stopped` persistente mesmo após start.
4. `curl /health` → 503 (do proxy Fly, sem máquina saudável); `curl /ready` → 000 (timeout total).
5. `flyctl logs --no-tail | Select -Last 150` — entregou a stack trace completa que matou todas as hipóteses de infra.
6. `flyctl machine status` — confirmou `exit_code=1, oom_killed=false, requested_stop=false` em loop desde 2026-04-21 21:47:16.

### Artefatos produzidos

| Artefato | Arquivo | Mudança |
|---|---|---|
| Nova tarefa DM P0 | `.auto-memory/dm_queue.md` (topo) | `T-20260421-10 — Fix ESM module resolution` (prepend) |
| Tarefa superseded | `.auto-memory/dm_queue.md` (bottom) | `T-20260412-1` atualizada com footer histórico + status SUPERSEDED |
| Status atualizado | `.auto-memory/project_sse_status.md` | Novo bloco "Atualização PO (2026-04-21 noite parte 3)" + Health reason corrigido + P0/P1 reordenado + Handoff DM atualizado |
| Sessão logada | `.auto-memory/po_sessions.md` | Esta entrada |

### Próxima sessão (sugestão)

Assim que T-20260421-10 fechar com `/ready` 200:
1. Marcar T-20260412-1 como COMPLETED-SUPERSEDED e mover para `dm_queue_archive.md`
2. Atualizar Health para VERDE
3. Desbloquear redação de ADR-011 (Release Cadence)
4. Considerar aditivo no runbook `docs/runbooks/staging-deploy.md` — "primeiro comando ao investigar deploy fail: `flyctl logs --no-tail`"

### Escopo negativo desta sessão

- Não mexi em código (apenas diagnóstico + delegação)
- Não alterei CLAUDE.md, AGENTS.md, nem ADRs
- Não toquei Bússola, RF_BACKLOG, dashboard NS
- Não redigi ADR-011 (continua reservado)
- Não abri PR (isso é tarefa do DM em T-20260421-10)
- Não mexi em `fly.toml`, Dockerfile nem workflow — eles estão corretos

---

## Sessão 2026-04-21 (noite, parte 2) — PO Cowork (Incorporação parcial do pacote MF — PV/PUX + squad health)

**Contexto:** imediatamente após a sessão "NS vs Bússola" (parte 1), Luigi disponibilizou um pacote de conhecimento exportado do projeto Minhas Finanças (MF) — 10 arquivos destilando ~18 meses de aprendizados em governança de squad assistido por IA, princípios de UX (PUX1–PUX6), princípios visuais (PV1–PV6), padrão de subagente ux-reviewer, estrutura da Bússola de Produto, regras invioláveis, workflow Git/PowerShell, anti-patterns e checklist de adoção. Pediu: *"vamos incorporar a tecnologia estabelecida no mf em nosso projeto ... levando em consideração a eficiência em nossa implementação e roadmap estabelecida"*.

Pergunta antes da ação (AskUserQuestion, 3 perguntas): Luigi confirmou **Opção A — Cirúrgica** (PV/PUX na Bússola + saúde do squad no Operating Model), **upload dos 3 arquivos-chave antes de executar** (02 ux-reviewer, 03 PV/PUX, 05 template Bússola), e **absorver em `frontend-reviewer` existente** (sem criar subagente novo).

### Decisões de produto

1. **ADR-013 — Opção A (Cirúrgica) — DRAFT → aguarda DM promover a Accepted via T-20260421-6.** Bússola v1.1 → v1.2. Operating Model v2.0 → v2.1. CLAUDE.md ganha Regra 19 (sugestão — aplicação pelo DM). `frontend-reviewer` expandido de 8 para 20 itens (8 base + 6 PV + 6 PUX). ADR-011 segue reservado para release cadence.
   - *Condição de reversão:* (a) 3 PRs consecutivos de UI mergeados sem `frontend-reviewer` mencionar PV/PUX como critério → sinal de decoração; (b) RF da Fase 2 com UI que contradiz 2+ princípios sem ADR de exceção → princípios não pegaram; (c) retrospectiva trimestral indica atrito > valor → tradução para stack SSE errada. Qualquer condição → reabrir ADR-013.

2. **PV1–PV6 e PUX1–PUX6 adotados integralmente** com redação SSE-specific:
   - Stack MF (vanilla HTML + CSS vars + Inter/Fraunces + Lucide) **traduzido** para stack SSE (Next.js 15 + Tailwind + shadcn/ui + next-themes + next/font + lucide-react via shadcn/ui).
   - **Zero conflito** com P1–P8. PV3 e PUX1 reforçam P1 (hero por persona). PUX2 (`tabular-nums`) reforça P6. PUX6 (skeletons) reforça P3. PV6 (densidade) complementa P6. Os 8 restantes são adições novas.
   - *Decisão adiada (escopo negativo desta sessão):* paleta concreta (cor primária hex, famílias tipográficas) fica para RF-UI-SSE futuro, análogo ao NRF-UI-WARM do MF. Adotamos **o princípio**, não os valores.

3. **Novo ritual §5.4 do Operating Model** — "Health check do squad (sinais de adoção quebrada)". Quinzenal, dono PM Agent, checklist de 8 itens (subagentes invocados, princípios citados, escopo negativo nas tarefas, ADRs criados quando devia, MEMORY.md atualizado, BLOCKED drenando, lead time estável, condições de reversão checadas).

4. **Regra 19 do CLAUDE.md (sugestão ao DM aplicar em T-20260421-6):**
   > *"Sempre respeitar os princípios PV1–PV6 (§6.2) e PUX1–PUX6 (§6.3) da Bússola em todo PR que cria ou modifica UI. `frontend-reviewer` é obrigatório em PRs de UI e bloqueia merge em caso de violação. Violação justificada exige ADR próprio. Adotado via ADR-013."*

5. **Escopo negativo explícito da sessão:** não criar subagente `ux-reviewer` independente; não adotar workflow Git/PowerShell do MF (SSE já tem o seu); não redigir paleta/tipografia concretas agora; não tocar §1–§5, §7–§8 da Bússola; não tocar §6 Métricas nem §7 Fluxo do Operating Model; não alterar CLAUDE.md Regras 1–18.

### Alinhamento Bússola

- Personas tocadas: **todas as 4** (PV/PUX aplicam-se transversalmente — Cockpit do Owner, Inbox do Estimator, My Work do Technician, Books do Accountant).
- Gaps tocados: **indireto em todos** — PV/PUX habilitam Gap 1 (Landing por persona) a entregar com coerência visual.
- Princípios reforçados: **P1** via PV3+PUX1; **P3** via PUX6; **P6** via PUX2+PV6.
- Novo princípio: nenhum em §6.1; **12 novos** em §6.2 e §6.3 (PV1–PV6 + PUX1–PUX6).

### Artefatos produzidos

| Artefato | Localização | Operação |
|---|---|---|
| ADR-013 draft | `.auto-memory/proposals/adr_013_draft.md` | Novo (DRAFT) |
| Patch Bússola v1.2 | `.auto-memory/proposals/bussola_v1_2_patch_pv_pux.md` | Novo |
| Patch Operating Model v2.1 | `.auto-memory/proposals/operating_model_v2_1_patch_squad_health.md` | Novo |
| Patch frontend-reviewer | `.auto-memory/proposals/frontend_reviewer_patch_pv_pux.md` | Novo |
| Sugestão CLAUDE.md Regra 19 | `.auto-memory/proposals/claude_md_rule_19_suggestion.md` | Novo |
| T-20260421-6 (aplicar patches) | `.auto-memory/dm_queue.md` | Novo, P2, Status PENDING |
| T-20260421-7 (expandir frontend-reviewer) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |
| T-20260421-8 (cross-ref AGENTS + MEMORY) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |
| T-20260421-9 (sync dashboard) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |

### Próxima sessão

**Foco sugerido:** (a) acompanhar DM aplicar T-20260421-6..9; (b) após Bússola v1.2 publicada, agendar sessão de discovery de paleta concreta (RF-UI-SSE) análoga ao NRF-UI-WARM do MF; (c) começar RF-004 Customer 360 com frontend-reviewer carregando já o checklist expandido (primeiro teste real de ADR-013).

---

## Sessão 2026-04-21 (noite) — PO Cowork (NS vs Bússola — análise + incorporação)

**Contexto:** Luigi pediu análise comparativa entre a documentação pública do NS e a Bússola de Produto SSE v1.0 (ADR-009). Objetivo: confrontar a Bússola com padrões de indústria sem perder posicionamento "simpler + cheaper + purpose-built", identificando gaps não-vistos, reforços possíveis, e padrões adotáveis sem violar P1–P7. Base: `docs.oracle.com/en/cloud/saas/NS/ns-online-help/` via WebSearch (fetch bloqueado por allowlist). 12 áreas exploradas.

Durante a sessão, Luigi enviou duas instruções de aprovação:
1. *"este é o dashboard que eu quero acompanhar daqui para frente, informe o PM e DM"* — adoção do HTML como artefato vivo de governança estratégica.
2. *"eu provo o plano de desenvolvimento"* — desambiguação via AskUserQuestion confirmou "Pacote completo" (Bússola v1.1 + 4 RFs + ADR-012 + dashboard sync + DM tasks).

### Decisões de produto

1. **ADR-012 — Opção A (Adotar ajustes propostos) — Accepted.** ADR-011 permanece reservado para Release Cadence (aguarda T-20260412-1 sair de BLOCKED).
   - *Condição de reversão:* (a) ≥2 dos RFs 004/005/006/007 cancelados antes de dev → reabrir ADR; (b) P8 atrasar Gap 2 em >30 dias → reavaliar P8; (c) mudança material da Bússola em Julho/2026 invalidar RFs; (d) RF-007 ≤5% uso em 90 dias → cancelar + novo ADR.

2. **Bússola promovida para v1.1** — §5 Simplificamos (+7 linhas: Custom Segments/Classifications, SuiteFlow, Saved Searches, OneWorld/Subsidiaries, SuiteBilling, Dashboard Portlets configuráveis, Intelligent Transaction Matching); §5 Superamos (+1099-NEC movido de Herdamos, MACRS nativo, Activation tracking instrumentado); §6 novo **P8 (Offline-first para shop floor)**; §7 Global Search Cmd/Ctrl+K obrigatório + nota de nomenclatura "Workspace" (não "Center"); §8 (+5 linhas: RF-004 P1, RF-005 P1, RF-006 P1, RF-007 P2, ajuste Cockpit Available vs Cash Balance P1); §9 (10 decisões datadas).
   - *Condição de reversão:* revisão trimestral de Julho/2026 (ADR-010 §4) — se personas/gaps mudarem materialmente, redescopar.

3. **4 RFs APPROVED em RF_BACKLOG.md v0.2:**
   - RF-004 Customer 360 View (P1, Fase 2, Persona Estimator, L)
   - RF-005 Estimate State Machine + Inbox (P1, Fase 2, Persona Estimator, XL — split recomendado)
   - RF-006 Payment Hold / Disputed Estimate (P1, Fase 2, Persona Estimator, M, depende de RF-005)
   - RF-007 Case Management simplificado (P2, Fase 2, Persona Estimator, M, com anti-rec #13 formal)

4. **13 anti-recomendações explícitas** documentadas em `ANALISE_NS_vs_BUSSOLA_v1.md §7` — reduzem debate recorrente sobre features NS rejeitadas.

5. **Dashboard NS↔Bússola** (`ANALISE_NS_vs_BUSSOLA_v1.html` + `.md`) adotado como artefato canônico de acompanhamento contínuo, mantido via **T-20260421-1** (standing task) com 6 gatilhos explícitos.

6. **3 decisões técnicas delegadas ao DM** (cada PR de RF registra):
   - Reversing Journal Entries já existe no SSE? (relevante p/ RF-005 se toca GL)
   - Half-Year convention MACRS implementada? (relevante se RF toca FAM)
   - Global Search Cmd/Ctrl+K está no SSE? (relevante p/ RF-004; ENH P1 separado se não)
   - *Condição de reversão:* DM decide e registra; se decisão for "existe mas parcial", PO reavaliará se abre ENH complementar.

### Alinhamento Bússola

- Personas tocadas: **Estimator** (primária nos 4 RFs); Owner-Operator (secundária via RF-005 kanban); Accountant (secundária via RF-006 resolução).
- Gaps tocados: **Gap 5 (Insurance workflow)** amplificado por RF-004/005/006/007; **Gap 2 (Mobile Technician)** reforçado via P8 antes do RF ser escrito.
- Princípios reforçados: **P1 (simplificar > completar)** formalizado em RF-007 via anti-rec #13; **P4 (uma tela = uma decisão)** validado em RF-004.

### Artefatos produzidos

| Artefato | Localização | Operação |
|---|---|---|
| Relatório NS vs Bússola | `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md` | Novo → Accepted |
| Dashboard interativo | `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` | Novo → Accepted (living artifact) |
| ADR-012 formal | `docs/decisions/012-ns-incorporacao-parcial.md` | Novo |
| Bússola v1.1 | `docs/strategy/BUSSOLA_PRODUTO_SSE.md` | Patch (header, §5, §6, §7, §8, §9) |
| RF_BACKLOG v0.2 | `docs/strategy/RF_BACKLOG.md` | Header + RF-004/005/006/007 + Próximos RFs |
| Standing task do dashboard | `.auto-memory/dm_queue.md` T-20260421-1 | Novo |
| Tasks DM para 4 RFs | `.auto-memory/dm_queue.md` T-20260421-2/3/4/5 | Novo |
| Status update PM | `.auto-memory/project_sse_status.md` | Anotação PO no topo + ADR count 10→11 + RFs |
| Memória do dashboard | `...memory/project_sse_NS_dashboard.md` | Novo |
| Index de memória | `...memory/MEMORY.md` | Patch (entrada do dashboard) |
| Index de auto-memory | `.auto-memory/MEMORY.md` | Patch (seção "Dashboards estratégicos") |

### Issues criadas / PRs revisados
- Issues: nenhuma nova nesta sessão (4 RFs viram backlog, não issues até DM claim)
- PRs revisados: nenhum (sessão puramente estratégica)

### Bloqueios
- T-20260412-1 (Deploy API) permanece BLOCKED — aguarda ação humana do Luigi para configurar secrets Fly.io
- ADR-011 (Release Cadence) permanece reservado

### Próxima sessão PO
- Foco: monitorar primeiro RF em dev (RF-004 ou RF-005) e validar que PR cita persona/gap conforme Regra 16
- Opcional: revisitar T-20260412-1 se Luigi confirmar disponibilidade para mexer em secrets Fly.io

---

## Sessão 2026-04-20 (tarde) — PO Cowork (Settings Hardening + Prompt Review)

**Contexto:** Luigi relatou fadiga de prompts de aprovação em sessões de subagentes (ex: `cd ... && git fetch && git pull | tail` disparando modal apesar de `Bash(git fetch:*)` estar no allow list). Pediu script para eliminar interrupções. Escopo alinhado via AskUserQuestion (3 níveis de agressividade × limpeza de legado).

### Decisões de produto

1. **`Bash(*)` total em `.claude/settings.local.json`** — substituído allow list de 80 entradas hiperespecíficas por `Bash(*)` + 1 Read. Backup preservado em `settings.local.json.bak-20260420`. Opção escolhida sobre wildcards targetados (mais conservadora) e `defaultMode: bypassPermissions` (mais agressiva, incluía Edit/Write/MCP).
   - *Condição de reversão:* se qualquer subagente rodar comando destrutivo inesperado (rm, curl|sh, reset --hard em main, commit direto em main), restaurar do `.bak-20260420` OU trocar para lista targetada (`Bash(git:*)`, `Bash(gh:*)`, `Bash(pnpm:*)`, etc.)
   - *Trade-off aceito:* Regra 1 do CLAUDE.md ("NUNCA push direto em main") agora depende 100% da disciplina do agente, não mais de gate de permissão. Motivou T-20260420-1.

2. **Revisão crítica dos prompts do squad** — analisados 6 prompts (DevManager, PMAgent, 4 subagentes). Identificados 10 gaps no contexto pós-Bash(*), empacotados em 2 tarefas para DM conforme severidade.

### Artefatos produzidos

| Artefato | Localização | Operação |
|---|---|---|
| Allow list enxuto | `.claude/settings.local.json` | Reescrita (80 → 2 entradas) |
| Backup do allow list anterior | `.claude/settings.local.json.bak-20260420` | Novo |
| Handoff T-20260420-1 (P1 hardening DM) | `.auto-memory/dm_queue.md` | Append-top |
| Handoff T-20260420-2 (P2 housekeeping subagentes) | `.auto-memory/dm_queue.md` | Append-top |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0 (PO-only session)
- PRs revisados: 0
- Bloqueios: T-20260412-1 (Deploy API) permanece BLOCKED — inalterado por esta sessão
- Decisões adiadas: ADR-011 (release cadence) continua reservado até T-20260412-1 sair de BLOCKED

### Alinhamento Bússola

- **Persona primária tocada:** N/A (sessão meta/infra — segurança do processo de delivery)
- **Gap fechado:** N/A (meta)
- Observação: T-20260420-2 reforça **Regra 16** (persona+gap em PRs de UI) via patch no `frontend-reviewer.md`

### Handoffs DM derivados

- **T-20260420-1** (P1 PENDING) — hardening do `DevManager_Squad_v2.md`: proibições destrutivas + escopo negativo na pré-autorização
- **T-20260420-2** (P2 PENDING) — housekeeping dos 4 subagentes + alinhamento com regras 15–18
- Ambos registrados conforme template canônico `HANDOFF_PROTOCOL.md` §4

### Próxima sessão

1. Aguardar DM consumir T-20260420-1 (P1) — revisar diff quando PR abrir
2. Monitorar se `Bash(*)` gera comportamento inesperado em subagentes — caso positivo, acionar condição de reversão
3. Avaliar se T-20260412-1 (Deploy API) avançou para permitir destravar ADR-011 (release cadence)

---

## Sessão 2026-04-20 — PO Cowork (Relatório de Prontidão + Plano de Testes UI)

**Contexto:** Luigi pediu atualização do relatório de prontidão (antigo `SSE_Post_Migration_Readiness_Report_20260412.md`, desatualizado) e do plano de testes, incluindo UI com dados fictícios. Escopo alinhado via AskUserQuestion antes da execução.

### Decisões de produto

1. **Readiness report reescrito como Go/No-Go Fase 1 MVP** — não mais um snapshot pós-migração, mas um documento de decisão com recomendação explícita (`CONDITIONAL-GO`) e condição de reversão (revisitar 2026-05-05 com critérios C1/C2/C3 objetivos). Doc de 12/abr preservado como histórico com header de supersede.
   - *Condição de reversão:* se C1 (deploy API) + C2 (RF-002 wizard) ambos falharem em 2026-05-05 → regredir para `NO-GO` e realocar squad para infra/wizard sem novos features.
2. **Plano de testes UI cobre 4 categorias complementares** — Seed demo (A), E2E Playwright (B), QA manual (C), Smoke pós-deploy (D). Todos os 12 módulos ativos, 3 diferidos marcados N/A Fase 1.
3. **Dados fictícios centralizados no tenant "Acme Auto Body, LLC"** — 7 users (1 por role), 25 customers, 40 vehicles, 35 estimates com mix de status, 22 SOs, 150 transactions, 8 fixed assets. EINs/placas/VINs usam ranges não-alocados para evitar colisão com dados reais.
4. **Playwright escolhido sobre Cypress** para E2E — justificativa: maturidade mobile emulation (prepara Gap 2 Bússola futuro). Admite ADR se DM divergir.
5. **Smoke isolado do seed demo** — usuário `smoke@sse-internal.test` em tenant `smoke-tenant` vazio, não Acme. Isola regressão causada por seed vs. código.

### Artefatos produzidos

| Artefato | Localização | Tamanho |
|---|---|---|
| Relatório Go/No-Go Fase 1 MVP (novo) | `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md` | ~12.6 KB |
| Plano de Testes UI Fase 1 (novo) | `docs/audits/SSE_Plano_Testes_UI_Fase1_20260420.md` | ~23 KB |
| Header de supersede adicionado | `docs/audits/SSE_Post_Migration_Readiness_Report_20260412.md` | +7 linhas |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0 (PO-only session)
- PRs revisados: 0
- Bloqueios identificados: **T-20260412-1 Deploy API permanece BLOCKED** — é o bloqueio existencial para executar categorias B/C/D do plano de testes. Categoria A (seed) pode avançar em paralelo.

### Alinhamento Bússola

- **Persona primária tocada:** todas as 4 (Owner, Estimator, Technician, Accountant) — plano de testes UI define roteiro por persona
- **Gaps referenciados:** Gap 1 (landing persona — RF-001 parcial), Gap 3 (onboarding — RF-002 pendente), Gap 4 (cockpit Owner — parcial), Gap 2 e 5 mencionados como escopo negativo Fase 1

### Handoffs DM derivados (não registrados ainda — requer aprovação Luigi)

Lista sugerida para registro em `.auto-memory/dm_queue.md` em sessão subsequente:

| ID sugerido | Subject | Prioridade | Dependência |
|---|---|---|---|
| T-20260420-A | Criar script seed Acme Auto Body | P1 | Nenhuma |
| T-20260420-B | Scaffolding Playwright + 2 specs piloto | P1 | T-20260412-1 resolvido |
| T-20260420-C | Specs Playwright módulos 3-12 | P2 | T-20260420-B |
| T-20260420-D | Smoke test CI wiring | P2 | T-20260412-1 resolvido |
| T-20260420-QA | Execução QA manual com PO | P1 | A + T-20260412-1 |

### Próxima sessão PO

**Foco:** revisar com Luigi se os handoffs T-20260420-A..QA devem ir ao dm_queue.md agora ou aguardar evolução de T-20260412-1. Se deploy API desbloquear até lá, promover para P0 de execução.

---

## Sessão 2026-04-17 — PO Cowork (parte 6 — Rollback de duplicatas e consolidação de handoff)

**Contexto:** PO Assistant iniciou sessão para consolidar governança (Bússola, Operating Model, HANDOFF_PROTOCOL, release cadence) sem ler `.auto-memory/MEMORY.md` local. Criou 8 patches de duplicatas lossy de artefatos canônicos pré-existentes. Luigi detectou no review e autorizou rollback R1–R5.

### Decisões de produto

1. **Rollback completo aceito** — deletar todos os artefatos órfãos criados pela sessão; restaurar `.auto-memory/dm_queue.md` canônico (15 task IDs) via reverse-mojibake do backup `backlog_frozen.md`.
2. **ADR-011 (Release Cadence) deletado como prematuro** — discutir release cadence enquanto T-20260412-1 (Deploy API staging) está BLOCKED é cavalo antes do carro. Conteúdo preservado em memória para recriar quando staging estiver verde. Ref: memória PO `project_sse_release_cadence_pending.md`.
3. **`.auto-memory/phase1_close_gate.md` deletado** — conceito "WIP limit para Fase 2" duplica roadmap por gaps da Bússola; as refs B1-3/B2-2/B3-4 eram invenção, canônicos do repo são T-20260412-2 (T-020/021/022) + T-20260412-3.
4. **Protocolo PO Cowork no project instructions está desatualizado em 2 pontos:** (a) menciona `dm_tasks_pending.md` como canônico (é DEPRECATED, canônico é `dm_queue.md`); (b) não manda ler `.auto-memory/MEMORY.md` local na abertura. Patch ao system prompt fica como sugestão para sessão futura.

### Artefatos produzidos

| Artefato | Localização |
|---|---|
| `dm_queue.md` canônico restaurado (15 task IDs, 33.868 chars, UTF-8 BOM) | `.auto-memory/dm_queue.md` |
| Memória PO — estrutura de handoff canônica (reescrita: 6 ativos + 2 stubs DEPRECATED + 6 canônicos em `docs/`) | memory store — `project_sse_handoff_structure.md` |
| Memória PO — ADR release cadence pendente de trigger (nova) | memory store — `project_sse_release_cadence_pending.md` |
| Memória PO — convenções PowerShell: `Set-Location` sempre como 1ª linha (nova) | memory store — `feedback_powershell_conventions.md` |
| Memória PO — estilo de decisões (atualizada: princípio 3 generalizado de "runbooks" para "toda interação dependente de ação humana") | memory store — `feedback_decisions_and_handoffs.md` |

### Artefatos removidos (rollback)

| Arquivo | Tamanho | Razão |
|---|---|---|
| `docs/product/bussola.md` | 1.743 B | Duplicata lossy de `docs/strategy/BUSSOLA_PRODUTO_SSE.md` (3K vs 28K canônico) |
| `docs/product/operating_model.md` | 1.973 B | Duplicata lossy de `docs/process/OPERATING_MODEL_v2.md` (3K vs 15K canônico) |
| `docs/product/` | dir | Vazio após deletes |
| `docs/archive/README.md` | 626 B | Enganoso — nada do repo estava realmente superseded |
| `docs/archive/` | dir | Vazio após delete |
| `docs/decisions/011-release-cadence.md` | 1.489 B | ADR prematuro, sem infra para suportar |
| `.auto-memory/phase1_close_gate.md` | 760 B | Refs inventadas + conceito duplica Bússola |
| `.auto-memory/backlog_frozen.md` | 37.221 B | Backup redundante após restauração bem-sucedida do dm_queue |
| `.auto-memory/dm_tasks_pending.md.bak-2026-04-17-po-cowork` | 2.593 B | Backup do stub DEPRECATED, não mais necessário |

### Gaps / bugs / ENHs identificados

- **Gap de processo:** protocolo PO Cowork não mandata leitura de `.auto-memory/MEMORY.md` na abertura. Se tivesse mandatado, toda a retrabalho desta sessão teria sido evitada em <30s. Documentado em memória; patch a avaliar em sessão futura.
- **Observação técnica:** PowerShell 5.1 `Get-Content -Raw` lê UTF-8 sem BOM como Windows-1252 por default, causando mojibake silencioso de acentos/em-dash ao re-escrever. Mitigado com `[System.IO.File]::WriteAllText(path, content, New-Object System.Text.UTF8Encoding($true))`.
- **Descoberta:** `.auto-memory/`, `docs/strategy/`, `docs/process/`, `docs/decisions/009-010` e `docs/README.md` estão **untracked no git** — governança viva no filesystem mas sem histórico versionado. T-20260417-5 (PENDING) já endereça isso.

### Handoffs

- **Dev Manager:** nenhuma task nova criada nesta sessão. `.auto-memory/dm_queue.md` restaurado mantém as 15 tarefas preexistentes (T-20260412-1/2/3 + T-20260417-1 a T-20260417-12).
- **PM Agent:** nenhum check solicitado.

### Bloqueios / alertas

- **T-20260412-1 (Deploy API staging) continua BLOCKED** — sem mudança nesta sessão. Bloqueia aprendizado de produto e decisão sobre release cadence.
- **Governança untracked no git** — risco de perda acidental até T-20260417-5 ser executada pelo DM.

### Próxima sessão

**Recomendada — WS-C (Auditoria + Consolidação da Documentação):** sessão pré-planejada em `.auto-memory/next_sessions_plan.md`. Escopo: inventário dos 17 arquivos em `docs/` root, proposta de estrutura limpa, commit consolidado da governança untracked.

**Alternativa reativa:** aguardar DM executar T-20260417-5 (commit docs) e revisar PR. Sessão curta de approve+merge.

**Meta-ação sugerida:** patch ao system prompt do PO Cowork para mandatar leitura de `.auto-memory/MEMORY.md` como passo 0 da abertura. Evita o incidente desta sessão em futuras.

---

## Sessão 2026-04-17 — PO Cowork (parte 5 — Gaps P0 convertidos em RFs)

**Contexto:** Luigi aceitou recomendação A. Apesar do pré-requisito técnico (T-20260417-4 briefing do DM) não ter sido executado, PO assumiu varredura técnica LEVE e produziu RFs com complexidade marcada como "a validar pelo DM".

### Decisões de escopo por RF (discovery rodada)

**RF-001 (Landing por Persona):**
- User multi-role → hierarquia fixa `owner > manager > estimator > technician > accountant > viewer`
- Não persiste última escolha; user troca explicitamente quando precisa
- Switcher só aparece se user tem múltiplos roles

**RF-002 (Setup Wizard de Onboarding):**
- Skip permitido; tenant marcado como `wizard_skipped` mas pode ativar organicamente via happy path nos 7 dias
- Sample data criado com `is_sample = true`, visível nas listagens normais
- NÃO persiste progresso parcial entre sessões (decisão pragmática para v0.1)

**RF-003 (Event Tracking de Activation):**
- Tabela própria `public.activation_events` (schema público, não tenant-scoped)
- Append-only, com 13 event_types canônicos incluindo `tenant_activated` computado
- Dashboard interno em `/admin/activation` acessível a super_admin
- NÃO persiste IP/UserAgent individual (LGPD/CCPA)

### Artefatos produzidos (parte 5)

| Artefato | Localização | Status |
|---|---|---|
| RF Backlog v0.1 | `docs/strategy/RF_BACKLOG.md` | NOVO — RF-001/002/003 + lista de RFs futuros |
| 3 tasks DM no queue | `.auto-memory/dm_queue.md` | NOVAS (T-20260417-10/11/12) |
| docs/README.md atualizado | `docs/README.md` | Patched com RF_BACKLOG |
| T-20260417-5 expandida | `.auto-memory/dm_queue.md` | Lista agora 12 arquivos novos + 1 root README alterado |

### Tarefas criadas no `dm_queue.md` em parte 5

- **T-20260417-10** (P0) — Implementar RF-001 (Landing por Persona). Complexidade M (PO assessment). Subagentes: frontend + security + test.
- **T-20260417-11** (P0) — Implementar RF-002 (Setup Wizard). Complexidade L (PO assessment). Subagentes: frontend + db + test + security.
- **T-20260417-12** (P0) — Implementar RF-003 (Event Tracking). Complexidade L (PO assessment). Subagentes: db + security + test + frontend.

### Dependências declaradas

- RF-001 → bloqueia merge de RF-002 (wizard precisa saber onde mandar owner)
- RF-003 → não bloqueia, mas enriquece RF-002 (eventos do wizard)
- Recomendação de ordem para o DM: RF-001 → RF-003 → RF-002 (ou RF-001 + RF-003 em paralelo, depois RF-002)

### Handoffs

- **Dev Manager:** 3 tarefas novas no queue (T-10/11/12). **Crítico:** antes de começar qualquer uma, validar complexidade estimada pelo PO com `frontend-reviewer`/`db-reviewer`. Se complexidade for L e requerer quebra, criar sub-RFs em `RF_BACKLOG.md` (PO aprova) antes de branches.
- **PO (próxima sessão):** revisar propostas do DM caso ele queira quebrar RFs em sub-RFs. Também aprovar PR template + label updates já pendentes.

### Bloqueios / alertas

- **Pendência conhecida:** T-20260417-4 (briefing técnico do DM) continua PENDING. RFs foram produzidos SEM esse input, com complexidade como "PO assessment — DM deve validar". Risco: estimativas podem divergir materialmente do que DM apurar. **Mitigação registrada nas tasks:** cada RF explicitamente pede que DM valide complexidade antes de branchar.
- **Pendência herdada:** T-20260412-1 (GitHub Secrets) — BLOCKED.

### Próxima sessão

**Opção A** — Aguardar DM executar T-20260417-5 (commit do PR consolidado) + T-20260417-8 (moves físicos) e revisar ambos. Sessão curta, foco em approve+merge.

**Opção B** — Aguardar DM validar complexidade dos RFs e possivelmente propor sub-RFs. Sessão curta de ratificação.

**Opção C** — Criar RF-004+ para Gaps P1 (Gap 2 Mobile, Gap 4 Cockpit Owner, Gap 5 Insurance workflow). Prematura antes dos P0 estarem em implementação.

**Recomendação:** aguardar sinal do DM (ele vai rodar em algum momento). Próxima sessão PO é reativa ao que o DM reportar.

---

## Sessão 2026-04-17 — PO Cowork (parte 4 — WS-D: Operating Model v2)

**Contexto:** Em continuação direta à parte 3, Luigi aceitou recomendação A (WS-D). Pré-requisito declarado (T-20260417-5 mergeada) foi relaxado pragmaticamente — produzo artefatos localmente e agrupo no PR existente.

### Decisões oficializadas (escopo "formalizar o que já existe")

1. **Cadência PO oficial:** ad-hoc permanente, iniciada por Luigi. Reavaliar em 2026-07.
2. **Métricas operacionais oficiais (NOVAS):** lead time de tarefas (`PENDING → COMPLETED`, excluindo BLOCKED) + # tarefas BLOCKED por semana.
3. **Rituais oficializados:** rotação mensal do `dm_queue` (responsável: DM, primeiro dia útil) + revisão trimestral do HANDOFF_PROTOCOL (PO + DM, mesma semana da revisão da Bússola já em ADR-009).
4. **Rituais NÃO adotados (registrado como "futuro possível"):** retrospectiva mensal (contradiz "formalizar"), revisão anual de ADRs (overhead).
5. **Hierarquia de documentos autoritativos** declarada explicitamente: Bússola > CLAUDE.md (estratégico); HANDOFF_PROTOCOL > OPERATING_MODEL_v2 > AGENTS.md (operacional); ADRs > CLAUDE.md > convenção (técnico).

### Artefatos produzidos (parte 4)

| Artefato | Localização | Status |
|---|---|---|
| Operating Model v2 | `docs/process/OPERATING_MODEL_v2.md` | NOVO (10 seções) |
| ADR-010 | `docs/decisions/010-operating-model-v2.md` | NOVO |
| docs/README.md atualizado | `docs/README.md` | Patched (linka OPERATING_MODEL_v2 + ADR-010) |
| dm_queue.md atualizado | `.auto-memory/dm_queue.md` | T-5 expandida (+2 arquivos), T-1 ganha regra 18, T-3 ganha referência ao OPERATING_MODEL |

### Tarefas atualizadas (não criadas — ampliadas) no `dm_queue.md`

- **T-20260417-5** — agora cobre 11 arquivos novos + 1 root README alterado (em vez de 7+1). Bundle único pós-WS-D.
- **T-20260417-1** — patch CLAUDE.md agora adiciona regra 18 (referência ao OPERATING_MODEL_v2 + ADR-010), além das regras 15/16/17.
- **T-20260417-3** — patch AGENTS.md agora referencia 5 documentos (vs 4 anteriores), incluindo OPERATING_MODEL_v2.

### Handoffs

- **Dev Manager:** consumir `dm_queue.md` na ordem; T-20260417-5 (PR consolidado) agora cobre WS-A + WS-B + WS-C + WS-D em um único PR doc-only.
- **PM Agent:** próxima execução do scheduled task — começar a reportar lead time de tarefas + # BLOCKED/semana conforme OPERATING_MODEL_v2 §6.2.

### Bloqueios / alertas

- **Nenhum bloqueio nesta parte.**
- **Pendência herdada:** T-20260412-1 (GitHub Secrets) continua BLOCKED.
- **Dependência registrada:** activation rate (métrica de produto da Bússola) requer Gap 8 implementado. Reportada como "N/A — pendente" no OPERATING_MODEL_v2 §6.1 até instrumentação chegar.

### Próxima sessão

A sessão 2026-04-17 (4 partes) entregou todo o pacote de governança: Bússola (estratégia) + Handoff Protocol (operacional) + Operating Model v2 (cadência/métricas) + reorganização de docs.

**Próxima sessão recomendada:**

| Opção | Foco | Quando |
|---|---|---|
| **A (recomendado)** — Sessão dos Gaps P0 | Converter Gap 1 (landing por persona), Gap 3 (setup wizard), Gap 8 (activation tracking) em RFs formais | Após T-20260417-4 (briefing técnico do DM) concluída |
| B — Approve+merge dos PRs do DM | Sessão curta de revisão | Quando o DM tiver executado T-20260417-5 + T-20260417-8 |
| C — Aguardar PM detectar drift | Sessão reativa, sem pauta agendada | Sem prazo |

**Marco atingido:** o squad SSE agora tem **modelo de governança documentado e formalizado** em 3 níveis (estratégia/operacional/processo) com autoridade hierárquica explícita.

---

## Sessão 2026-04-17 — PO Cowork (parte 3 — WS-C: Auditoria e Consolidação de Documentação)

**Contexto:** Em continuação direta à parte 2, Luigi optou pela Opção A (WS-C) executada em sequência. Discovery de 4 perguntas rodada com todas recomendações default aceitas.

### Decisões de docs

1. **Prompts históricos (5 arquivos)** → arquivar em `docs/.archive/prompts-historicos/` (não deletar — manter histórico). Confirmado obsoletos: `PROMPT_CLAUDE_CODE_20260406.md` descreve "agente único" que foi substituído pelo squad em ADR-007.
2. **Prompts de agentes LIVE (5 arquivos)** → mover para `.claude/agents/` (alinha com ADR-007, source-of-truth única).
3. **Templates de abertura de sessão** → consolidados no `HANDOFF_PROTOCOL.md` §13 (7 templates: PM diário, PM semanal, DM feature, DM bug, DM segurança, DM coverage, PO Cowork). Arquivo original `SSE_Templates_Sessao_Agentes.md` será removido.
4. **Report datado** (`SSE_Post_Migration_Readiness_Report_20260412.md`) → mover para `docs/audits/`.
5. **README root** → patch pontual adicionando seção "Strategy & Governance" com links para Bússola, CLAUDE.md, Handoff Protocol, ADRs, docs/README.md.

### Artefatos produzidos (parte 3)

| Artefato | Localização | Status |
|---|---|---|
| Handoff Protocol §13 (7 templates de abertura) | `docs/process/HANDOFF_PROTOCOL.md` | Estendido |
| docs/README.md — INDEX da pasta | `docs/README.md` | NOVO |
| README.md root — Strategy & Governance section | `README.md` | Patched |
| Tasks de move físico no dm_queue | `.auto-memory/dm_queue.md` | T-20260417-8 adicionada |
| T-20260417-5 atualizada | `.auto-memory/dm_queue.md` | Lista expandida (12 arquivos no PR) |

### Tarefas adicionadas no `dm_queue.md` em WS-C

- **T-20260417-8** (P1) — Reorganização física de `docs/` (moves + deletes do WS-C)
- **T-20260417-5** atualizada para refletir todos os arquivos das 3 partes

### Handoffs

- **Dev Manager:** consumir `dm_queue.md` na ordem; T-20260417-5 (commit do PR consolidado) e T-20260417-8 (moves físicos) são os 2 PRs críticos para deixar o repo no estado novo.
- **PM Agent:** próxima execução do scheduled task — adotar template canônico do `HANDOFF_PROTOCOL.md` §5 e usar §13.1/§13.2 como prompt-base.

### Decisões de processo (meta)

Lições aplicadas nesta sessão (vindas da memória de feedback do Luigi):
- Tabela comparativa com **condição de reversão** explícita em todas as decisões majoritárias
- **Escopo negativo explícito** ("NÃO fazer nesta entrega") em cada task do dm_queue.md
- **Discovery ≤ 4 perguntas** com recomendação clara antes de cada bloco de execução
- **Read-back** após cada Write em arquivo crítico (verificação embutida)

### Bloqueios / alertas

- **Nenhum bloqueio nesta parte**. WS-C executado sem fricção.
- **Pendência herdada:** T-20260412-1 (GitHub Secrets) continua BLOCKED por ação humana do Luigi.
- **Alerta processual:** após o DM executar T-20260417-5 e T-20260417-8, o repo terá 2 PRs grandes. Luigi precisa revisar e aprovar ambos. Recomendação: revisar T-20260417-5 primeiro (não toca em código nenhum, só adiciona docs novos), depois T-20260417-8 (faz git mv, mais cuidado).

### Próxima sessão

**Opção A (recomendado):** WS-D — Operating Model v2 conforme briefing em `next_sessions_plan.md §Sessão N+2`. Estimativa 45–60 min. Pré-requisito: T-20260417-5 mergeado (para que docs/process/ esteja oficialmente no repo antes de virar referência num ADR-010).

**Opção B:** sessão dedicada aos Gaps P0 da Bússola (Gap 1 + Gap 3 + Gap 8 → RFs). Requer T-20260417-4 (briefing técnico do DM) concluída antes.

**Opção C:** revisão dos PRs do DM (T-20260417-5 e T-20260417-8) — dependendo de quando o DM executar, pode ser sessão curta de approve+merge.

---

## Sessão 2026-04-17 — PO Cowork (parte 2 — Governança e Handoff)

**Contexto:** Em continuação à sessão parte 1 (adoção da Bússola), Luigi pediu para (a) atualizar o repo, (b) definir padrões claros de handoff PM↔DM, (c) revisar profundamente a documentação, (d) preparar operating model v2. Discovery definiu escopo: formalizar o que já existe (não redesenhar), auditoria completa de docs em sessão dedicada, timing faseado (WS-B + WS-A agora; WS-C + WS-D em sessões próprias).

### Decisões de produto / processo

1. **HANDOFF_PROTOCOL v1.0 aceito** — ownership matrix, 5 lifecycle states, templates canônicos, cadência, resolução de conflito. Arquivo: `docs/process/HANDOFF_PROTOCOL.md`.
2. **Consolidação das filas DM** — `dm_task_queue.md` (PM) + `dm_tasks_pending.md` (PO) unificados em `dm_queue.md` único com `Origin` metadata. Arquivos antigos marcados como deprecated com stub redirect.
3. **Task ID format padronizado:** `T-YYYYMMDD-N`.
4. **Archive strategy:** arquivo separado `dm_queue_archive.md`, rotação mensal.
5. **Lifecycle states:** PENDING | IN_PROGRESS | BLOCKED | COMPLETED (sem CANCELED — COMPLETED + comment basta).
6. **Plano WS-C + WS-D** delineado: audit de docs primeiro (baixa complexidade, resultado tangível), depois operating model v2 (consolida tudo). Briefing em `.auto-memory/next_sessions_plan.md`.

### Artefatos produzidos (parte 2)

| Artefato | Localização |
|---|---|
| Handoff Protocol v1.0 | `docs/process/HANDOFF_PROTOCOL.md` |
| Dev Manager Queue (unificada) | `.auto-memory/dm_queue.md` |
| DM Queue Archive (vazio inicial) | `.auto-memory/dm_queue_archive.md` |
| Briefing das sessões WS-C e WS-D | `.auto-memory/next_sessions_plan.md` |
| Stubs deprecated | `.auto-memory/dm_task_queue.md`, `.auto-memory/dm_tasks_pending.md` |
| MEMORY.md atualizado | `.auto-memory/MEMORY.md` |

### Tarefas criadas no `dm_queue.md` nesta sessão

- **T-20260417-1** (P1) — Patch CLAUDE.md §10 com regras 15/16/17
- **T-20260417-2** (P2) — Atualizar `.github/PULL_REQUEST_TEMPLATE.md`
- **T-20260417-3** (P2) — Atualizar AGENTS.md com Bússola + Handoff Protocol
- **T-20260417-4** (P1) — Briefing técnico dos Gaps P0 da Bússola
- **T-20260417-5** (P1) — Commit dos 7 documentos estratégicos/processos ao repo
- **T-20260417-6** (P2) — Labels GitHub alinhadas com Bússola
- **T-20260417-7** (P2) — Issue templates com persona/gap

### Migração preservada

Tarefas do PM Agent do arquivo antigo foram migradas com IDs novos e mantidas:
- T-20260412-1 (P0) — GitHub Secrets (BLOCKED, requer ação humana)
- T-20260412-2 (P1) — Fase 2 Frontend Polish (com ALERTA: reavaliar prioridade após Bússola)
- T-20260412-3 (P1) — Fechar Fases 1A e 3

### Handoffs

- **Dev Manager:** 10 tarefas em `dm_queue.md` (3 do PM originais + 7 novas do PO). Executar em ordem de prioridade, com atenção especial à T-20260417-5 (que leva tudo desta sessão ao repo via PR).
- **PM Agent:** adotar template canônico do `HANDOFF_PROTOCOL.md` §5 na próxima 