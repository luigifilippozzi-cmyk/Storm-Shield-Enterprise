# PO Scripts — SSE

> Ferramentas operacionais reutilizáveis do Product Owner (modo Cowork).
> Owner: PO Assistant. Editáveis livremente pelo PO; DM só toca via ADR.

## Instalação (primeira vez)

Se o PowerShell bloquear execução de scripts locais, libere só para a sessão atual:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
```

Isso não persiste — ao fechar o PowerShell volta ao default.

## Scripts disponíveis

| Script | Uso | O que faz |
|---|---|---|
| `Invoke-PODiagnostic.ps1` | `.\.auto-memory\scripts\Invoke-PODiagnostic.ps1` | Diagnóstico canônico de abertura de sessão PO (git, PRs, CI, staging, dm_queue tail). Substitui o bloco "Diagnóstico completo" do project_instructions. |
| `Load-Briefing.ps1` | `.\.auto-memory\scripts\Load-Briefing.ps1 -Agent pm` | Carrega briefing mais recente (PM ou DM) de `.auto-memory/briefings/` para o clipboard. Útil quando o Set-Clipboard é sobrescrito entre despachos. |

## Convenções

Todos os scripts seguem as convenções do projeto:

1. **Primeira linha útil**: `Set-Location` absoluto para `C:\Dev\storm-shield-enterprise`
2. **Verificação embutida**: ler de volta antes de declarar sucesso
3. **Cores**: Cyan (header), Green (OK), Yellow (aviso), Red (erro), Gray (detalhe)
4. **Retry ≠ fix**: operações não-idempotentes avisam antes de re-executar
5. **Encoding**: UTF-8 explícito em Set-Content para preservar acentos

## Política

- PO **adiciona/edita** scripts livremente neste diretório
- DM **não modifica** sem ADR (ownership do PO)
- Se um script virar padrão do projeto inteiro, migrar para `scripts/po/` (versionada, ownership compartilhado) via ADR próprio
