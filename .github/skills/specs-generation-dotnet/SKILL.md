---
name: specs-generation-dotnet
description: ".NET plugin extension for Specs generation. Adds stack-specific architecture, implementation, and testing guidance to the technology-agnostic core template."
---

# Specs Generation .NET Plugin

This skill contains .NET-specific guidance that extends the technology-agnostic core template at `.github/skills/specs-generation-core/SKILL.md`.

Use this skill only when the resolved technology plugin is `dotnet`.

---

## Specs Section - Technical Architecture

**Used in**: Story/Task Specs (Section 4)

### 4. Technical Architecture

#### 4.1 Project Structure

**New Projects to Create**:

- `src/{Domain}.{Feature}/` - Class library for domain logic
- `src/{Domain}.{Feature}.Api/` - API surface (controllers, minimal-API endpoints)
- `src/{Domain}.{Feature}.Contracts/` - DTOs, interfaces, request/response models
- `src/{Domain}.{Feature}.Tests/` - Unit and integration tests

**Existing Projects to Modify**:

- `src/{ExistingProject}/` - {reason for modification}

**Solution Structure Impact**:

- New project references: {list}
- Affected dependents: {list}
- Layering validation: Contracts ← Domain ← Api; no reverse references

#### 4.2 Service Architecture

> Apply Clean Architecture or the layering convention already present in the repository.

**Domain Layer** (class library, no framework dependencies):

- `{EntityName}.cs` - Entity/aggregate root
- `I{ServiceName}.cs` - Domain service interface
- `{ServiceName}.cs` - Domain service implementation

**Application Layer** (orchestration, CQRS if applicable):

- `Commands/{CommandName}Command.cs` - Command + handler
- `Queries/{QueryName}Query.cs` - Query + handler
- `Validators/{Name}Validator.cs` - FluentValidation rules (if used)

**Infrastructure Layer** (EF Core, external integrations):

- `Data/{DbContextName}DbContext.cs` - EF Core context
- `Data/Configurations/{EntityName}Configuration.cs` - Fluent entity config
- `Repositories/{RepositoryName}.cs` - Repository implementations
- `Migrations/` - EF Core migrations

**API Layer** (ASP.NET Core):

- `Controllers/{ControllerName}Controller.cs` - REST endpoints (controller-based)
- `Endpoints/{EndpointName}.cs` - Minimal API endpoint group (minimal-API)
- `Program.cs` / `Startup.cs` - DI registration and middleware pipeline

#### 4.3 Dependency Injection

**New Service Registrations** (`Program.cs` or extension method):

```csharp
// Domain services
builder.Services.AddScoped<I{ServiceName}, {ServiceName}>();

// Data access
builder.Services.AddDbContext<{DbContext}>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("{ConnName}")));

// External integrations
builder.Services.AddHttpClient<I{ClientName}, {ClientName}>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["{Section}:BaseUrl"]!);
});
```

**Service Lifetimes** — justify each choice:

| Service | Lifetime | Reason |
|---------|----------|--------|
| `{ServiceName}` | Scoped | Per-request state |
| `{ClientName}` | Transient | Stateless HTTP calls |
| `{CacheName}` | Singleton | Shared in-memory cache |

#### 4.4 API Contracts and Endpoints

> If backend services were discovered, include a table with service details from Technical Context:

| Service | Environment | Base URL | Version | Auth |
|---------|-------------|----------|---------|------|
| {Service Name} | Dev | `{devUrl}` | {version} | {auth type} |

**Key Endpoints**:

1. **{METHOD} /api/{resource}** - {summary}
   - Request: `{RequestDto}` ({key fields})
   - Response: `{ResponseDto}` ({key fields})
   - Auth: {Required/Optional}
   - Status codes: 200, 400, 401, 404, 500

**Example Controller**:

```csharp
[ApiController]
[Route("api/[controller]")]
public class {Resource}Controller : ControllerBase
{
    private readonly I{ServiceName} _service;

    public {Resource}Controller(I{ServiceName} service)
        => _service = service;

    [HttpGet("{id}")]
    [ProducesResponseType<{ResponseDto}>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
```

