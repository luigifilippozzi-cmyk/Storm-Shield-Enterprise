# ADR-016 — Persona de Plataforma na Bússola (§2.5)

Status: Accepted (2026-05-01)
Slot: 016 (ADR-015 reservado para release cadence; independente)

## Contexto
Bússola §2 estabelece "4 personas primárias" como eixo das decisões de produto. RF Regra-0 (super user único cross-tenant) é RF de plataforma, não se encaixa em nenhuma das 4 personas. Sem amenda, qualquer RF de plataforma cria precedente de "exceção fora da Bússola" — degrada a Bússola como single source of truth (regra 15 do CLAUDE.md).

## Opções
| # | Opção | Trade-off |
|---|---|---|
| 1 | Adicionar como 5ª persona primária em §2 | Mistura plataforma com cliente; confunde priorização |
| 2 | **§2.5 "Persona de Plataforma" como sub-seção (escolhida)** | Preserva "4 personas primárias do cliente"; segrega plataforma vs produto; menor diff |
| 3 | §0 "Persona-Zero" antes de §1 | Reordenamento estrutural; precedente de §0 sem necessidade recorrente |

## Decisão
Opção 2 — §2.5 como sub-seção dedicada.

## Justificativa
Mantém §2 como decisão de produto intocada. Segrega operação de plataforma de operação de cliente. Menor diff. Não cria precedente de "persona-zero" sem evidência de necessidade recorrente.

## Condição de reversão
Reabrir este ADR se:
- Surgir 2ª persona de plataforma (ex: Platform Support Engineer terceirizado)
- Compliance regulatório exigir aprovação multi-pessoa em provisioning
- §2.5 começar a acumular >1 card de persona

→ considerar promover para §0 (opção 3) ou expandir §2.5 com múltiplos cards.

## Consequências
+ Bússola permanece single source of truth
+ RFs de plataforma agora têm âncora formal (§2.5) para satisfazer regras 15/16 do CLAUDE.md
+ ADRs futuros de plataforma podem citar §2.5 sem criar exceção ad-hoc
- 5 personas no doc, 4 no framing — exige cuidado editorial em revisões futuras
- Tabela "Landing por persona" passa a ter 2 versões (clientes em §2; plataforma em §2.5)

## Atualizações decorrentes
- Bússola v1.2 → v1.3
- §9 Registro de Decisões: 2 linhas novas (2026-05-01)
- Header da Bússola: linha de versão v1.3
- RF Regra-0 (forthcoming, ADR-017) citará §2.5 como persona primária servida → satisfaz regra 16
- `.auto-memory/MEMORY.md`: atualizar entry "SSE — Bússola de Produto" → "v1.3 com §2.5"
