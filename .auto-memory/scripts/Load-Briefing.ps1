<#
.SYNOPSIS
    Carrega o briefing mais recente de um agente (PM ou DM) para o clipboard.

.DESCRIPTION
    Busca em .auto-memory/briefings/ o arquivo mais recente no padrao
    "{agent}_briefing_*.md" e copia seu conteudo para o clipboard.

.PARAMETER Agent
    Qual agente: "pm" ou "dm" (case-insensitive).

.PARAMETER Date
    (Opcional) Data especifica no formato yyyy-MM-dd.

.EXAMPLE
    .\Load-Briefing.ps1 -Agent pm

.EXAMPLE
    .\Load-Briefing.ps1 -Agent dm -Date 2026-04-22
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("pm","dm","PM","DM")]
    [string]$Agent,

    [Parameter(Position=1)]
    [string]$Date
)

Set-Location "C:\Dev\storm-shield-enterprise"

$agentLower = $Agent.ToLower()
$briefingsDir = ".auto-memory\briefings"

if (-not (Test-Path $briefingsDir)) {
    Write-Host "[ERRO] Diretorio $briefingsDir nao existe." -ForegroundColor Red
    Write-Host "       Rode uma sessao PO que gere briefings primeiro." -ForegroundColor Gray
    exit 1
}

if ($Date) {
    $target = "$briefingsDir\${agentLower}_briefing_${Date}.md"
    if (-not (Test-Path $target)) {
        Write-Host "[ERRO] Arquivo nao encontrado: $target" -ForegroundColor Red
        Write-Host "       Briefings disponiveis para $agentLower :" -ForegroundColor Gray
        Get-ChildItem "$briefingsDir\${agentLower}_briefing_*.md" -ErrorAction SilentlyContinue |
            Select-Object Name,LastWriteTime | Format-Table -AutoSize
        exit 1
    }
} else {
    $target = Get-ChildItem "$briefingsDir\${agentLower}_briefing_*.md" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 -ExpandProperty FullName

    if (-not $target) {
        Write-Host "[ERRO] Nenhum briefing ${agentLower}_* encontrado em $briefingsDir" -ForegroundColor Red
        exit 1
    }
}

$content = Get-Content $target -Raw -Encoding UTF8
$content | Set-Clipboard

$clipboardNow = Get-Clipboard -Raw
if ($clipboardNow.Length -ne $content.Length) {
    Write-Host "[AVISO] Tamanho do clipboard nao bate com o arquivo." -ForegroundColor Yellow
    Write-Host "        Arquivo: $($content.Length) bytes | Clipboard: $($clipboardNow.Length) bytes"
    exit 1
}

Write-Host "[OK] Briefing $Agent carregado no clipboard" -ForegroundColor Green
Write-Host "     Origem: $target" -ForegroundColor Gray
Write-Host "     Tamanho: $($content.Length) bytes" -ForegroundColor Gray
Write-Host ""
$agentUpper = $Agent.ToUpper()
Write-Host "==> Abra a sessao do $agentUpper Agent e cole com Ctrl+V." -ForegroundColor Yellow
