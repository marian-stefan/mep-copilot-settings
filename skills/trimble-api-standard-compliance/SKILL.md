---
name: trimble-api-standard-compliance
description: Checks any added or changed HTTP endpoint against the current Trimble API Standard, fetched live rather than from memory. Applies across every tech layer — the standard governs HTTP API shape, independent of implementation language.
---

# Trimble API Standard Compliance

Any endpoint being added or changed (resource naming, HTTP verb choice, status codes,
pagination, error payload shape, versioning, standard data items, security) must conform to
the [Trimble API Standard](https://developer.trimble.com/docs/api-standard/).

## Rule

It is a versioned **living standard** — do not rely on a memorized or previously-cached copy of
its rules. At review or implementation time, fetch the current text before checking or writing
endpoint-shape code:

```text
https://developer.trimble.com/docs/api-standard/_llms-txt/latest.txt
```

That single URL returns the complete current standard as plain text (every section below in
full, with normative MUST/SHOULD rules). Fetch it at most once per review or implementation pass,
rather than crawling the individual `/docs/api-standard/specification/latest/*` sub-pages.

**Sections that apply to endpoint-shape review**: Resource Naming, HTTP Verbs, Data Interchange
Formats, Service Responses (status codes), API Versioning, Standard Error Payload, Searching and
Filtering, Pagination/Continuation, Sorting, Standard Metadata, Standard Data Items, Standard
Units of Measure, Links Protocol, Security Considerations. (Caching and Bulk Operations are
informational/not yet normative as of the latest release — check the fetched text for current
status.)

Cite the specific fetched rule, plus the standard's version or release date as shown in the fetched text, in any finding — do not paraphrase from memory or assume a prior fetch is still current.

## Scope

This applies to any HTTP API endpoint in any tech layer — the standard governs resource shape
and protocol conventions, not language or framework. It is not duplicated per tech layer; a
tech layer's own `{stack}-patterns/SKILL.md` covers language-specific implementation patterns
and links here for API-shape compliance instead of restating this rule.

## When to Apply

- **Code Reviewer**: any changeset that adds or modifies an HTTP endpoint.
- **Code Reviewer, fix iterations** (`focusFiles` / `priorFindings` passed): fetch and re-check only if a `focusFiles` hunk adds or modifies an endpoint, or a prior finding cites this standard. Otherwise skip the fetch; the earlier review already covered the unchanged endpoints.
- **Implementation research**: when designing a new endpoint's
  shape before implementation.
