---
name: backend-service-discovery
description: Automatically discovers backend services from DI configuration files, fetches real Swagger/OpenAPI specifications, and extracts API endpoints, schemas, and authentication for accurate Specs documentation. Use when documenting backend API dependencies, analyzing data model changes, or planning service integrations.
---

# Backend Service Discovery

**IMPORTANT**: This skill provides domain knowledge for backend service discovery. The actual discovery workflow is implemented by the dedicated **Backend Service Discovery Agent** (`.github/agents/backend-service-discovery.agent.md`).

This documentation serves as a reference for understanding the service architecture, service registration patterns, and environment configurations used in the workspace.

## Agent Integration

The **Backend Service Discovery Agent** (`backend-service-discovery.agent.md`) automates the complete discovery workflow:

- Invoked by all Tech Researcher variants via `runSubagent`
- Handles service registration resolution, Swagger fetching, schema extraction
- Outputs formatted "Backend Service Dependencies" sections
- Validates real Swagger data vs. assumptions

**Tech researchers should invoke the agent, not duplicate logic from this skill.**

## REQUIRED: Always Use Real Swagger Data

**CRITICAL: NEVER MAKE ASSUMPTIONS about backend services.**

When working with components that require backend services:

- DO NOT assume endpoint paths, HTTP methods, or parameters
- DO NOT template or fabricate request/response schemas
- DO NOT guess authentication requirements
- DO NOT assume data model structures or field types
- DO NOT infer API contracts from frontend code alone

- ALWAYS fetch the real Swagger/OpenAPI specification from the running service
- ALWAYS validate the Swagger response is valid JSON
- ALWAYS extract exact schemas, not approximations
- **If Swagger fetch fails**: Document as a blocker and request manual API documentation rather than guessing

**Every API detail must come from the actual service specification.** Assumptions lead to incorrect Specs and failed implementations.

## When to Use This Skill

This skill provides domain knowledge for:

- Understanding service registration file patterns in the workspace
- Resolving environment URL mappings from configuration files
- Mapping service paths to base URLs
- Identifying Swagger endpoint conventions
- Understanding the platform service architecture

**For actual backend discovery**: Invoke the Backend Service Discovery Agent.

---

## Architecture Reference

The following sections provide domain knowledge about the workspace's backend service architecture. This information is used by the Backend Service Discovery Agent during automated discovery.

### Step 1: Identify Affected Apps

From the Requirement Brief, determine which apps are impacted by the feature.

### Step 2: Service Registration File Discovery

Scan DI configuration files for service URL registrations. These files vary by tech stack but follow consistent patterns:

```bash
# Search patterns to try (adapt to project structure and tech stack)
# General patterns (always try these first)
**/*service-config*
**/*service-registry*
**/*tokens*
**/*environment*

# Stack-specific patterns are defined in the tech-layer's
# backend-service-discovery agent override
```

Look for service URL registrations such as:

- Named/typed service registrations with environment-specific base URLs
- Dependency injection tokens that compose environment URLs with service paths
- Configuration objects mapping service names to endpoint URLs

### Step 3: Extract Service URLs via Service Registration Patterns

Service registrations typically compose a base URL (from environment configuration) with a service-specific path. Look for patterns like:

```
// Pattern: DI token / service locator composing base URL + service path
// SERVICE_BASE_URI = override ?? (ENVIRONMENT_BASE_URL + "/service-path")
// (exact syntax depends on tech stack — see tech-layer override for examples)
```

**Extract Key Components**:

- **Service identifier**: The token name, interface name, or configuration key
- **Service path**: The path segment appended to the base URL (e.g., `/closeouts`)
- **Override support**: Whether the service supports runtime URL overrides
- **Base URL source**: The environment configuration that provides the base URL

### Step 3.5: Environment URL Mapping from Configuration Files

The base URL typically resolves differently per environment. Look for environment mapping in configuration files (e.g. `.env`, environment config files, or stack-specific config formats — see tech-layer override for file name conventions):

**Example environment mapping (adapt to project conventions)**:

| Environment | Base URL |
| --- | --- |
| `dev` | `https://dev-services.example.com` |
| `stg` | `https://stg-services.example.com` |
| `prod` | `https://services.example.com` |

**Resolved Service URL Example**:

For a service registered with path `/myservice`:

- **Dev**: `https://dev-services.example.com/myservice`
- **Stg**: `https://stg-services.example.com/myservice`
- **Prod**: `https://services.example.com/myservice`

### Step 4: Construct Swagger Endpoint

Once you have the resolved base URL, try these Swagger/OpenAPI patterns in order:

1. `{baseUrl}/swagger/v1/swagger.json`
2. `{baseUrl}/swagger/index.html`
3. `{baseUrl}/swagger.json`
4. `{baseUrl}/openapi.json`
5. `{baseUrl}/api-docs`

> The correct default path varies by framework. The tech-layer override specifies the most common pattern for this stack.

Example:

``` text
Base URL: https://dev-services.example.com/estimatedata
Swagger URL: https://dev-services.example.com/estimatedata/swagger/v1/swagger.json
```

### Step 5: Fetch Swagger Specification (with Authentication)

Use HTTP GET to retrieve the Swagger spec:

```bash
curl -H "Authorization: Bearer {token}" \
  https://dev-services.example.com/estimatedata/swagger/v1/swagger.json
```

**Validation**:

- Response is valid JSON
- Contains `openapi` or `swagger` version field
- Contains `paths` object with endpoints
- Contains `components` or `definitions` with schemas

**If validation fails**:

- DO NOT fabricate a fake Swagger spec
- DO NOT assume endpoint structure from frontend code
- DO NOT continue with Specs generation without real data
- Document the failure and mark as blocker requiring manual API documentation

### Step 6: Extract Key Information

From the Swagger spec, extract:

**Service Metadata**:

- Title, version, description
- Base path

**Endpoints** (for each path):

- HTTP method (GET, POST, PUT, DELETE)
- Path (e.g., `/Estimate/list`)
- Operation ID and summary
- Parameters (path, query, header)
- Request body schema
- Response schemas by status code
- Authentication requirements

**Schemas/Models**:

- Data model names (e.g., `EstimateView`, `CopyEstimateRequest`)
- Property types and descriptions
- Required fields

### Step 7: Document in Technical Context

Include in the "Backend Service Dependencies" section of Technical Context:

```markdown
## Backend Service Dependencies

### {Service Name}

- **Apps Using**: `{app1}`, `{app2}`
- **Service Identifier**: `{SERVICE_IDENTIFIER}` (`{propertyName}`)
- **Dev URL**: `{devUrl}`
- **Swagger**: `{swaggerPath}`
- **Version**: `{version}`
- **Authentication**: Bearer Token (required)

**Key Endpoints**:

1. **{METHOD} {path}** - {summary}
   - Request: `{RequestType}`
   - Response: `{ResponseType}`
   - Auth: Required

**Data Models** (from Swagger):

\`\`\`
// Model: {ModelName}
// {property}: {type} — {description}
// (render in the target stack's type syntax)
\`\`\`
```

## Expected Output

### Successful Discovery

```json
{
  "name": "Estimate Data Service",
  "app": "myapp",
  "propertyName": "estimateDataURI",
  "devUrl": "https://dev-services.example.com/estimatedata",
  "discoveredFrom": "service registration file",
  "filePath": "src/config/services.ts",
  "swagger": {
    "success": true,
    "swaggerUrl": "https://dev-services.example.com/estimatedata/swagger/v1/swagger.json",
    "version": "1.0",
    "endpoints": [
      {
        "path": "/Estimate",
        "method": "POST",
        "summary": "Create new estimate",
        "requestBody": { "$ref": "#/components/schemas/EstimateView" },
        "responses": {
          "200": { "$ref": "#/components/schemas/EstimateView" }
        }
      }
    ],
    "schemas": {
      "EstimateView": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    }
  }
}
```

### Swagger Fetch Failed

```json
{
  "name": "Unknown Service",
  "devUrl": "https://example.com/api",
  "swagger": {
    "success": false,
    "error": "404 Not Found",
    "triedPatterns": [
      "/swagger/v1/swagger.json",
      "/swagger.json",
      "/openapi.json"
    ]
  },
  "manualReviewRequired": true
}
```

## Common Issues & Solutions

### Issue: No Services Found

**Solution**: Verify service registration files exist in configuration locations. Check naming patterns match `*_URI`, `*_BASE_URI`, `*ServiceUrl`, or project-specific conventions.

### Issue: Swagger 404

**Solution**: Try accessing Swagger URL in browser. Check if service exposes Swagger at different path. Some services may require authentication.

### Issue: Swagger 401/403

**Solution**: Set `BACKEND_SERVICE_AUTH_TOKEN` environment variable with valid Bearer token.

### Issue: Model Changes Not Detected

**Solution**: Always run this skill when:

- Feature modifies existing DTOs/interfaces
- Feature adds new data models
- API request/response schemas change
- Database schema migrations occur

**CRITICAL**: Do NOT make assumptions about API contracts. If backend service discovery is triggered and you cannot fetch Swagger:

1. **Document the blocker**: State which service, attempted URLs, error messages
2. **Mark for manual review**: Flag in Technical Context as "Backend API Documentation Required"
3. **Do NOT proceed**: Do not template fake endpoints or schemas
4. **Escalate**: Request actual API documentation from backend team before continuing Specs

**Remember**: One wrong assumption about an API contract can invalidate the entire Specs.

## Service Registration Patterns

Different tech stacks use different patterns for registering service URLs. The key is to find wherever the service base URL is composed and injected. Common conceptual patterns:

```
// Pattern 1: DI token / service locator with environment-driven base URL
// SERVICE_URI = override ?? (ENVIRONMENT_BASE_URL + "/service-path")

// Pattern 2: Configuration-driven registration
// httpClient.baseAddress = config["Services:ServiceName:BaseUrl"]

// Pattern 3: Static environment config file
// { "Services": { "ServiceName": { "BaseUrl": "https://..." } } }

// Stack-specific syntax for these patterns is defined in the
// tech-layer's backend-service-discovery agent override.
```

**Key benefits of discoverable service registration**:

- Single source of truth: environment configuration drives URL resolution
- Environment-aware: automatically resolves per dev/stg/prod
- Override support: services can allow local testing overrides
- Type-safe: registrations are validated by the type system

