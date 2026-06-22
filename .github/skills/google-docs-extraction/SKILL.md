---
name: google-docs-extraction
description: Extract content from Google Docs and Presentations referenced in Jira tickets (description, comments, attachments, custom fields) using an n8n webhook with automated OAuth token management.
---

# Google Docs Extraction

This skill enables detection and extraction of content from Google Docs and Google Presentations referenced anywhere in a Jira ticket (description, comments, attachments, custom fields) via an n8n workflow, with automated OAuth bearer token management.

## Configuration

> **Adopter note**: This skill uses an OAuth 2.0 + n8n webhook integration. Replace all `{YOUR_*}` placeholders below with your organization's values before deploying. These are intentionally left as placeholders in the base harness.

### Required Environment Variables

| Variable | Description | Example |
|-----------|-------------|---------|
| `YOUR_CLIENT_ID_VAR` | OAuth 2.0 Client ID environment variable name (org-specific) | `MY_ORG_CLIENT_ID` |
| `YOUR_CLIENT_SECRET_VAR` | OAuth 2.0 Client Secret environment variable name (org-specific) | `MY_ORG_CLIENT_SECRET` |
| `YOUR_OAUTH_SCOPE` | OAuth scope required for n8n webhook access | `{org-defined-scope}` |

### Optional Environment Variables

| Variable | Description | Default | Production Value |
|----------|-------------|---------|-----------------|
| `YOUR_OAUTH_ENDPOINT` | OAuth token endpoint | `{YOUR_STAGING_OAUTH_ENDPOINT}` | `{YOUR_PROD_OAUTH_ENDPOINT}` |
| `N8N_WEBHOOK_URL` | n8n webhook base URL | `{YOUR_STAGING_WEBHOOK_URL}` | `{YOUR_PROD_WEBHOOK_URL}` |

### Environment Setup

```bash
# Configure your org-specific OAuth credentials
export YOUR_CLIENT_ID_VAR="your-client-id"
export YOUR_CLIENT_SECRET_VAR="your-client-secret"
export YOUR_OAUTH_SCOPE="your-oauth-scope"

# Override endpoints for production
export YOUR_OAUTH_ENDPOINT="{YOUR_PROD_OAUTH_ENDPOINT}"
export N8N_WEBHOOK_URL="{YOUR_PROD_WEBHOOK_URL}"
```

## When to Use This Skill

Use this skill when you need to:

- Extract content from Google Docs attached to Jira tickets
- Extract content from Google Presentations attached to Jira tickets
- Enrich requirement briefs with detailed document content
- Automate document analysis in Specs workflows

## Core Capabilities

### 1. OAuth Token Management

- Automatic token fetch from Trimble OAuth endpoint
- Token caching with expiry tracking (60s safety buffer)
- Auto-refresh when token expires
- Secure credential management via environment variables

### 2. Document Content Extraction

- GET request to n8n webhook with URL parameter
- Automated bearer token injection
- Structured content response handling
- Error handling for failed extractions

### 3. Jira Integration

- Detect Google Docs/Presentations referenced in Jira tickets (description, comments, attachments, custom fields)
- Filter by URL patterns (and MIME type for attachments when available)
- Aggregate extracted content for requirement briefs

## Usage Examples

### Example 1: Extract Single Google Doc

```javascript
const { extractDocument } = require('./.github/skills/google-docs-extraction/document-extractor.js');

const env = {
  CLIENT_ID: process.env[YOUR_CLIENT_ID_VAR],
  CLIENT_SECRET: process.env[YOUR_CLIENT_SECRET_VAR],
  OAUTH_SCOPE: process.env.YOUR_OAUTH_SCOPE
};

const result = await extractDocument('https://docs.google.com/document/d/ABC123/edit', env);
console.log('Extracted content:', result);
```

### Example 2: Batch Extract from Multiple Docs

```javascript
const googleDocUrls = [
  'https://docs.google.com/document/d/DOC1/edit',
  'https://docs.google.com/presentation/d/PRES1/edit'
];

const results = await Promise.all(
  googleDocUrls.map(url => extractDocument(url, env))
);
```