**Example Minimal API Endpoint**:

```csharp
public static class {Resource}Endpoints
{
    public static IEndpointRouteBuilder Map{Resource}Endpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/{resource}")
            .WithTags("{Resource}")
            .RequireAuthorization();

        group.MapGet("{id}", GetById);
        group.MapPost("", Create);

        return app;
    }

    private static async Task<IResult> GetById(
        Guid id,
        I{ServiceName} service,
        CancellationToken ct)
    {
        var result = await service.GetByIdAsync(id, ct);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }
}
```

**API Contracts** (`Contracts` project):

```csharp
public sealed record {RequestDto}(
    string {Field},    // {description}
    int {AnotherField} // {description}
);

public sealed record {ResponseDto}(
    Guid Id,
    string {Field},
    DateTimeOffset CreatedAt
);
```

#### 4.5 Data Access and Migrations

**Entity Configuration**:

```csharp
public class {Entity}Configuration : IEntityTypeConfiguration<{Entity}>
{
    public void Configure(EntityTypeBuilder<{Entity}> builder)
    {
        builder.ToTable("{TableName}");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        // indexes, relationships, value conversions
    }
}
```

**Migration Plan**:

1. Add/modify entity and configuration
2. Generate migration: `dotnet ef migrations add {MigrationName} --project src/{InfraProject}`
3. Review generated SQL
4. Apply: `dotnet ef database update`

**Rollback**: `dotnet ef database update {PreviousMigration}`

#### 4.6 Configuration and Secrets

- `appsettings.json` / `appsettings.{Environment}.json` for non-secret config
- User Secrets (`dotnet user-secrets`) for local dev secrets
- Azure Key Vault / environment variables for deployed secrets
- Use `IOptions<T>` / `IOptionsSnapshot<T>` pattern for strongly typed config

```csharp
public sealed class {Feature}Options
{
    public const string SectionName = "{Feature}";
    public required string BaseUrl { get; init; }
    public int TimeoutSeconds { get; init; } = 30;
}

// Registration
builder.Services.Configure<{Feature}Options>(
    builder.Configuration.GetSection({Feature}Options.SectionName));
```

---

## Specs Section - Security Analysis

**Used in**: Story/Task Specs (Section 5)

> **CRITICAL**: This section is required. Failure to identify threat vectors is a validation failure.

### 5. Security Analysis

#### 5.1 Threat Surface

**What new attack surfaces does this feature introduce?**

- New API endpoints exposed
- New data entry points (request bodies, query parameters, route parameters)
- New data storage (database tables, blob storage, caches)
- New third-party integrations (HTTP clients, message brokers)
- New file upload/download capabilities
- New authentication/authorization points

#### 5.2 Potential Threat Vectors

##### **Injection Risks**

- **SQL Injection**:
  - Raw SQL usage: {list specific locations}
  - Mitigation: Use parameterized queries via EF Core; never concatenate user input into SQL

- **Command Injection**:
  - `Process.Start` or shell invocations: {list}
  - Mitigation: Avoid shell execution; if required, whitelist commands and validate arguments

- **XSS** (if serving HTML/Razor):
  - Dynamic content rendering: {identify views}
  - Mitigation: Use Razor encoding by default; avoid `Html.Raw()` with user content

- **SSRF (Server-Side Request Forgery)**:
  - User-controlled URLs passed to `HttpClient`: {list}
  - Mitigation: Validate and whitelist allowed hosts; use `IHttpClientFactory`

##### **Data Exposure Risks**

- **Sensitive Data Handling**:
  - What sensitive data is handled: {PII, credentials, financial data}
  - Where it's stored: {database, cache, logs}
  - Who can access it: {role-based access}
  - Mitigation: Encrypt at rest, use HTTPS, implement proper RBAC, mask in logs

