# Create GitHub Issue for BUG-04: Neon Authentication Failure
# Usage: .\create-bug-04-issue.ps1

Set-Location "C:\Dev\storm-shield-enterprise"

$titulo = "BUG-04: Neon authentication fails for all staging operations (P0 CRITICAL)"

$corpo = @"
## Summary
Neon database password authentication failure (code 28P01) blocking ALL SSE staging operations. Both automated seeding and manual UI data creation fail. Issue persists 40+ hours across multiple password resets.

## Error
\`\`\`
password authentication failed for user 'neondb_owner'
SQLSTATE 28P01
\`\`

## Impact
- ✅ API health: 200 OK
- ❌ Data operations: All fail (seed script, REST API, SQL queries)
- ❌ UAT testing: Blocked indefinitely

## Reproduction
1. Run seed script: \`pnpm --filter api seed:run -- --tenant=acme --type=personas\`
   - Result: 28P01 error
2. Try manual UI: https://sse-web-staging.vercel.app/customers/new
   - Click Create Customer → "Failed to fetch"
3. Check API health: https://sse-api-staging.fly.dev/health
   - Result: 200 OK (but data endpoints fail)

## Evidence
- Neon project: fragrant-sea-98082526
- Database: neondb
- Password: Works in Neon Console SQL Editor but fails in Node.js \`pg\` driver
- Multiple resets: npg_rUlmoCGG8hVB, npg_V7bSRD66yTJv, npg_32FbGtqnLrjJ, npg_JZc7IHcG9RPA, npg_Tnv96ortDNpS, npg_Y6icCpjl0fTa — all fail with 28P01
- TLS parameters: Removing \`channel_binding=require\` didn't help
- Timeline: First observed 2026-05-09 ~17:00 UTC; persists through 2026-05-12 ~01:30 UTC

## Hypotheses
1. Neon Console uses proxy/websocket auth bypass (works), libpq direct connection fails
2. pgbouncer pooler has cached invalid credentials or config issue
3. TLS handshake blocking before password validation
4. IP whitelist blocking Fly.io staging environment
5. Neon platform internal state corruption

## Requested from Neon Support
- Auth logs for failed connection attempts
- pgbouncer configuration and pool statistics
- TLS/SSL handshake logs
- Explanation: why Console auth works but libpq fails
- IP whitelist configuration
- Any known issues with Node.js pg driver or neondb_owner role
- Remediation: Can you force restart compute? Reset role auth state?

## Full Details
See: .auto-memory/BUG-04_Neon_Support_Escalation.md (comprehensive troubleshooting document)

## Contact
Luigi Filippozzi (luigi.filippozzi@gmail.com)
"@

# Create the issue with appropriate labels
$labels = "bug,prioridade: alta,infra,blocker,fase-1-mvp"

Write-Host "Creating GitHub issue: BUG-04..." -ForegroundColor Cyan
gh issue create --title $titulo --body $corpo --label $labels

Write-Host "Issue created!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Share the issue URL with Neon support"
Write-Host "2. Include the full escalation document: .auto-memory/BUG-04_Neon_Support_Escalation.md"
Write-Host "3. Request: auth logs, pgbouncer config, TLS logs, remediation options"
