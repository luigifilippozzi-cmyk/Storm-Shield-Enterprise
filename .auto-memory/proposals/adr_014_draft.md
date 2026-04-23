# ADR-014 — Remoção de menção direta à marca de ERP de referência (trademark hygiene)

**Status:** DRAFT (aguardando publicação pelo DM no PR da T-20260422-1)
**Data:** 2026-04-22
**Autor:** Luigi (PO) + PO Assistant (Cowork)
**Relacionados:** ADR-009 (adoção da Bússola), ADR-012 (Incorporação parcial de ERP de referência — alvo de rename para slug neutro), ADR-013 (Incorporação PV/PUX)
**Nota de numeração:** ADR-011 permanece **reservado** para release cadence (destrava quando T-20260421-10 fechar com `/ready` 200). Este ADR usa o slot 014.

---

## Contexto

A documentação estratégica do SSE cita nominativamente um ERP proprietário de terceiros como benchmark comparativo em **235 ocorrências distribuídas em 19 arquivos versionados**, incluindo:

- Bússola de Produto (`docs/strategy/BUSSOLA_PRODUTO_SSE.md`)
- Documentos analíticos (`docs/strategy/ANALISE_NETSUITE_vs_BUSSOLA_v1.{md,html}`)
- ADRs (008, 009, 012, 013)
- Arquivos de governança (`CLAUDE.md`, READMEs)
- Memória operacional (`.auto-memory/*.md`)

A marca é registrada e o SSE **não tem relação comercial, licenciamento ou endosso** com o fornecedor — o produto é usado exclusivamente como referência comparativa externa, a partir de documentação pública (Leading Practices).

O uso nominativo em documentação própria, mesmo em repo privado, gera exposição desnecessária: o repo pode ser tornado público no futuro, analistas externos podem ter acesso durante due diligence, e eventuais disputas de marca ou opt-outs do fornecedor de referência tornam o conteúdo materialmente difícil de limpar em prazo curto.

A ação proposta é uma **mitigação precautória**, tomada sem aguardar parecer jurídico formal, com base no princípio de reversibilidade (stubs de redirect, ADR suplementar como mecanismo de rollback).

---

## Opções

| # | Opção | Exposição | Esforço | Reversibilidade | Valor analítico preservado |
|---|---|---|---|---|---|
| A | Manter menção direta (status quo) | Alta | 0 | N/A | 100% |
| B | Substituir por sigla "NS" + disclaimer canônico | Baixa | Médio | Alta (stubs + ADR) | 100% |
| C | Remover todo contexto comparativo | Nula | Alto | Baixa (perda de insights) | ~40% |
| D | Aguardar parecer jurídico formal antes de agir | Alta (inalterada durante espera) | 0 imediato | N/A | 100% |

---

## Decisão

**Opção B — Substituir por sigla "NS" acompanhada de disclaimer canônico em cada documento impactado.**

### Justificativa

1. **Mitigação proporcional ao risco.** O risco é latente mas não imediato; a troca textual + disclaimer reduz exposição sem custo de reengenharia conceitual.
2. **Preserva valor analítico.** 100% dos insights comparativos (gaps, anti-patterns, áreas de inspiração) permanecem legíveis.
3. **Reversível.** Stubs de redirect (60 dias) + este ADR tornam o rollback parcial trivial caso parecer jurídico posterior indique caminho diferente.
4. **Desbloqueia o trabalho estratégico.** Evita congelar a Bússola e ADRs adjacentes por tempo indeterminado aguardando parecer.
5. **Alinhada com a Regra 15 do CLAUDE.md** (Bússola como camada estratégica acima deste ADR) — a alteração não toca a estrutura da Bússola, apenas a nomenclatura das referências externas.

---

## Disclaimer canônico

Inserir no topo de cada documento impactado, imediatamente após o título ou frontmatter:

```markdown
> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros
> usado exclusivamente como referência comparativa externa, sem relação
> comercial, licenciamento ou endosso. O nome da marca foi substituído por
> precaução (ver ADR-014).
```