- **Logging Risks**:
  - What data is logged: {ensure no PII/passwords in logs}
  - Mitigation: Use structured logging (Serilog/NLog) with destructuring policies that redact sensitive fields

##### **Authentication & Authorization Risks**

- **New Protected Endpoints**:
  - Endpoints requiring authentication: {list}
  - Required policies/roles: {list}
  - Mitigation: Apply `[Authorize]` or `.RequireAuthorization()` with named policies

- **Authorization Bypass**:
  - Resource-level authorization: {list where}
  - Mitigation: Use `IAuthorizationService` for resource-based checks; never rely on client-side only

##### **Third-Party Dependencies**

- **New NuGet Packages**:
  - Package name and version: {list}
  - Known vulnerabilities: {check `dotnet list package --vulnerable`}
  - Mitigation: Pin versions, enable NuGet audit, review licenses

##### **Data Integrity**

- **Concurrency**:
  - Concurrent write scenarios: {list}
  - Mitigation: Use EF Core concurrency tokens (`[ConcurrencyCheck]`, `RowVersion`)

- **Input Validation**:
  - Request body validation: {FluentValidation / DataAnnotations}
  - Mitigation: Validate early in pipeline; return `400 Bad Request` for invalid input

#### 5.3 Security Checklist

- [ ] No secrets in source code or `appsettings.json`; use User Secrets / Key Vault
- [ ] All endpoints have explicit auth policy or `[AllowAnonymous]` with justification
- [ ] Input validation on all public endpoints
- [ ] Parameterized queries only; no string-concatenated SQL
- [ ] HTTPS enforced; HSTS enabled
- [ ] CORS policy restricts allowed origins
- [ ] Rate limiting configured for public-facing endpoints
- [ ] Error responses do not leak stack traces or internal details
- [ ] Structured logging redacts PII and secrets

#### 5.4 Security Testing Requirements

- [ ] Attempt to access protected endpoints without valid token
- [ ] Attempt actions with insufficient role/policy
- [ ] Test input validation with SQL injection and XSS payloads
- [ ] Verify CORS rejects disallowed origins
- [ ] Run `dotnet list package --vulnerable` and resolve findings
- [ ] Verify error responses return generic messages in non-Development environments

---

## Specs Section - Implementation Plan

**Used in**: Story/Task Specs (Section 6)

### 6. Implementation Plan

**CRITICAL**: This section must be concrete and actionable. Include:
- **Exact file paths** from Technical Context (no placeholders)
- **Code snippets** showing key changes (DI registration, entity config, endpoint wiring)
- **Step numbers** with clear dependencies
- **Reference to Technical Context** for complete implementation details

---

#### Phase 1: Setup and Scaffolding

**If creating new projects:**

1. Create class library for domain/contracts:

```bash
dotnet new classlib -n {Domain}.{Feature} -o src/{Domain}.{Feature}
dotnet sln add src/{Domain}.{Feature}
```

2. Create test project:

```bash
dotnet new xunit -n {Domain}.{Feature}.Tests -o tests/{Domain}.{Feature}.Tests
dotnet sln add tests/{Domain}.{Feature}.Tests
dotnet add tests/{Domain}.{Feature}.Tests reference src/{Domain}.{Feature}
```

3. Add project references:

```bash
dotnet add src/{Api.Project} reference src/{Domain}.{Feature}
```

4. Add NuGet packages:

```bash
dotnet add src/{Project} package {PackageName} --version {Version}
```

**If modifying existing projects:** Skip to Phase 2.

---

#### Phase 2: Domain and Data Layer

1. **Define/Update Entity** (`src/{Domain}.{Feature}/{Entity}.cs`):

```csharp
public sealed class {Entity}
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    // domain methods with invariant enforcement
}
```

2. **Add EF Configuration** (`src/{InfraProject}/Data/Configurations/{Entity}Configuration.cs`):

