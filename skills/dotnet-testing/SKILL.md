---
name: dotnet-testing
description: xUnit + Moq + FluentAssertions testing conventions for .NET. Single source of truth for test structure, mock lifecycle, and coverage requirements.
---

# .NET Testing Conventions

## Framework Stack

- **Test runner**: xUnit
- **Mocking**: Moq (or NSubstitute)
- **Assertions**: FluentAssertions
- **Coverage**: coverlet (via `dotnet test --collect:"XPlat Code Coverage"`)
- **HTTP mocking**: `MockHttpMessageHandler` (from `RichardSzalay.MockHttp`)

## Test Naming Convention

Pattern: `MethodName_ShouldExpectedBehavior_WhenCondition`

```csharp
[Fact]
public async Task GetByIdAsync_ShouldReturnEstimate_WhenItExists() { }

[Fact]
public async Task GetByIdAsync_ShouldReturnNull_WhenNotFound() { }

[Theory]
[InlineData(0)]
[InlineData(-1)]
public async Task GetByIdAsync_ShouldThrow_WhenIdIsInvalid(int invalidId) { }
```

## File Naming Convention

Every source class gets a matching test class in the **mirrored `tests/*.Tests` project** — never adjacent to the source file:

| Source | Test file |
|---|---|
| `src/{Project}/Services/EstimateService.cs` | `tests/{Project}.Tests/Services/EstimateServiceTests.cs` |
| `src/{Project}/Controllers/EstimateController.cs` | `tests/{Project}.Tests/Controllers/EstimateControllerTests.cs` |

Suffix is always `Tests` (`Foo.cs` → `FooTests.cs`), matching the source's namespace/folder structure one-to-one in the mirrored test project. This is the location convention referenced by `skills/implementation-rules/SKILL.md` § 2.4 Test Companion Rule.

## Mock Lifecycle

Initialize mocks in the **constructor** (xUnit creates a new instance per test):

```csharp
public class EstimateServiceTests
{
    // Declare at class scope
    private readonly Mock<IEstimateRepository> _repositoryMock;
    private readonly EstimateService _sut;

    public EstimateServiceTests()
    {
        // Initialize fresh in constructor — new instance per test in xUnit
        _repositoryMock = new Mock<IEstimateRepository>();
        _sut = new EstimateService(_repositoryMock.Object);
    }
```

**Do NOT use `[SetUp]`** — xUnit does not use `[SetUp]`/`[TearDown]`. Use the constructor.

## Minimal Defaults

Set only what's needed to prevent a runtime error. Test-specific values belong in the test body:

```csharp
public EstimateServiceTests()
{
    _repositoryMock = new Mock<IEstimateRepository>();
    // Do NOT configure return values here — configure in each test
    _sut = new EstimateService(_repositoryMock.Object);
}

[Fact]
public async Task GetByIdAsync_ShouldReturnDto_WhenFound()
{
    // Arrange — test-specific setup here
    var estimate = new Estimate { Id = 1, Name = "Q1 Estimate" };
    _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                   .ReturnsAsync(estimate);

    // Act
    var result = await _sut.GetByIdAsync(1);

    // Assert
    result.Should().NotBeNull();
    result!.Name.Should().Be("Q1 Estimate");
}
```

## FluentAssertions Patterns

```csharp
// Object equality
result.Should().Be(expected);
result.Should().BeEquivalentTo(expected);

// Null checks
result.Should().NotBeNull();
result.Should().BeNull();

// Collections
collection.Should().HaveCount(3);
collection.Should().Contain(item => item.Id == 1);
collection.Should().BeEmpty();

// Exceptions
var act = () => _sut.GetByIdAsync(-1);
await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
         .WithMessage("*must be positive*");

// Async assertions
await act.Should().NotThrowAsync();
```

## Test Isolation Rules

- No shared mutable state between tests
- Each test creates its own mocks and SUT
- Use `[ClassFixture<T>]` only for expensive shared setup (e.g., database)
- Use `ITestOutputHelper` for test-specific logging, not `Console.WriteLine`

