---
applyTo: "**/*.cs,**/*.cshtml,**/*.razor"
---

# .NET Security Instructions

Follow `skills/dotnet-security-practices/SKILL.md`.

Non-negotiable: never hardcode secrets/connection strings; always parameterize SQL (never string-interpolate user input into `ExecuteSqlRaw`).
