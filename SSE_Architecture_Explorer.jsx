import { useState } from "react";

const colors = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryBg: "#eff6ff",
  secondary: "#7c3aed",
  secondaryLight: "#a78bfa",
  secondaryBg: "#f5f3ff",
  success: "#059669",
  successBg: "#ecfdf5",
  warning: "#d97706",
  warningBg: "#fffbeb",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  neutral: "#475569",
  neutralBg: "#f8fafc",
  border: "#e2e8f0",
  bg: "#ffffff",
  text: "#1e293b",
  textLight: "#64748b",
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "stack", label: "Tech Stack" },
  { id: "multitenancy", label: "Multi-Tenancy" },
  { id: "modules", label: "Modules (12)" },
  { id: "database", label: "Database" },
  { id: "rbac", label: "RBAC" },
  { id: "plans", label: "SaaS Plans" },
  { id: "roadmap", label: "Roadmap" },
];

function Badge({ children, color = colors.primary, bg = colors.primaryBg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: bg,
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, children, accent = colors.primary, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.bg,
        border: `1.5px solid ${active ? accent : colors.border}`,
        borderRadius: 12,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        boxShadow: active ? `0 0 0 3px ${accent}22` : "0 1px 3px #0001",
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: accent,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── OVERVIEW ───
function OverviewView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          textAlign: "center",
          padding: "28px 20px",
          background: `linear-gradient(135deg, ${colors.primaryBg}, ${colors.secondaryBg})`,
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>
          Storm Shield Enterprise
        </div>
        <div
          style={{
            fontSize: 15,
            color: colors.textLight,
            marginTop: 6,
            maxWidth: 600,
            margin: "6px auto 0",
          }}
        >
          ERP SaaS for Auto Repair (PDR / Body Shops) in the US — Full
          operational cycle from customer intake to accounting & compliance
        </div>
      </div>

      {/* Flow Diagram */}
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Operational Flow
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { icon: "🏢", label: "Insurance / Walk-in", sub: "Customer Intake" },
            { icon: "📋", label: "Estimate", sub: "Quote + Supplements" },
            { icon: "🔧", label: "Service Order", sub: "Tasks + Time" },
            { icon: "💰", label: "Financial", sub: "Payments + Billing" },
            { icon: "📊", label: "Accounting", sub: "GL + FAM" },
            { icon: "📑", label: "Compliance", sub: "Tax + 1099" },
          ].map((step, i, arr) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  textAlign: "center",
                  minWidth: 110,
                }}
              >
                <div style={{ fontSize: 24 }}>{step.icon}</div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: colors.text,
                    marginTop: 4,
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: colors.textLight }}>
                  {step.sub}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    fontSize: 18,
                    color: colors.primaryLight,
                    padding: "0 4px",
                    fontWeight: 700,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {[
          { n: "65", l: "DB Entities", c: colors.primary },
          { n: "12", l: "Domains", c: colors.secondary },
          { n: "7", l: "RBAC Roles", c: colors.success },
          { n: "4", l: "SaaS Plans", c: colors.warning },
          { n: "500+", l: "Target Tenants", c: colors.danger },
          { n: "7", l: "Dev Phases", c: colors.neutral },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              background: colors.neutralBg,
              borderRadius: 12,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: m.c }}>
              {m.n}
            </div>
            <div style={{ fontSize: 12, color: colors.textLight, fontWeight: 600 }}>
              {m.l}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <Card title="Business Domain" accent={colors.primary}>
          <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>
            <strong>PDR</strong> = Paintless Dent Repair.{" "}
            <strong>Body Shops</strong> = Paint & Panel. Payments via{" "}
            <strong>insurance claims</strong> (majority) or out-of-pocket.{" "}
            <strong>Contractors (1099-NEC)</strong> = freelance technicians.
            Strong integration with <strong>insurance companies</strong> (DRP
            programs, estimates, supplements).
          </div>
        </Card>
        <Card title="SaaS Model" accent={colors.secondary}>
          <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>
            <strong>Multi-tenant</strong> with full schema isolation per tenant
            in PostgreSQL. Each company gets its own schema{" "}
            <code>tenant_&#123;uuid&#125;</code>. Billing via{" "}
            <strong>Stripe</strong> with 4 plan tiers. Target:{" "}
            <strong>500+ tenants</strong> simultaneously. Initial focus:{" "}
            <strong>Missouri, US</strong>.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── TECH STACK ───
