---
applyTo: "**/*Tests.cs,**/*.Tests.cs,**/*Test.cs"
---

# .NET Testing Instructions

## Framework

xUnit + Moq + FluentAssertions + coverlet.

## Mock Lifecycle

- Declare mocks as fields at class scope.
- Initialize in the **constructor** (xUnit creates a new instance per test — no `[SetUp]` needed).
- Do NOT configure return values in the constructor — only do that in the test body for the specific scenario.

```csharp
private readonly Mock<IMyService> _serviceMock;
private readonly MyConsumer _sut;

public MyConsumerTests()
{
    _serviceMock = new Mock<IMyService>();
    _sut = new MyConsumer(_serviceMock.Object);
}
```

## Test Isolation

- Each `[Fact]` or `[Theory]` must be independently runnable.
- No shared mutable state at class scope (other than mocks and SUT, which are re-created per test instance).
- Use `[ClassFixture<T>]` only for expensive shared setup (e.g., a test database).

## Naming

Pattern: `MethodName_ShouldExpectedBehavior_WhenCondition`

## Arrange-Act-Assert

Every test must follow AAA. Use `// Arrange`, `// Act`, `// Assert` comments in complex tests.

## Coverage Gate

100% branches, lines, and methods enforced via coverlet. Never mark a test task complete while thresholds are failing.

## Prohibited

- ❌ `Assert.True(result != null)` → use `result.Should().NotBeNull()`
- ❌ Testing implementation details (private methods) directly
- ❌ Shared mutable state between tests
- ❌ `Thread.Sleep` or `Task.Delay` in unit tests
- ❌ Real HTTP calls (mock via `MockHttpMessageHandler`)
- ❌ Real file I/O (abstract via an interface)
