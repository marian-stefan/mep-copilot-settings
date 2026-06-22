---
name: Test Generator
description: .NET/C# test generator using xUnit, Moq, FluentAssertions, and coverlet. Extends base test-generator.agent.md with .NET-specific test patterns.
tools: ['agent', 'read/readFile', 'search/codebase', 'search/fileSearch', 'search/textSearch', 'edit/createFile', 'edit/editFiles', 'execute']
user-invocable: true
---

# Test Generator — .NET Layer

This is the .NET tech-layer override for `test-generator.agent.md`. All workflow steps from the base agent apply. This file provides .NET/C#-specific implementations.

## Test Command

Replace `{{TEST_COMMAND}}` with:
```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

For a specific project:
```bash
dotnet test tests/{Project}.Tests/ --collect:"XPlat Code Coverage"
```

## Test File Naming Convention

| Source file | Test file |
|-------------|-----------|
| `src/Domain.Application/Services/EstimateService.cs` | `tests/Domain.Application.Tests/Services/EstimateServiceTests.cs` |
| `src/Domain.Api/Controllers/EstimateController.cs` | `tests/Domain.Api.Tests/Controllers/EstimateControllerTests.cs` |

## Test Structure

All tests follow xUnit conventions:

```csharp
public class EstimateServiceTests
{
    private readonly Mock<IEstimateRepository> _repositoryMock;
    private readonly EstimateService _sut;

    public EstimateServiceTests()
    {
        _repositoryMock = new Mock<IEstimateRepository>();
        _sut = new EstimateService(_repositoryMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnEstimate_WhenItExists()
    {
        // Arrange
        var expected = new Estimate { Id = 1, Name = "Test" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(expected);

        // Act
        var result = await _sut.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GetByIdAsync_ShouldThrow_WhenIdIsInvalid(int invalidId)
    {
        // Act
        var act = () => _sut.GetByIdAsync(invalidId);

        // Assert
        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }
}
```

## Mock Strategy

| Scenario | Approach |
|----------|----------|
| Interface dependency | `Mock<IInterface>()` in constructor |
| Static methods (unavoidable) | Wrap in an interface adapter |
| `HttpClient` | `MockHttpMessageHandler` or `HttpClient(new MockHandler())` |
| `IOptions<T>` | `Options.Create(new TOptions { ... })` |
| `ILogger<T>` | `NullLogger<T>.Instance` or `Mock<ILogger<T>>` |
| EF Core DbContext | `UseInMemoryDatabase` for unit tests |

## Coverage Verification

```bash
# Generate coverage report
dotnet test --collect:"XPlat Code Coverage"
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:"coverage-report" -reporttypes:Html

# Check thresholds (100% branches, lines, methods)
# Configure in .runsettings or coverlet.runsettings.json
```

Enforce 100% branch coverage via coverlet threshold configuration in `coverlet.runsettings.json`.

## Conventions from testing.instructions.md

Apply all conventions from `.github/instructions/testing.instructions.md` including:
- Mock lifecycle: mocks created in constructor (xUnit), not in `[SetUp]`
- Minimal defaults: only configure what prevents a runtime error
- Test isolation: no shared mutable state between tests
- Naming: `MethodName_ShouldExpectedBehavior_WhenCondition`
