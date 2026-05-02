#!/usr/bin/env node
/**
 * po-diagnostic.js — Storm Shield Enterprise
 * Executado pelo PO Agent no início de cada sessão Cowork.
 * Gera .auto-memory/po-handoff.md para DM e PM Agent.
 * Uso: node scripts/po-diagnostic.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '.auto-memory', 'po-handoff.md');
const REPO = 'luigifilippozzi-cmyk/Storm-Shield-Enterprise';
const MODULES = ['customers', 'vehicles', 'estimates', 'financial', 'service-orders', 'tenants'];
function run(cmd, fallback = 'n/a') {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: ROOT, timeout: 15000 }).trim();
  } catch {
    return fallback;
  }
}
function section(title, content) {
  return `\n## ${title}\n\n${content}\n`;
}
// ── 1. Git status ──────────────────────────────────────────────────────────
const branch     = run('git rev-parse --abbrev-ref HEAD');
const lastCommit = run('git log -1 --format="%h %s (%ar)"');
const dirtyFiles = run('git status --short') || '(clean)';
// ── 2. GitHub Issues ───────────────────────────────────────────────────────
const openIssues = run(
  `gh api repos/${REPO}/issues --jq '[.[] | select(.state=="open") | "- #\\(.number) [\\(.labels | map(.name) | join(","))] \\(.title)"] | join("\\n")'`
);
const blockers = run(
  `gh api repos/${REPO}/issues --jq '[.[] | select(.state=="open" and (.labels | map(.name) | any(. == "blocker" or . == "p0"))) | "- #\\(.number) \\(.title)"] | join("\\n")'`
) || '(nenhum)';
// ── 3. Milestones ──────────────────────────────────────────────────────────
const milestones = run(
  `gh api repos/${REPO}/milestones --jq '[.[] | "- \\(.title): \\(.closed_issues)/\\(.closed_issues + .open_issues) fechadas"] | join("\\n")'`
) || '(nenhum)';
// ── 4. PRs abertos ─────────────────────────────────────────────────────────
const openPRs = run(
  `gh api repos/${REPO}/pulls --jq '[.[] | select(.state=="open") | "- #\\(.number) \\(.title)"] | join("\\n")'`
) || '(nenhum)';
// ── 5. Último workflow CI/CD ───────────────────────────────────────────────
const lastRun = run(
  `gh api repos/${REPO}/actions/runs --jq '[.workflow_runs[] | "\\(.name) | \\(.status) \\(.conclusion // "running") | \\(.created_at[:16])"] | first'`
) || '(não encontrado)';
// ── 6. Verificação de módulos NestJS ──────────────────────────────────────
const moduleChecks = MODULES.map(m => {
  const filePath = path.join(ROOT, 'apps', 'api', 'src', 'modules', m, `${m}.module.ts`);
  if (!fs.existsSync(filePath)) return `- ${m}.module.ts: NÃO ENCONTRADO`;
  const content = fs.readFileSync(filePath, 'utf8');
  const hits = content.split('\n')
    .filter(l => /import|Admin|Activation/.test(l))
    .slice(0, 5)
    .map(l => `  ${l.trim()}`);
  return `- ${m}.module.ts:\n${hits.join('\n') || '  (sem matches)'}`;
}).join('\n');
// ── 7. Auto-memory existente ───────────────────────────────────────────────
const prevStatus = fs.existsSync(path.join(ROOT, '.auto-memory', 'project_sse_status.md'))
  ? fs.readFileSync(path.join(ROOT, '.auto-memory', 'project_sse_status.md'), 'utf8').slice(0, 600) + '\n…'
  : '(ausente)';
// ── Montar handoff ─────────────────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const handoff = `# PO Handoff — Storm Shield Enterprise
Gerado: ${now} | Script: scripts/po-diagnostic.js
Destinatários: **Dev Manager (DM)** · **PM Agent**
${section('Git', `Branch: ${branch}\nÚltimo commit: ${lastCommit}\nAlterações staged/unstaged:\n${dirtyFiles}`)}
${section('Issues Abertas', openIssues || '(nenhuma)')}
${section('Blockers / P0', blockers)}
${section('Milestones', milestones)}
${section('Pull Requests Abertos', openPRs)}
${section('Último CI/CD Run', lastRun)}
${section('Módulos NestJS — Import Check', moduleChecks)}
${section('Estado Anterior (.auto-memory)', prevStatus)}
---
> **DM:** verifique módulos com imports inesperados antes de continuar. Priorize blockers e PRs.
> **PM:** use milestone % e último CI run como baseline do relatório diário.
`;
fs.mkdirSync(path.join(ROOT, '.auto-memory'), { recursive: true });
fs.writeFileSync(OUTPUT, handoff, 'utf8');
console.log(`✅ po-handoff.md gerado em .auto-memory/`);
console.log(`Branch:   ${branch}`);
console.log(`Commit:   ${lastCommit}`);
console.log(`Blockers: ${blockers === '(nenhum)' ? 0 : blockers.split('\n').length}`);
console.log(`PRs:      ${openPRs === '(nenhum)' ? 0 : openPRs.split('\n').length} aberto(s)`);
console.log(`Módulos verificados: ${MODULES.length}`);