```csharp
public class {Entity}Configuration : IEntityTypeConfiguration<{Entity}>
{
    public void Configure(EntityTypeBuilder<{Entity}> builder)
    {
        builder.ToTable("{TableName}");
        builder.HasKey(e => e.Id);
        // column config, indexes, relationships
    }
}
```

3. **Update DbContext** (`src/{InfraProject}/Data/{DbContext}DbContext.cs`):

```csharp
public DbSet<{Entity}> {Entities} => Set<{Entity}>();
```

4. **Generate Migration**:

```bash
dotnet ef migrations add Add{Entity} --project src/{InfraProject} --startup-project src/{ApiProject}
```

---

#### Phase 3: Service and Integration Layer

1. **Define Interface** (`src/{Domain}.{Feature}/I{ServiceName}.cs`):

```csharp
public interface I{ServiceName}
{
    Task<{ResponseDto}?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<{ResponseDto}> CreateAsync({RequestDto} request, CancellationToken ct = default);
}
```

2. **Implement Service** (`src/{Domain}.{Feature}/{ServiceName}.cs`):

```csharp
public sealed class {ServiceName} : I{ServiceName}
{
    private readonly {DbContext}DbContext _db;

    public {ServiceName}({DbContext}DbContext db) => _db = db;

    public async Task<{ResponseDto}?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await _db.{Entities}.FindAsync([id], ct);
        return entity is null ? null : MapToDto(entity);
    }
}
```

3. **Register in DI** (`Program.cs` or extension method):

```csharp
builder.Services.AddScoped<I{ServiceName}, {ServiceName}>();
```

---

#### Phase 4: API Layer

1. **Add Controller or Minimal API endpoints** (see Section 4.4 examples)

2. **Wire Endpoints** (if minimal API):

```csharp
// Program.cs
app.Map{Resource}Endpoints();
```

3. **Add Authorization Policies** (if needed):

```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("{PolicyName}", policy =>
        policy.RequireRole("{Role}"));
```

---

#### Phase 5: Hardening and Error Handling

1. **Global Exception Handling** (middleware or `IExceptionHandler`):

```csharp
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken ct)
    {
        // Log, map to ProblemDetails, set status code
    }
}
```

2. **Input Validation** (FluentValidation or DataAnnotations):

```csharp
public sealed class {Request}Validator : AbstractValidator<{RequestDto}>
{
    public {Request}Validator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}
```

3. **Health Checks**:

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<{DbContext}DbContext>()
    .AddCheck<{CustomHealthCheck}>("{CheckName}");
