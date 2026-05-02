## Comportamento atual

Após resolver BUG-01a (login funcionando), tenant Acme em staging fica sem dados — dashboards e relatórios renderizam vazios. Sem como demonstrar valor do produto no UAT visual.

## Comportamento esperado

Tenant Acme tem dataset mínimo realista (~3 meses) que faz dashboards de Owner/Manager/Accountant e relatórios P&L/BS/TB renderizarem com números > 0.

## Escopo do seed (mínimo viável para tour PO)

- 15 customers (mix insurance/out-of-pocket)
- 18 vehicles
- 12 estimates (status mix: draft/pending/approved/in_progress/completed)
- 5 service orders (status mix)
- 30 financial_transactions (3 meses, mix entrada/saída)
- 1 fixed_asset com depreciation_schedule + 1 entrada lançada
- 3 fiscal_periods (M-2 closed, M-1 closed, M open)

Comando: `pnpm --filter api seed:run --tenant=acme --type=demo-data`

## Critério de aceite

- [ ] Dashboard de cada persona renderiza com números > 0
- [ ] Reports P&L/BS/TB retornam linhas
- [ ] FAM mostra 1 ativo com schedule
- [ ] Idempotência: rodar 2x não duplica
- [ ] Sem PII real (faker locale en-US)

## Escopo negativo

- NÃO popular outros tenants
- NÃO criar dados fora dos módulos de Fase 1
- NÃO usar dados que pareçam reais (CPF/SSN/telefone)

## Dependência

Depende de BUG-01a COMPLETED.

## Subagentes PR

test-runner + db-reviewer (RLS + tenant_id + idempotência)

## Origem

UAT Bug 01 (sessão PO 2026-05-01) — desbloqueia tour visual de indicadores.