Para `.html`, usar `<!-- -->` ou bloco visual equivalente. Para `.sql`, comentário `-- ` com o mesmo texto. Para `.auto-memory/*.md` internos, disclaimer abreviado (1 linha referenciando ADR-014) é aceitável.

---

## Política de referência a produtos de terceiros (vigente a partir deste ADR)

1. **Não mencionar nominativamente** produtos de terceiros em documentação versionada quando a função do texto é comparativa ou de inspiração conceitual.
2. **Sigla + disclaimer** é o padrão para benchmarks externos. Outras siglas futuras seguem o mesmo modelo (ex.: "SF-REF", "QB-REF") se necessário distinguir entre múltiplas referências.
3. **Documentação pública do fornecedor** (ex.: Leading Practices, manuais públicos) pode continuar sendo consultada e citada como *fonte*, mas a citação deve usar a sigla interna.
4. **Exceção permitida:** citações acadêmicas formais, ADRs de retrospectiva ou análise post-mortem podem mencionar nominativamente quando a omissão prejudicar a rastreabilidade factual. Neste ADR-014 a menção aparece exclusivamente por esse motivo (contextualizar a decisão).

---

## Condição de reversão

Revisitar em ADR suplementar se qualquer uma destas condições se materializar:

- **(a)** Parecer jurídico posterior indicar que a sigla "NS" cria risco residual (ex.: confusão com outro produto, concorrente com acrônimo próximo, uso obrigatório de nome completo para atribuição de crédito em licença pública específica).
- **(b)** A sigla "NS" gerar confusão interna documentada (sessões do PO registrando ambiguidade recorrente).
- **(c)** A relação comercial com o fornecedor mudar: licenciamento formal, parceria, ou autorização expressa para citação nominativa.
- **(d)** A documentação do repo deixar de ser sensível (ex.: fork público oficialmente descolado do produto comercial).

Stubs de redirect (60 dias, até 2026-06-22) mantêm os paths antigos acessíveis para rollback parcial sem novo rename em cascata.

---

## Consequências

### Positivas

- **Redução imediata** de exposição a uso não autorizado de marca registrada
- **Disclaimer padrão** passa a ser aplicável a futuras comparações com outros ERPs, CRMs ou SaaS de referência (precedente estabelecido)
- **ADR público** oferece transparência: qualquer leitor externo entende a razão da sigla
- **Preservação do histórico de pensamento** — todos os ADRs, análises e decisões permanecem legíveis e rastreáveis

### Negativas / aceitas

- **Leitura marginalmente menos fluida** em textos comparativos densos (ex.: §10 da Bússola, ANALISE v1)
- **Commits históricos preservam a marca** — não usamos `git filter-branch` nem `force-push` (violaria Regra 1 do CLAUDE.md). Risco residual aceito e registrado nesta seção.
- **Escopo inicial de 60 dias para stubs** — se houver links externos (wiki, bookmarks pessoais), eles quebrarão após 2026-06-22. Aceita-se dado o público limitado atual.
- **Uma menção explicativa permanece neste ADR** — necessária para contexto. Qualquer leitura automatizada (grep de auditoria) deve esperar exatamente 1 match permitido neste arquivo.

---

## Execução

Delegada ao DM via **T-20260422-1** em `.auto-memory/dm_queue.md`. Escopo técnico completo (19 arquivos, 3 renames, sweep GitHub em 3 etapas, critérios de aceite, escopo negativo explícito) documentado na tarefa.

---

## Arquivo

`docs/decisions/014-remocao-mencao-marca-erp-referencia.md` (publicação pelo DM no PR da T-20260422-1).

## Changelog de adoção

- **2026-04-22** — DRAFT redigido pelo PO Assistant em `.auto-memory/proposals/adr_014_draft.md`, aprovado pelo Luigi via sessão Cowork.
- **Aguardando:** publicação em `docs/decisions/` pelo DM durante o PR `chore/SSE-trademark-hygiene-netsuite`.