### Example 3: Extract from Jira Attachments

```javascript
// Inside Jira Analyst workflow
const attachments = jiraIssue.fields.attachment;
const googleDocs = attachments.filter(att => 
  att.content.includes('docs.google.com/document') ||
  att.content.includes('docs.google.com/presentation')
);

for (const doc of googleDocs) {
  try {
    const content = await extractDocument(doc.content, env);
    documentContents[doc.filename] = content;
  } catch (error) {
    openQuestions.push(`Failed to extract ${doc.filename}: ${error.message}`);
  }
}
```

## Guidelines

1. **Environment Variables** - Always validate required environment variables before calling helper
2. **Error Handling** - Wrap extraction calls in try-catch blocks
3. **Token Caching** - Helper automatically caches tokens; reuse helper instance when possible
4. **Rate Limiting** - Be mindful of OAuth token rate limits; don't create new tokens unnecessarily
5. **Logging** - Log extraction failures to Open Questions for manual review
6. **Timeout Handling** - Set reasonable timeouts for n8n webhook calls (default: 30s)
7. **URL Encoding** - Document URLs are automatically URL-encoded in query parameters

## Common Patterns

### Pattern: Detect Google Documents

```javascript
function isGoogleDoc(attachment) {
  const url = attachment.content || '';
  return url.includes('docs.google.com/document') || 
         url.includes('docs.google.com/presentation');
}
```

### Pattern: Safe Extraction with Fallback

```javascript
async function safeExtract(url, env) {
  try {
    return await extractDocument(url, env);
  } catch (error) {
    console.error(`Extraction failed for ${url}:`, error.message);
    return { error: error.message, url };
  }
}
```

### Pattern: Add to Requirement Brief

```javascript
// Append extracted content to Requirement Brief
if (documentContents.size > 0) {
  requirementBrief += '\n\n## Attached Documents\n\n';
  for (const [filename, content] of documentContents) {
    requirementBrief += `### ${filename}\n${content}\n\n`;
  }
}
```

## Error Handling & Validation Gates

### CRITICAL Validation Gates (Hard Stop Conditions)

These conditions MUST be verified before proceeding with document extraction:

#### 1. **Missing OAuth Credentials** 🔴 HARD STOP

If the OAuth client ID or client secret environment variables are not set, document extraction cannot proceed. The Jira Analyst agent must exit with clear remediation steps referencing the variable names configured for this deployment.

#### 2. **OAuth Token Fetch Failure** 🟠 Escalate to Manual Review

If OAuth token fetch fails (401 Unauthorized or network error), escalate with remediation: verify credentials, check OAuth scope, confirm Trimble ID endpoint accessibility.

#### 3. **n8n Webhook Unreachable** 🟠 Escalate to Manual Review

If n8n webhook returns 5xx errors or is unreachable, escalate with remediation: verify webhook is running, check network connectivity, contact DevOps if needed.

#### 4. **Document Access Denied** 🟡 Add to Open Questions

If a critical document returns 403 Forbidden, log in Open Questions and allow Specs generation to continue without that document's content.

### Pre-Output Validation Checklist

Before returning from the Jira Analyst workflow (step 3.5 in `jira-analyst.agent.md`):

- [ ] OAuth credentials validated (if missing: HARD STOP with remediation)
- [ ] All detected Google Docs URLs processed (success or documented failure)
- [ ] No critical errors encountered (if critical errors: escalate to manual review)
- [ ] Failed documents logged in "Open Questions" section
- [ ] Extracted content appended to "Attached Documents" subsection
- [ ] Document metadata (source, extraction time) included

## Limitations

- Requires Node.js environment (browser environments not supported)
- OAuth credentials must be pre-configured in environment
- n8n webhook must be accessible from agent runtime
- Document URLs must be publicly accessible or agent must have permissions
- Large documents may exceed response size limits
- Extracted content is plain text (formatting not preserved)
- Real-time collaborative edits may not be captured
