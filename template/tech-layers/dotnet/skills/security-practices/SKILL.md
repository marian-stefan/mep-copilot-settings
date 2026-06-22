---
name: security-practices
description: ASP.NET Core security rules. Applied to all .cs and .cshtml files via security.instructions.md.
---

# Security Practices — .NET

## Critical Rules (Always Apply)

- **Never** hardcode connection strings, API keys, tokens, or passwords in source code. Use `IConfiguration`, environment variables, or Azure Key Vault.
- **Never** use `async void` (except event handlers) — exceptions from `async void` methods are unhandled and crash the process.
- **Always** parameterize SQL queries — never use string interpolation with user-controlled input in `ExecuteSqlRaw` or raw ADO.NET.
- **Always** validate all external input: use Data Annotations (`[Required]`, `[MaxLength]`, `[RegularExpression]`) or FluentValidation on all API request DTOs.
- **Always** use `[Authorize]` on endpoints that require authentication. Opt-in is safer than opt-out.
- **Always** apply HTTPS in production — `app.UseHttpsRedirection()` in middleware pipeline.

## ASP.NET Core Auth

```csharp
// JWT Bearer setup
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.Audience = builder.Configuration["Auth:Audience"];
    });

// Require auth globally, allow anonymous explicitly
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

## CORS

```csharp
// ❌ Never in production
app.UseCors(b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// ✅ Explicit allowed origins
app.UseCors(b => b.WithOrigins("https://app.example.com")
                  .WithMethods("GET", "POST", "PUT", "DELETE")
                  .WithHeaders("Authorization", "Content-Type"));
```

## Anti-Forgery (MVC/Razor Pages)

```csharp
// ✅ Validate on state-changing form actions
[HttpPost]
[ValidateAntiForgeryToken]
public IActionResult Update(UpdateModel model) { }
```

## Secrets Management

```csharp
// ❌ Never
var connectionString = "Server=prod;Password=secret123";

// ✅ Configuration / Key Vault
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ✅ User Secrets for development
// dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..."
```

## SQL Injection Prevention

```csharp
// ❌ Vulnerable
var sql = $"SELECT * FROM Users WHERE Name = '{userInput}'";
await context.Database.ExecuteSqlRawAsync(sql);

// ✅ Parameterized (EF Core)
var users = await context.Users
    .Where(u => u.Name == userInput)
    .ToListAsync();

// ✅ Parameterized (raw SQL when needed)
await context.Database.ExecuteSqlRawAsync(
    "SELECT * FROM Users WHERE Name = {0}", userInput);
```

## Sensitive Data in Logs

```csharp
// ❌ Never log secrets or PII
logger.LogInformation("User {Password} logged in", password);

// ✅ Log identifiers only
logger.LogInformation("User {UserId} authenticated", userId);
```

## OWASP .NET Top 10 Checklist

- [ ] A01 Broken Access Control: `[Authorize]` on all protected routes; resource-based auth for cross-user data
- [ ] A02 Cryptographic Failures: HTTPS enforced; no MD5/SHA1 for passwords (use BCrypt/Argon2)
- [ ] A03 Injection: parameterized queries; FluentValidation on all inputs
- [ ] A05 Security Misconfiguration: no stack traces in production (`UseExceptionHandler`, not `UseDeveloperExceptionPage`)
- [ ] A07 Auth Failures: JWT with audience/issuer validation; short token expiry; refresh token rotation
- [ ] A09 Logging Failures: structured logging; no secrets in logs; audit trail for sensitive operations