```

---

#### Phase 6: Validation and Documentation

1. **Run Tests**: `dotnet test`
2. **Check Vulnerabilities**: `dotnet list package --vulnerable`
3. **Update OpenAPI**: Verify Swagger/OpenAPI spec reflects new endpoints
4. **Update README**: Document new services, endpoints, and configuration

---

## Specs Section - Testing Strategy

**Used in**: Story/Task Specs (Section 7)

### 7. Testing Strategy

- **Unit Tests**: Services, domain logic, validators (xUnit + NSubstitute/Moq, >80% coverage)
- **Integration Tests**: API endpoints with `WebApplicationFactory<T>`, EF Core with in-memory or test containers
- **End-to-End Tests**: Note critical user flows; QA team may own E2E suites

#### Test Examples

**Unit Test** (`tests/{Project}.Tests/{ServiceName}Tests.cs`):

```csharp
public sealed class {ServiceName}Tests
{
    [Fact]
    public async Task GetById_WhenExists_ReturnsDto()
    {
        // Arrange
        var db = CreateInMemoryContext();
        var sut = new {ServiceName}(db);

        // Act
        var result = await sut.GetByIdAsync(knownId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expected.Name, result.Name);
    }
}
```

**Integration Test** (`tests/{Project}.IntegrationTests/{Resource}EndpointTests.cs`):

```csharp
public sealed class {Resource}EndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public {Resource}EndpointTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task Get_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/{resource}/{id}");
        response.EnsureSuccessStatusCode();
    }
}
```

---

## Specs Section - Acceptance Criteria

**Used in**: Story/Task Specs (Section 8)

### 8. Acceptance Criteria

**Functional**:

- [ ] {Specific testable criterion from FR-1}
- [ ] {Specific testable criterion from FR-2}
- [ ] All endpoints return correct HTTP status codes
- [ ] Error cases return ProblemDetails responses
- [ ] Data persists correctly across requests

**Technical**:

- [ ] New code follows project architecture and naming conventions
- [ ] All new services registered in DI with correct lifetimes
- [ ] All tests pass (`dotnet test`)
- [ ] Code coverage >80% for new code
- [ ] No compiler warnings
- [ ] No vulnerable NuGet packages (`dotnet list package --vulnerable`)

**Security**:

- [ ] All endpoints have explicit authorization
- [ ] Input validation on all public endpoints
- [ ] No secrets in source control
- [ ] Error responses do not leak internals

**Performance**:

- [ ] API response times <500ms for standard operations
- [ ] Database queries use appropriate indexes
- [ ] Async/await used consistently (no sync-over-async)

---

## Specs Section - Risk Assessment and Rollout

**Used in**: Story/Task Specs (Sections 9-10)

### 9. Risk Assessment

**Technical Risks**:

- {Risk 1}: {description, likelihood, impact, mitigation}

**Dependency Risks**:

- {NuGet package update risks, .NET version constraints}

**Data Risks**:

- {Migration risks, data loss potential, rollback strategy}

### 10. Rollout and Migration

- **Deployment**: CI/CD pipeline, health check validation before traffic shift
- **Database Migration**: Run as part of deployment pipeline; test rollback script
- **Feature Flags**: If applicable, use feature management (`Microsoft.FeatureManagement`)
- **Breaking Changes**: API versioning strategy (`/api/v2/`)
- **Monitoring**: Application Insights / structured logs, dashboard for new endpoints

### 11. Appendix

- **Related Tickets**: {Jira keys}
- **Reference Implementations**: {File paths to similar services}
- **API Specification**: {Link to OpenAPI/Swagger doc}
- **NuGet Packages**: {List with versions}

---

## Epic Additions

When `issueType` is `Epic`, include these .NET-specific extensions alongside the core Epic sections:

### Affected Projects and Layers

- `src/{Domain}.{Feature}/` - Domain changes
- `src/{Domain}.{Feature}.Api/` - API surface
- `src/{Infrastructure}/` - Data access / external integrations
- `tests/` - Test projects

### Child Ticket Project Scope

Each child ticket table entry should note:

- Target project(s) within the solution
- Migration requirements (if DB changes)
- NuGet dependency additions

### Rollout Considerations

- Database migration ordering across child tickets
- API versioning strategy for breaking changes
- Shared NuGet package version bumps

---

## Spike Additions

When `issueType` is `Spike`, include these .NET-specific extensions alongside the core Spike sections:

### Experiment Setup

```bash
# Create spike branch
git checkout -b spike/{JIRA_KEY}-{short-description}

# Restore and build
dotnet restore
dotnet build

# Run specific experiment
dotnet run --project src/{ExperimentProject}
```

### Prototype Guidance

- Use a standalone console app or test project for isolated experiments
- Reference existing solution projects for integration experiments
- Use `Testcontainers` for database experiments requiring real engine behavior
- Document findings with benchmark results (`BenchmarkDotNet`) when performance is under investigation

### Follow-up Ticket Labels

| Label | Meaning |
|-------|---------|
| `stack:dotnet` | .NET implementation |
| `type:feature` | Feature work |
| `type:infra` | Infrastructure / CI / NuGet |
| `type:migration` | Database migration |

---

## Summary

These templates extend the core Specs structure with .NET-specific guidance for ASP.NET Core APIs, EF Core data access, Clean Architecture layering, dependency injection patterns, and xUnit testing. Each section provides placeholder guidance that agents populate with real content from Jira tickets, Technical Context, and codebase analysis.