## Coverage Requirements

**What** must be covered is the Coverage Contract in `skills/implementation-rules/SKILL.md` § 3.1. This section only covers the .NET tooling.

Coverlet collects coverage (`{{TEST_COMMAND}}`). Enforce a repo-wide **floor** with `Threshold` set to the repo's current baseline so it can never regress; changed-line coverage is judged on the diff by the Test Generator, not by a global 100% threshold that legacy code could never meet:

```json
{
  "RunConfiguration": { "MaxCpuCount": 1 },
  "DataCollectionRunSettings": {
    "DataCollectors": {
      "DataCollector": {
        "FriendlyName": "XPlat Code Coverage",
        "Configuration": {
          "Threshold": "<current baseline %>",
          "ThresholdType": "line,branch,method"
        }
      }
    }
  }
}
```

Coverage exclusions (`[ExcludeFromCodeCoverage]`, `ExcludeByFile`) follow the contract's default exclusion list and are reviewed like code.

## Artifact-Specific Expectations

### Service Tests
```csharp
// Cover success path, null/not-found path, invalid input, exception propagation
[Fact] public async Task Method_ShouldReturn_WhenSuccessful() { }
[Fact] public async Task Method_ShouldReturnNull_WhenNotFound() { }
[Theory] public async Task Method_ShouldThrow_WhenInputInvalid(params) { }
[Fact] public async Task Method_ShouldPropagateCancellation_WhenTokenCancelled() { }
```

### Controller Tests
```csharp
// Test action result types and status codes
var result = await _sut.GetById(1, CancellationToken.None);
result.Should().BeOfType<OkObjectResult>()
      .Which.Value.Should().BeEquivalentTo(expectedDto);
```

### Repository Tests (use InMemory or real test DB)
```csharp
// Use EF Core InMemory for unit tests
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    .Options;
using var context = new AppDbContext(options);
```

## Mock Strategy by Dependency

| Scenario | Approach |
| -------- | -------- |
| Interface dependency | `Mock<IInterface>()` created in the test class constructor |
| Static methods (unavoidable) | Wrap in an interface adapter |
| `HttpClient` | `HttpClient` over a stub `HttpMessageHandler` |
| `IOptions<T>` | `Options.Create(new TOptions { ... })` |
| `ILogger<T>` | `NullLogger<T>.Instance` (or `Mock<ILogger<T>>` when asserting log calls) |
| EF Core `DbContext` | `UseInMemoryDatabase(Guid.NewGuid().ToString())` for unit tests |

## Running Tests & Coverage

Commands come from `{{TEST_COMMAND}}` in `dotnet-stack-profile` (full and scoped forms).
Coverage report (optional, local only):

```bash
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:"coverage-report" -reporttypes:Html
```

Thresholds are enforced through coverlet configuration (`coverlet.runsettings.json`); the
rule for *what* must be covered (changed lines/branches, exclusions) is owned by
`skills/implementation-rules/SKILL.md` §3.1.

### Coverage Evidence

Use the configured collector's machine-readable reports, not HTML or threshold success alone. Parse Cobertura XML with an XML parser (for example, `System.Xml.Linq`) and match normalized source paths to executable lines in the diff against `testContext.baselineRef`. Preserve integer hit/total counts; use reported branch counts/identities, never rounded percentages to reconstruct them. Ambiguous or unsupported branch data is unavailable, not zero. For multiple test projects covering the same source, merge with the existing reporter before counting; do not sum duplicated file totals.

Run affected test projects and downstream consumer test projects discovered through project references and source usages; execution grants no edit permission. Return the base Test Generator's compact evidence contract, including test identities, dependency fingerprints, report references, per-diff counters and comparable repository totals. A single test project's report is not repository coverage. Reuse a compatible baseline or collect it in an isolated pre-edit checkout without changing the user's worktree; if it cannot be reproduced, report unavailable. Use the full-coverage budget and exit-scope rules from `implementation-rules` § 3.1.1. Do not add packages or alter coverage exclusions to manufacture evidence.
