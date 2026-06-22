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

The workspace enforces **100% branches, lines, methods, and statements**.

Configure in `coverlet.runsettings.json`:
```json
{
  "RunConfiguration": {
    "MaxCpuCount": 1
  },
  "DataCollectionRunSettings": {
    "DataCollectors": {
      "DataCollector": {
        "FriendlyName": "XPlat Code Coverage",
        "Configuration": {
          "Threshold": 100,
          "ThresholdType": "line,branch,method"
        }
      }
    }
  }
}
```

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
