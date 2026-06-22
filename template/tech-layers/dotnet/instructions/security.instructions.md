---
applyTo: "**/*.cs,**/*.cshtml,**/*.razor"
---

# .NET Security Instructions

## Critical Rules

- **Never** hardcode connection strings, tokens, passwords, or API keys.
- **Always** use `async Task` — never `async void` except for event handlers.
- **Always** parameterize SQL — never use string interpolation in `ExecuteSqlRaw` or ADO.NET queries with user input.
- **Always** validate all inputs at API boundaries via Data Annotations or FluentValidation.
- **Always** apply `[Authorize]` on endpoints that require authentication.
- **Never** log sensitive data (passwords, tokens, PII) — log identifiers only.
- **Always** enforce HTTPS (`app.UseHttpsRedirection()`).
- **Never** use `!` null-forgiving operator without an explanatory comment.
- **Always** use `IDisposable`/`using` for unmanaged resources.
- **Avoid** `bypassSecurityTrust` equivalents (raw HTML rendering in Razor without `@Html.Raw` justification).