function StackView() {
  const [selected, setSelected] = useState(null);
  const layers = [
    {
      layer: "Frontend Web",
      tech: "Next.js 14+ (App Router)",
      extras: ["Tailwind CSS", "shadcn/ui", "Zustand", "TanStack Query"],
      color: colors.primary,
      desc: "Server-side rendered dashboards with responsive design. App Router for layouts, Server Components by default, Client Components where needed.",
    },
    {
      layer: "Mobile App",
      tech: "React Native / Expo",
      extras: ["Phase 5"],
      color: colors.secondary,
      desc: "Field app for technicians and salespeople. Planned for Phase 5 of development.",
    },
    {
      layer: "API Gateway",
      tech: "Kong / AWS API Gateway",
      extras: ["Rate Limiting", "Auth"],
      color: colors.warning,
      desc: "Centralized rate limiting per tenant, authentication routing, CORS enforcement.",
    },
    {
      layer: "Backend API",
      tech: "NestJS (TypeScript)",
      extras: ["Knex", "BullMQ", "Swagger"],
      color: colors.success,
      desc: "Modular architecture with one NestJS module per business domain. Repository pattern, DTOs with class-validator, structured logging with correlation IDs.",
    },
    {
      layer: "Database",
      tech: "PostgreSQL 16+",
      extras: ["Multi-tenant", "RLS", "UUID v7"],
      color: colors.danger,
      desc: "Schema-per-tenant isolation with Row Level Security. UUID v7 PKs, soft deletes, DECIMAL(14,2) for money, audit trails with JSONB.",
    },
    {
      layer: "Cache / Queues",
      tech: "Redis 7+",
      extras: ["Sessions", "Cache", "BullMQ"],
      color: "#0891b2",
      desc: "Session storage, query caching, and job queues for async processing via BullMQ.",
    },
    {
      layer: "Storage",
      tech: "AWS S3 / Cloudflare R2",
      extras: ["Photos", "Documents"],
      color: "#4f46e5",
      desc: "Object storage for vehicle photos, estimate documents, scanned invoices, and digitized tax records.",
    },
    {
      layer: "Automation",
      tech: "n8n (self-hosted)",
      extras: ["Visual Workflows"],
      color: "#be185d",
      desc: "Visual workflow builder for insurance reminders, monthly depreciation batches, 1099 generation, bank reconciliation, and QuickBooks export.",
    },
    {
      layer: "AI / ML",
      tech: "OpenAI API + Custom",
      extras: ["OCR", "Classification"],
      color: "#7c3aed",
      desc: "Document OCR, automatic classification, demand forecasting. Planned for Phase 2.",
    },
    {
      layer: "Auth",
      tech: "Clerk",
      extras: ["SSO", "MFA", "Organizations"],
      color: "#0d9488",
      desc: "Authentication via Clerk with SSO support, MFA, and Organizations mapped to tenants.",
    },
    {
      layer: "Infrastructure",
      tech: "AWS + Terraform",
      extras: ["ECS/EKS", "RDS", "ElastiCache"],
      color: "#b45309",
      desc: "Infrastructure as Code with Terraform modules per service. Separate staging and production environments.",
    },
    {
      layer: "CI/CD",
      tech: "GitHub Actions",
      extras: ["Lint", "Test", "Deploy"],
      color: colors.neutral,
      desc: "Automated pipeline: lint → test → build → deploy. Branch protection on main and develop.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 13,
          color: colors.textLight,
          marginBottom: 4,
        }}
      >
        Click on any layer to see details
      </div>
      {layers.map((l, i) => (
        <div
          key={i}
          onClick={() => setSelected(selected === i ? null : i)}
          style={{
            display: "flex",
            alignItems: "stretch",
            cursor: "pointer",
            border: `1.5px solid ${selected === i ? l.color : colors.border}`,
            borderRadius: 12,
            overflow: "hidden",
            transition: "all 0.2s",
            boxShadow: selected === i ? `0 0 0 3px ${l.color}22` : "none",
          }}
        >
          <div
            style={{
              width: 140,
              minWidth: 140,
              background: `${l.color}11`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 8px",
              borderRight: `1.5px solid ${colors.border}`,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: l.color,
                textAlign: "center",
              }}
            >
              {l.layer}
            </span>
          </div>
          <div style={{ flex: 1, padding: "12px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>
              {l.tech}
            </div>
            <div style={{ marginTop: 4 }}>
              {l.extras.map((e, j) => (
                <Badge key={j} color={l.color} bg={`${l.color}15`}>
                  {e}
                </Badge>
              ))}
            </div>
            {selected === i && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: colors.text,
                  lineHeight: 1.6,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 10,
                }}
              >
                {l.desc}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MULTI-TENANCY ───
function MultiTenancyView() {
  const [activeLayer, setActiveLayer] = useState(0);
  const layers = [
    {
      title: "Layer 1: Schema Isolation",
      icon: "🗄️",
      color: colors.primary,
      desc: "Each tenant has its own PostgreSQL schema. The TenantDatabaseService sets `SET search_path TO \"tenant_xxx\", public` per request.",
      visual: (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["tenant_abc123", "tenant_def456", "tenant_ghi789"].map((s, i) => (
            <div
              key={i}
              style={{
                background: colors.primaryBg,
                border: `1.5px solid ${colors.primaryLight}`,
                borderRadius: 10,
                padding: 14,
                textAlign: "center",
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>
                Schema
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: "monospace" }}>
                {s}
              </div>
              <div style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>
                customers, vehicles, estimates, ...
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Layer 2: Row Level Security (RLS)",
      icon: "🔒",
      color: colors.danger,
      desc: "RLS policies on all tables with `tenant_id`. Session loads `app.current_tenant_id`. Even if code forgets WHERE tenant_id, RLS blocks cross-tenant access.",
      visual: (
        <div
          style={{
            background: colors.dangerBg,
            border: `1.5px solid ${colors.danger}44`,
            borderRadius: 10,
            padding: 16,
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.8,
            color: colors.text,
          }}
        >
          <div style={{ color: colors.textLight }}>-- Every table has this policy:</div>
          <div>
            <span style={{ color: colors.danger, fontWeight: 700 }}>CREATE POLICY</span>{" "}
            tenant_isolation <span style={{ color: colors.danger }}>ON</span> customers
          </div>
          <div style={{ paddingLeft: 16 }}>
            <span style={{ color: colors.danger }}>USING</span> (tenant_id ={" "}
            <span style={{ color: colors.primary }}>current_setting</span>
            ('app.current_tenant_id')::uuid);
          </div>
        </div>
      ),
    },
    {
      title: "Layer 3: Dual Database Users",
      icon: "👥",
      color: colors.success,
      desc: "Two PostgreSQL roles: `sse_app` (runtime, subject to RLS) and `sse_user` (admin, bypasses RLS for migrations/provisioning).",
      visual: (
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <div
            style={{
              background: colors.successBg,
              border: `1.5px solid ${colors.success}44`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              flex: 1,
              maxWidth: 220,
            }}
          >
            <div style={{ fontWeight: 800, color: colors.success, fontSize: 14 }}>
              sse_app
            </div>
            <div style={{ fontSize: 12, color: colors.text, marginTop: 6 }}>
              Runtime user. Subject to RLS. Used by TenantDatabaseService for all
              tenant-scoped queries.
            </div>
            <Badge color={colors.success} bg={`${colors.success}15`}>
              RLS Enforced
            </Badge>
          </div>
          <div
            style={{
              background: colors.warningBg,
              border: `1.5px solid ${colors.warning}44`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              flex: 1,
              maxWidth: 220,
            }}
          >
            <div style={{ fontWeight: 800, color: colors.warning, fontSize: 14 }}>
              sse_user
            </div>
            <div style={{ fontSize: 12, color: colors.text, marginTop: 6 }}>
              Admin user. Bypasses RLS. Used only for migrations, provisioning,
              and cross-tenant operations.
            </div>
            <Badge color={colors.warning} bg={`${colors.warning}15`}>
              RLS Bypassed
            </Badge>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          textAlign: "center",
          padding: 20,
          background: colors.neutralBg,
          borderRadius: 14,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: colors.text }}>
          3 Layers of Tenant Isolation
        </div>
        <div style={{ fontSize: 13, color: colors.textLight, marginTop: 4 }}>
          Defense-in-depth strategy — even if one layer fails, the others protect data
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {layers.map((l, i) => (
          <button
            key={i}
            onClick={() => setActiveLayer(i)}
            style={{
              flex: 1,
              padding: "12px 8px",
              border: `2px solid ${activeLayer === i ? l.color : colors.border}`,
              borderRadius: 10,
              background: activeLayer === i ? `${l.color}11` : colors.bg,
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: 13,
              fontWeight: 700,
              color: activeLayer === i ? l.color : colors.textLight,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{l.icon}</div>
            {l.title}
          </button>
        ))}
      </div>

      <Card accent={layers[activeLayer].color} active>
        <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.7, marginBottom: 16 }}>
          {layers[activeLayer].desc}
        </div>
        {layers[activeLayer].visual}
      </Card>

      {/* Request Flow */}
      <Card title="Request Flow (per API call)" accent={colors.neutral}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            "HTTP Request",
            "Auth Guard (Clerk)",
            "Tenant Middleware",
            "SET search_path",
            "SET app.current_tenant_id",
            "RLS Filter Active",
            "Query Executes",
          ].map((s, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: i === 0 ? colors.primaryBg : i === arr.length - 1 ? colors.successBg : colors.neutralBg,
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.text,
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </div>
              {i < arr.length - 1 && (
                <span style={{ color: colors.primaryLight, fontWeight: 700, margin: "0 2px" }}>→</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MODULES ───
function ModulesView() {
  const [selected, setSelected] = useState(null);
  const domains = [
    { id: 1, name: "Platform & IAM", icon: "🔐", entities: 12, color: "#1e40af", entities_list: ["tenants", "users", "roles", "role_permissions", "user_role_assignments", "user_sessions", "tenant_settings", "api_keys", "encryption_keys", "data_retention_policies", "data_subject_requests", "consent_records"] },
    { id: 2, name: "CRM", icon: "👥", entities: 3, color: "#7c3aed", entities_list: ["customers", "customer_consent_records", "customer_interactions"] },
    { id: 3, name: "Insurance", icon: "🏢", entities: 2, color: "#059669", entities_list: ["insurance_companies", "insurance_contacts"] },
    { id: 4, name: "Vehicles", icon: "🚗", entities: 2, color: "#d97706", entities_list: ["vehicles", "vehicle_photos"] },
    { id: 5, name: "Estimates", icon: "📋", entities: 4, color: "#dc2626", entities_list: ["estimates", "estimate_lines", "estimate_supplements", "estimate_documents"] },
    { id: 6, name: "Service Orders", icon: "🔧", entities: 7, color: "#0891b2", entities_list: ["service_orders", "so_tasks", "so_time_entries", "so_photos", "so_parts_used", "so_external_services", "so_status_history"] },
    { id: 7, name: "Contractors", icon: "🧑‍🔧", entities: 3, color: "#4f46e5", entities_list: ["contractors", "contractor_payments", "contractor_1099s"] },
    { id: 8, name: "Financial", icon: "💰", entities: 8, color: "#be185d", entities_list: ["financial_transactions", "insurance_payments", "commissions", "transaction_attachments", "transaction_reconciliations", "bank_accounts", "bank_transactions", "tax_records"] },
    { id: 9, name: "Exports & Integrations", icon: "🔗", entities: 2, color: "#0d9488", entities_list: ["external_exports", "external_account_mappings"] },
    { id: 10, name: "Accounting (GL + FAM)", icon: "📊", entities: 10, color: "#b45309", entities_list: ["chart_of_accounts", "journal_entries", "journal_entry_lines", "fiscal_periods", "account_balances", "asset_categories", "fixed_assets", "depreciation_schedules", "depreciation_entries", "asset_disposals"] },
    { id: 11, name: "Vehicle Rental", icon: "🚙", entities: 3, color: "#6d28d9", entities_list: ["rental_vehicles", "rental_contracts", "rental_maintenance"] },
    { id: 12, name: "Audit & Compliance", icon: "📑", entities: 2, color: "#475569", entities_list: ["audit_logs", "notifications"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: colors.textLight }}>
        Click on a domain to see its entities. 12 domains, 65 total entities.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {domains.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelected(selected === d.id ? null : d.id)}
            style={{
              border: `1.5px solid ${selected === d.id ? d.color : colors.border}`,
              borderRadius: 12,
              padding: 14,
              cursor: "pointer",
              background: selected === d.id ? `${d.color}08` : colors.bg,
              transition: "all 0.2s",
              boxShadow: selected === d.id ? `0 0 0 3px ${d.color}22` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>{d.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: colors.text }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: colors.textLight }}>
                  {d.entities} entities
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (() => {
        const d = domains.find((x) => x.id === selected);
        return (
          <Card title={`${d.icon} ${d.name} — Entities`} accent={d.color} active>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.entities_list.map((e, i) => (
                <span
                  key={i}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    background: `${d.color}10`,
                    border: `1px solid ${d.color}30`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: d.color,
                    fontFamily: "monospace",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

// ─── DATABASE ───
function DatabaseView() {
  const [activeTab, setActiveTab] = useState("conventions");
  const subTabs = [
    { id: "conventions", label: "Conventions" },
    { id: "coa", label: "Chart of Accounts" },
    { id: "fam", label: "Fixed Assets (FAM)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1.5px solid ${activeTab === t.id ? colors.primary : colors.border}`,
              background: activeTab === t.id ? colors.primaryBg : colors.bg,
              color: activeTab === t.id ? colors.primary : colors.textLight,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "conventions" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Primary Keys", val: "UUID v7 (time-sortable)", icon: "🔑" },
            { label: "Soft Delete", val: "deleted_at TIMESTAMPTZ NULL", icon: "🗑️" },
            { label: "Audit Trail", val: "audit_logs append-only (JSONB diff)", icon: "📝" },
            { label: "Encryption", val: "AES-256-GCM field-level, envelope enc.", icon: "🔐" },
            { label: "Timestamps", val: "created_at / updated_at TIMESTAMPTZ UTC", icon: "🕐" },
            { label: "Money Fields", val: "DECIMAL(14,2) — never FLOAT", icon: "💵" },
            { label: "Naming", val: "snake_case, singular entities", icon: "📛" },
            { label: "Enums", val: "PG ENUM types, never free strings", icon: "📋" },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: 12,
                background: colors.neutralBg,
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: colors.text }}>{c.label}</div>
                <div style={{ fontSize: 12, color: colors.textLight, fontFamily: "monospace" }}>{c.val}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "coa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { range: "1000-1999", name: "Assets", balance: "Debit", color: colors.primary, accounts: "Cash, AR, Inventory, Fixed Assets, Accum. Depreciation" },
            { range: "2000-2999", name: "Liabilities", balance: "Credit", color: colors.danger, accounts: "AP, Credit Card, Sales Tax, Payroll" },
            { range: "3000-3999", name: "Equity", balance: "Credit", color: colors.success, accounts: "Owner's Equity, Retained Earnings, Current Year" },
            { range: "4000-4999", name: "Revenue", balance: "Credit", color: colors.secondary, accounts: "PDR Revenue, Paint & Body, Insurance, Rental" },
            { range: "5000-9999", name: "Expenses", balance: "Debit", color: colors.warning, accounts: "Parts, Sublet, Payroll, Contractors, Depreciation" },
          ].map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                border: `1.5px solid ${colors.border}`,
                borderRadius: 10,
                borderLeft: `4px solid ${a.color}`,
              }}
            >
              <div style={{ minWidth: 90, fontFamily: "monospace", fontWeight: 800, color: a.color, fontSize: 14 }}>
                {a.range}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>{a.name}</div>
                <div style={{ fontSize: 11, color: colors.textLight }}>{a.accounts}</div>
              </div>
              <Badge color={a.balance === "Debit" ? colors.primary : colors.success} bg={a.balance === "Debit" ? colors.primaryBg : colors.successBg}>
                {a.balance}
              </Badge>
            </div>
          ))}
          <div style={{ fontSize: 12, color: colors.textLight, marginTop: 4, textAlign: "center" }}>
            US GAAP compliant Chart of Accounts structure
          </div>
        </div>
      )}

      {activeTab === "fam" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="5 Depreciation Methods" accent={colors.warning}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Straight-Line", "MACRS (IRS Pub 946)", "Declining Balance", "Sum-of-Years' Digits", "Units of Production"].map((m, i) => (
                <Badge key={i} color={colors.warning} bg={colors.warningBg}>{m}</Badge>
              ))}
            </div>
          </Card>
          <Card title="MACRS Classes" accent={colors.primary}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["3-Year", "5-Year", "7-Year", "10-Year", "15-Year"].map((c, i) => (
                <Badge key={i} color={colors.primary} bg={colors.primaryBg}>{c}</Badge>
              ))}
            </div>
            <div style={{ fontSize: 12, color: colors.textLight, marginTop: 8 }}>
              Official IRS rates from Publication 946 stored in macrs_percentages table
            </div>
          </Card>
          <Card title="Auto Journal Entries" accent={colors.success}>
            <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.8, fontFamily: "monospace" }}>
              <div><strong>Depreciation:</strong> D: 5800 Depreciation Exp / C: 1590 Accum. Depr.</div>
              <div><strong>Disposal:</strong> D: 1590 + D: Cash / C: 1500 +/- 9100 Gain/Loss</div>
            </div>
          </Card>
          <Card title="6 Asset Categories (Seed)" accent={colors.neutral}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Machinery & Equipment", "Vehicles", "Furniture & Fixtures", "Computer Equipment", "Leasehold Improvements", "Tools"].map((c, i) => (
                <Badge key={i} color={colors.neutral} bg={colors.neutralBg}>{c}</Badge>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── RBAC ───
function RBACView() {
  const [selectedRole, setSelectedRole] = useState(null);
  const roles = [
    { name: "owner", color: "#dc2626", desc: "Full access + billing + tenant settings", access: ["All modules", "Billing", "Tenant config", "User management"] },
    { name: "admin", color: "#be185d", desc: "Everything except billing/tenant config", access: ["All modules", "User management", "Settings (non-billing)"] },
    { name: "manager", color: "#7c3aed", desc: "Operations, reports, approvals", access: ["CRM", "Estimates", "Service Orders", "Financial (read)", "Reports", "Approvals"] },
    { name: "estimator", color: "#1e40af", desc: "CRM, estimates, vehicles", access: ["CRM", "Vehicles", "Estimates", "Insurance contacts"] },
    { name: "technician", color: "#059669", desc: "Service orders, time entries, photos", access: ["Service Orders (assigned)", "Time Entries", "Photos", "Parts Used"] },
    { name: "accountant", color: "#d97706", desc: "Financial, accounting, reports, tax", access: ["Financial", "Accounting (GL)", "Fixed Assets (FAM)", "Reports", "Tax Records"] },
    { name: "viewer", color: "#475569", desc: "Read-only on everything", access: ["All modules (read-only)"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: colors.textLight }}>
        7 roles with granular permissions: <code>module:action:resource</code> pattern
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {roles.map((r, i) => (
          <div
            key={i}
            onClick={() => setSelectedRole(selectedRole === i ? null : i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 16px",
              border: `1.5px solid ${selectedRole === i ? r.color : colors.border}`,
              borderRadius: 10,
              borderLeft: `4px solid ${r.color}`,
              cursor: "pointer",
              transition: "all 0.2s",
              background: selectedRole === i ? `${r.color}06` : colors.bg,
            }}
          >
            <div style={{ minWidth: 100 }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: 14,
                  color: r.color,
                }}
              >
                {r.name}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: colors.text }}>{r.desc}</div>
              {selectedRole === i && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.access.map((a, j) => (
                    <Badge key={j} color={r.color} bg={`${r.color}12`}>{a}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 18, color: colors.textLight }}>{selectedRole === i ? "▲" : "▼"}</div>
          </div>
        ))}
      </div>
      <Card title="Permission Format Example" accent={colors.neutral}>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: colors.text, lineHeight: 1.8 }}>
          <div><Badge color={colors.primary} bg={colors.primaryBg}>financial:write:transactions</Badge> Create/edit financial transactions</div>
          <div><Badge color={colors.success} bg={colors.successBg}>accounting:read:reports</Badge> View accounting reports</div>
          <div><Badge color={colors.warning} bg={colors.warningBg}>estimates:approve:supplements</Badge> Approve estimate supplements</div>
        </div>
      </Card>
    </div>
  );
}

// ─── PLANS ───
function PlansView() {
  const plans = [
    { name: "Free", price: "$0", color: colors.neutral, customers: "50", users: "3", storage: "500MB", modules: "5 basic" },
    { name: "Starter", price: "$$", color: colors.primary, customers: "500", users: "10", storage: "5GB", modules: "+ Insurance, Reports" },
    { name: "Pro", price: "$$$", color: colors.secondary, customers: "Unlimited", users: "50", storage: "50GB", modules: "+ Accounting, FAM" },
    { name: "Enterprise", price: "Custom", color: colors.warning, customers: "Unlimited", users: "Unlimited", storage: "Unlimited", modules: "All modules" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        {plans.map((p, i) => (
          <div
            key={i}
            style={{
              border: `2px solid ${p.color}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: `${p.color}12`,
                padding: "14px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18, color: p.color }}>{p.name}</div>
              <div style={{ fontSize: 13, color: colors.textLight }}>{p.price}</div>
            </div>
            <div style={{ padding: 14 }}>
              {[
                { label: "Customers", val: p.customers },
                { label: "Users", val: p.users },
                { label: "Storage", val: p.storage },
                { label: "Modules", val: p.modules },
              ].map((r, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: j < 3 ? `1px solid ${colors.border}` : "none",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: colors.textLight }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: colors.text }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card title="Enforcement Mechanisms" accent={colors.danger}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color={colors.danger} bg={colors.dangerBg}>PlanGuard</Badge>
            <span style={{ fontSize: 13, color: colors.text }}>
              <code>@RequirePlanFeature('module')</code> — blocks access to modules outside the plan
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color={colors.warning} bg={colors.warningBg}>PlanLimitsInterceptor</Badge>
            <span style={{ fontSize: 13, color: colors.text }}>
              Checks resource counts on POST requests (e.g., free = max 50 customers)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color={colors.neutral} bg={colors.neutralBg}>Tenant Status Check</Badge>
            <span style={{ fontSize: 13, color: colors.text }}>
              Middleware blocks all requests from suspended/cancelled tenants
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── ROADMAP ───
function RoadmapView() {
  const [expanded, setExpanded] = useState(null);
  const phases = [
    { num: 1, name: "MVP", time: "3-4 months", priority: "Critical", color: colors.danger, modules: ["Platform & IAM", "CRM", "Vehicles", "Estimates", "Basic Financial"], desc: "Functional system for a body shop to manage daily operations. Multi-tenant, RBAC, full CRUD cycle." },
    { num: 2, name: "AI + Integrations", time: "2-3 months", priority: "High", color: "#f97316", modules: ["OCR + AI Classifier", "Bank Integration (Plaid)", "n8n Automations"], desc: "Document upload with auto-extraction, bank reconciliation, notification workflows." },
    { num: 3, name: "Accounting + FAM", time: "3-4 months", priority: "High", color: "#f59e0b", modules: ["General Ledger", "Fixed Asset Mgmt", "Reports (P&L, BS, TB)", "Commissions", "Contractors"], desc: "Full double-entry bookkeeping, 5 depreciation methods, auto journal entries, 1099 tracking." },
    { num: 4, name: "Tax Compliance", time: "2-3 months", priority: "High", color: "#eab308", modules: ["Sales Tax (MO)", "1099-NEC Generation", "LGPD/CCPA", "Accountant Portal", "QB/Xero Export"], desc: "Missouri sales tax, 1099 forms, data privacy compliance, read-only accountant access." },
    { num: 5, name: "Mobile + Comms", time: "2-3 months", priority: "Medium", color: colors.primary, modules: ["React Native App", "WhatsApp Business", "AI Chatbot"], desc: "Full mobile app for field technicians, WhatsApp integration, AI-powered customer service." },
    { num: 6, name: "Rental + Analytics", time: "2-3 months", priority: "Medium", color: colors.secondary, modules: ["Vehicle Rental", "Demand Forecasting (ML)", "Advanced Dashboards"], desc: "Rental management during repairs, ML-based demand prediction, advanced analytics." },
    { num: 7, name: "Marketplace", time: "2-3 months", priority: "Low", color: colors.success, modules: ["CCC ONE / Mitchell", "Vendor Marketplace"], desc: "External estimate import from CCC/Mitchell, third-party vendor marketplace." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {phases.map((p, i) => (
        <div
          key={i}
          onClick={() => setExpanded(expanded === i ? null : i)}
          style={{
            border: `1.5px solid ${expanded === i ? p.color : colors.border}`,
            borderRadius: 12,
            borderLeft: `5px solid ${p.color}`,
            overflow: "hidden",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `${p.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                color: p.color,
                flexShrink: 0,
              }}
            >
              {p.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
                Phase {p.num}: {p.name}
              </div>
              <div style={{ fontSize: 12, color: colors.textLight }}>{p.time}</div>
            </div>
            <Badge color={p.color} bg={`${p.color}15`}>{p.priority}</Badge>
            <div style={{ fontSize: 16, color: colors.textLight }}>{expanded === i ? "▲" : "▼"}</div>
          </div>
          {expanded === i && (
            <div
              style={{
                padding: "0 16px 14px",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 13, color: colors.text, marginTop: 10, marginBottom: 10 }}>
                {p.desc}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.modules.map((m, j) => (
                  <Badge key={j} color={p.color} bg={`${p.color}12`}>{m}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ───
export default function SSEArchitectureExplorer() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewView />;
      case "stack": return <StackView />;
      case "multitenancy": return <MultiTenancyView />;
      case "modules": return <ModulesView />;
      case "database": return <DatabaseView />;
      case "rbac": return <RBACView />;
      case "plans": return <PlansView />;
      case "roadmap": return <RoadmapView />;
      default: return null;
    }
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
        color: colors.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          SS
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: colors.text }}>
            SSE Architecture Explorer
          </div>
          <div style={{ fontSize: 12, color: colors.textLight }}>
            Interactive guide to Storm Shield Enterprise
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === t.id ? colors.primary : "transparent",
              color: activeTab === t.id ? "#fff" : colors.textLight,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
