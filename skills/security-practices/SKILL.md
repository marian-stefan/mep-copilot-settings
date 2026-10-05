---
name: security-practices
description: Security practices index. Universal rules that apply regardless of stack, plus a routing table to the active tech layer's stack-specific security skill.
---

# Security Practices — Index

Universal rules apply to every stack. For stack-specific rules (injection risks, framework auth
patterns, secure defaults), consult the routed skill for the active tech layer.

| Tech layer | Files | Skill |
|---|---|---|
| .NET / ASP.NET Core | `**/*.cs`, `**/*.csproj`, `appsettings*.json` | `skills/dotnet-security-practices/SKILL.md` |

> New tech layers register their own row here when generated (`template/ADAPTER-GUIDE.md` §
> Registration) — this table is not exhaustive of every stack this harness could support, only
> the tech layers currently installed in this repository.

---

## Universal Rules (apply to every stack)

- **Never hardcode secrets** — no passwords, API keys, or tokens in source files.
- **Never log sensitive data** — no auth tokens, session IDs, or PII in any logger.
- **Always validate input at system boundaries** — trust no external data.
- **Principle of least privilege** — request only the permissions actually needed.
- **HTTPS always** — no plain HTTP in production for any service or client.

---

## Naming Convention

Every tech layer's own security skill is named `{stack}-security-practices` (never a bare
`security-practices`) — this index skill already owns that unprefixed name at base scope, and
every tech layer installs into the same `skills/` directory, so an unprefixed stack skill
name would collide across tech layers.
