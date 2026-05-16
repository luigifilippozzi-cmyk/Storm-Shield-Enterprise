# P0 CRITICAL: Password authentication fails in Node.js driver but works in Console (Project fragrant-sea-98082526)

## Summary
We're experiencing a critical authentication failure in Neon staging that blocks ALL database operations. The issue is unique: **password works perfectly in Neon Console SQL Editor but fails in Node.js `pg` driver with error code 28P01**.

**Project ID:** fragrant-sea-98082526 (Free tier)
**Timeline:** First observed 2026-05-09 ~17:00 UTC; persists 40+ hours as of 2026-05-12
**Business Impact:** UAT testing blocked indefinitely

---

## The Problem

### ✅ What WORKS
- **Neon Console SQL Editor** — Password authenticates successfully
- Query `SELECT current_user, current_database();` returns `neondb_owner | neondb` ✓
- All role configurations verified as correct via SQL

### ❌ What FAILS
- **Node.js pg driver** — Fails with `password authentication failed (SQLSTATE 28P01)`
- **NestJS API (Fly.io)** — Health endpoint returns 200 OK, but all data operations fail with same 28P01
- **psql CLI** — Also fails with 28P01

---

## Reproduction Steps

### Using Node.js
```bash
DATABASE_URL="postgresql://neondb_owner:npg_Tnv96ortDNpS@ep-shiny-moon-amaw1omz-c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

# This fails with 28P01
node -e "
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect((err) => {
  if (err) console.error('Connection error:', err.message);
  else {
    client.query('SELECT current_user', (err, res) => {
      console.log(res?.rows);
      client.end();
    });
  }
});
"
```

### Using NestJS Seed Script
```bash
pnpm --filter api seed:run -- --tenant=acme --type=personas
# Error: password authentication failed for user 'neondb_owner' (code 28P01)
```

---

## Troubleshooting Completed

✅ **Multiple password resets** — 6+ attempts, all failed with same error
✅ **Tested with superuser** — neondb_owner role, still fails
✅ **Removed TLS parameters** — Removed `channel_binding=require`, no change
✅ **Verified connection string** — Format is correct
✅ **Confirmed password validity** — Works in Console, fails in drivers

---

## Critical Analysis

The behavior suggests an **authentication pathway mismatch**:

| Client | Connection Method | Auth Works? |
|--------|-------------------|------------|
| **Neon Console** | WebSocket proxy | ✅ Yes |
| **Node.js pg driver** | Direct TCP/libpq | ❌ No (28P01) |
| **psql CLI** | Direct TCP/libpq | ❌ No (28P01) |
| **NestJS API** | Direct TCP/libpq | ❌ No (28P01) |

**Hypothesis:** pgbouncer or Neon's auth layer is rejecting direct TCP/libpq connections from Node.js clients while accepting Console's websocket connections.

---

## Diagnostic Evidence

### Infrastructure Status (2026-05-12 verified)
```
Network: Public internet enabled ✓
Compute: 0.49/100 CU-hrs, idle ✓
Storage: 34.33 MB available ✓
Branches: 1/10 (default) ✓
Connections: 839 direct / 10,000 pooled available ✓
```

### Role Configuration (SQL verified in Console)
```
sse_app: rolcanlogin=true ✓
neondb_owner: rolcanlogin=true, is superuser ✓
```

---

## Questions for Neon Team

1. **Auth pathway comparison:** Why does Console's WebSocket authentication work but Node.js direct TCP fails?
2. **pgbouncer configuration:** Are there any restrictive settings for this Free tier project?
3. **TLS/SSL:** Are there additional TLS parameters blocking libpq connections?
4. **IP whitelist:** Are Fly.io staging IPs included in the whitelist?
5. **Known issues:** Any known issues with Node.js pg driver v8.11.x or recent platform changes?

---

## Full Technical Documentation

Detailed analysis including error traces, hypotheses, and investigation steps available at:
[.auto-memory/BUG-04_Neon_Support_Escalation.md](https://github.com/luigifilippozzi-cmyk/Storm-Shield-Enterprise/blob/main/.auto-memory/BUG-04_Neon_Support_Escalation.md)

---

## Contact
**Luigi Filippozzi**  
Email: luigi.filippozzi@gmail.com  
Project: Storm Shield Enterprise (SSE) — SaaS ERP for auto repair shops  
Staging API: https://sse-api-staging.fly.dev  
Staging Web: https://sse-web-staging.vercel.app  

Awaiting your investigation. This is blocking critical UAT testing.
