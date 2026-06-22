---
name: Backend Service Discovery
description: .NET-specific backend service discovery. Extends base backend-service-discovery.agent.md with ASP.NET Core DI scanning and appsettings.json URL resolution.
tools: ['execute', 'read', 'search', 'web', 'agent']
user-invocable: false
---

# Backend Service Discovery — .NET Layer

This is the .NET tech-layer override for `backend-service-discovery.agent.md`. All workflow steps from the base agent apply. This file provides .NET-specific implementations for service registration discovery.

## Step 1: Locate Service Registration Files (.NET)

Instead of scanning generic config files, scan:

1. **Program.cs / Startup.cs**: Look for `builder.Services.AddHttpClient<IServiceName>()` or `services.AddSingleton<IServiceName>()` registrations
2. **appsettings.json / appsettings.Development.json**: Look for URL configuration sections:
   ```json
   {
     "Services": {
       "EstimateDataService": {
         "BaseUrl": "https://estimatedata-dev.example.com"
       }
     }
   }
   ```
3. **IOptions<T> configuration classes**: Look for `*Options.cs` files that bind to configuration sections
4. **HttpClient factories**: Find `AddHttpClient` calls with base address configuration

**Search commands**:
```bash
# Find service registrations
grep -r "AddHttpClient\|AddSingleton\|AddScoped\|AddTransient" src/ --include="*.cs" -l

# Find URL configuration
grep -r "BaseUrl\|ServiceUrl\|ApiUrl" src/ --include="*.cs" -l
grep -r "BaseUrl\|ServiceUrl\|ApiUrl" . --include="appsettings*.json"
```

## Step 2: Environment URL Resolution

Extract base URLs from:
- `appsettings.Development.json` for dev environment
- `appsettings.Staging.json` for staging environment  
- `appsettings.Production.json` for production environment
- Environment variables (`ASPNETCORE_*`)

## Step 3: Swagger URL Patterns for ASP.NET Core

ASP.NET Core default swagger endpoints:
1. `{baseUrl}/swagger/v1/swagger.json` ⭐ Most common
2. `{baseUrl}/swagger/{version}/swagger.json` (versioned APIs)
3. `{baseUrl}/openapi/v1.json` (minimal API style)
4. `{baseUrl}/swagger.json`

## Step 4: Generate C# Data Contracts

From Swagger `components/schemas`, generate C# records or classes:

```csharp
// Request DTO
public record CreateEstimateRequest(
    [Required] string Name,
    [Required] int ProjectId,
    decimal? Budget
);

// Response DTO
public record EstimateResponse(
    int Id,
    string Name,
    int ProjectId,
    decimal Budget,
    DateTimeOffset CreatedAt
);
```
