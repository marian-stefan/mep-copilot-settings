---
name: dotnet-patterns
description: C# 12+ and .NET 8+ patterns, idioms, and anti-patterns for the tech-layer code reviewer and researcher
---

# .NET Patterns

## C# 12+ Modern Syntax

### Primary Constructors
```csharp
// Preferred for DI-heavy classes
public class EstimateService(IEstimateRepository repository, ILogger<EstimateService> logger)
    : IEstimateService
{
    public async Task<EstimateDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var estimate = await repository.GetByIdAsync(id, ct);
        return estimate is null ? null : EstimateDto.From(estimate);
    }
}
```

### Records for DTOs
```csharp
public record EstimateDto(int Id, string Name, decimal Budget)
{
    public static EstimateDto From(Estimate estimate) =>
        new(estimate.Id, estimate.Name, estimate.Budget);
}
```

### Collection Expressions
```csharp
// Preferred
int[] ids = [1, 2, 3];
List<string> names = ["Alice", "Bob"];
```

### Required Members
```csharp
public class EstimateOptions
{
    public required string BaseUrl { get; init; }
    public required string ApiKey { get; init; }
}
```

## Async/Await Patterns

### Always Propagate CancellationToken
```csharp
// ✅ Correct
public async Task<IEnumerable<Estimate>> GetAllAsync(CancellationToken ct = default)
{
    return await _context.Estimates.AsNoTracking().ToListAsync(ct);
}

// ❌ Wrong — drops the token
public async Task<IEnumerable<Estimate>> GetAllAsync()
{
    return await _context.Estimates.AsNoTracking().ToListAsync();
}
```

### Never async void (except event handlers)
```csharp
// ❌ Wrong
public async void LoadData() { ... }

// ✅ Correct
public async Task LoadDataAsync() { ... }
```

## Dependency Injection

### Constructor Injection (preferred)
```csharp
public class EstimateController(IEstimateService service) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
```

### Options Pattern
```csharp
// Registration
builder.Services.Configure<EstimateServiceOptions>(
    builder.Configuration.GetSection("Services:EstimateService"));

// Usage
public class EstimateApiClient(IOptions<EstimateServiceOptions> options)
{
    private readonly string _baseUrl = options.Value.BaseUrl;
}
```

## EF Core Patterns

### Read-only Queries
```csharp
// ✅ Always use AsNoTracking for read-only operations
var estimates = await _context.Estimates
    .AsNoTracking()
    .Where(e => e.ProjectId == projectId)
    .ToListAsync(ct);
```

### Avoid N+1
```csharp
// ✅ Use Include for related data
var estimate = await _context.Estimates
    .Include(e => e.LineItems)
    .AsNoTracking()
    .FirstOrDefaultAsync(e => e.Id == id, ct);
```

### No Raw SQL Interpolation
```csharp
// ❌ Vulnerable to SQL injection
var result = await _context.Database.ExecuteSqlRawAsync($"DELETE FROM Estimates WHERE Id = {id}");

// ✅ Parameterized (EF Core)
var result = await _context.Database.ExecuteSqlRawAsync(
    "DELETE FROM Estimates WHERE Id = {0}", id);

// ✅ Better: use EF Core LINQ
await _context.Estimates.Where(e => e.Id == id).ExecuteDeleteAsync(ct);
```

## CQRS / MediatR Patterns

```csharp
// Command
public record CreateEstimateCommand(string Name, int ProjectId) : IRequest<int>;

// Handler
public class CreateEstimateCommandHandler(
    IEstimateRepository repository) : IRequestHandler<CreateEstimateCommand, int>
{
    public async Task<int> Handle(CreateEstimateCommand request, CancellationToken ct)
    {
        var estimate = new Estimate(request.Name, request.ProjectId);
        await repository.AddAsync(estimate, ct);
        return estimate.Id;
    }
}

// Controller usage
[HttpPost]
public async Task<IActionResult> Create(
    CreateEstimateRequest request,
    IMediator mediator,
    CancellationToken ct)
{
    var id = await mediator.Send(new CreateEstimateCommand(request.Name, request.ProjectId), ct);
    return CreatedAtAction(nameof(GetById), new { id }, null);
}
```

## Anti-Patterns to Avoid

- ❌ `async void` (except event handlers)
- ❌ `.Result` or `.Wait()` on async calls (deadlock risk)
- ❌ `DbContext` injected as singleton
- ❌ Repository returning `IQueryable<T>` (leaks EF Core abstractions)
- ❌ Business logic in controllers
- ❌ Hardcoded connection strings or API keys
- ❌ Null-forgiving `!` without explanation comment
- ❌ `ToList()` before filtering (materializes entire table)
