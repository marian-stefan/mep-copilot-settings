---
name: specs-generation-angular
description: Angular/Nx plugin extension for Specs generation. Adds stack-specific architecture, implementation, and testing guidance to the technology-agnostic core template.
---

# Specs Generation Angular Plugin

This skill contains Angular and Nx-specific guidance that extends the technology-agnostic core template at `.github/skills/specs-generation-core/SKILL.md`.

Use this skill only when the resolved technology plugin is `angular`.

---

## Specs Section - Overview

**Used in**: Story/Task Specs (Section 1)

### 1. Overview

- **Jira Ticket**: {JIRA_KEY}
- **Goal**: Clear objective (what problem does this solve?)
- **Success Criteria**: Measurable outcomes
- **Priority**: Based on ticket priority
- **Estimated Complexity**: (Low/Medium/High/Very High)

**Quality Gates** (apply before saving the Specs file):

- At least one user story present
- Acceptance criteria are testable and linked to FRs
- Technical Context included or referenced
- Security section completed with at least one threat and mitigation
- Filename follows `SPEC-{JIRA_KEY}-Plan.md`

---

## Specs Section - Background & Context

**Used in**: Story/Task Specs (Section 2)

### 2. Background & Context

- **Business Context**: Why this feature is needed
- **User Story/Scenario**: Who will use this and how
- **Dependencies**: Related features, tickets, or initiatives

---

## Specs Section - Requirements

**Used in**: Story/Task Specs (Section 3)

### 3. Requirements

#### 3.1 Functional Requirements

- FR-1: {Detailed functional requirement}
- FR-2: {Another requirement}
- ...

#### 3.2 Non-Functional Requirements

- **Performance**: Response time, rendering, change detection strategy
- **Security**: Authentication, authorization, data validation, XSS prevention
- **Accessibility**: WCAG compliance, keyboard navigation, screen reader support
- **Usability**: UX patterns, error handling, loading states
- **Maintainability**: Code organization, documentation, test coverage

---

## Specs Section - Technical Architecture

**Used in**: Story/Task Specs (Section 4)

### 4. Technical Architecture

#### 4.1 Nx Library Structure

> **Reference**: Follow library types, naming, and layering rules defined in `.github/skills/nx-patterns/SKILL.md`

**New Libraries to Create**:

- `libs/{domain}/{feature-name}/feature` - Smart components, feature orchestration
- `libs/{domain}/{feature-name}/ui` - Presentational components
- `libs/{domain}/{feature-name}/data-access` - NgRx state, facades, services
- `libs/{domain}/{feature-name}/api` - Interfaces, DTOs, type contracts
- `libs/{domain}/{feature-name}/util` - Pure utility functions (if needed)

**Existing Libraries to Modify**:

- `libs/{domain}/{existing-lib}` - {reason for modification}

**Dependency Graph Impact**:

- New dependencies: {list}
- Affected dependents: {list}
- Layering validation: Confirm no violations (ui→feature, data-access→feature, cross-domain coupling)

#### 4.2 Component Architecture

> **Reference**: Follow code patterns from `.github/copilot-instructions.md` for best practices

**Smart Components** (feature libs):

- `{ComponentName}Component` - {purpose, responsibilities}
  - Standalone: true
  - Inputs: {list with types, mark required where applicable}
  - Outputs: {list with types}
  - Uses: {facades, services injected via inject()}

**Presentational Components** (ui libs):

- `{ComponentName}Component` - {purpose, presentation logic only}
  - Standalone: true
  - Inputs: {data to display}
  - Outputs: {user actions}
  - No direct service injection

**Template Patterns**:

- MUST use modern control flow: `@if`, `@for`, `@switch`, `@defer`
- NO legacy directives: `*ngIf`, `*ngFor`, `*ngSwitch`
- Always use `@for (item of items; track item.id)` with explicit tracking
- Use `@defer` for lazy-loaded heavy components

#### 4.3 State Management Strategy

> **Reference**: State patterns in `.github/copilot-instructions.md`

**NgRx Store** (for global/shared state):

Specify file structure:

- `{domain}-{feature}.state.ts` - State interface
- `{domain}-{feature}.actions.ts` - Action creators
- `{domain}-{feature}.reducer.ts` - Use createFeature() with createReducer()
- `{domain}-{feature}.effects.ts` - API interactions, side effects
- `{domain}-{feature}.selectors.ts` - Memoized selectors
- `{domain}-{feature}.facade.ts` - Public API (inject Store)

**Signals** (for local component state):

- `signal()` for reactive local state
- `computed()` for derived values
- `effect()` sparingly for side effects

**RxJS Subscription Management**:

- ALWAYS use `takeUntilDestroyed()` for subscriptions in components

#### 4.4 API Integration


 **API Contracts and Endpoints**:
#### 4.4 API Integration

 **API Contracts and Endpoints**:
> If backend services were discovered, include a table with service details from Technical Context:

| Service | Environment | Base URL | Version | Auth |
| --------- | ------------- | ---------- | --------- | ------ |
| {Service Name} | Dev | `{devUrl}` | {version} | {auth type} |

 **Key Endpoints**:

1. **{METHOD} {path}** - {summary}
   - Request: `{RequestType}` ({key fields})
   - Response: `{ResponseType}` ({key fields})
   - Auth: {Required/Optional}

**Service Layer** (`data-access` lib):

- Use `inject()` for HttpClient and dependencies
- Implement proper error handling
- Return typed Observables
- Reference environment configuration for base URLs

**REQUIRED**: All backend service data (endpoints, schemas, authentication) must be extracted from Swagger/OpenAPI specifications.

**Example Service Implementation**:

```typescript
@Injectable({ providedIn: 'root' })
export class {ServiceName}Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.{propertyName}; // From environment.dev.ts
  
  {methodName}(request: {RequestType}): Observable<{ResponseType}> {
    return this.http.{method}<{ResponseType}>(
      `${this.apiUrl}{endpoint}`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    // Proper error handling
    return throwError(() => new Error(error.message));
  }
}
```

**API Contracts** (`api` lib):

> Include TypeScript interfaces derived from Swagger schemas:

```typescript
// Generated from Swagger specification
export interface {RequestType} {
  {field}: {type}; // {description from Swagger}
  // ... other fields
}

export interface {ResponseType} {
  {field}: {type};
  // ... other fields
}
```

- Define interfaces for entities
- Create DTOs for requests/responses
- Keep free of runtime logic

#### 4.5 Routing & Navigation

- **Route Path**: /{parent-route}/{feature-route}
- **Route Configuration**: Standalone component lazy loading
- **Guards**: List CanActivate, CanMatch guards needed
- **Route Parameters**: List params and query params

#### 4.6 Security Implementation

> **Reference**: Apply security patterns from `.github/instructions/security.instructions.md`

**Security Requirements Specific to This Feature**:

- Authentication: {guards needed}
- Authorization: {permission checks}
- Data Validation: {input sanitization points}
- XSS Prevention: {specific concerns if any}

**DO NOT**:

- Hardcode tokens or secrets
- Use `bypassSecurityTrust*` without justification
- Skip input validation

#### 4.7 UI/UX Components

Specify which third-party or custom components to use:

- **DevExtreme**: dx-data-grid, dx-popup, dx-form (if applicable)
- **Wijmo**: wj-flex-grid (if applicable)
- **Material**: mat-{component} (if applicable)
- **Custom MEP**: mep-grid, mep-dialog, mep-toolbar, mep-spinner, mep-toast

---

## Specs Section - Security Analysis

**Used in**: Story/Task Specs (Section 5)

> **CRITICAL**: This section is Required. Failure to identify threat vectors is a validation failure.

This section explicitly identifies potential security threats introduced by this feature and outlines mitigation strategies.

### 5. Security Analysis

#### 5.1 Threat Surface

**What new attack surfaces does this feature introduce?**

- New API endpoints exposed
- New data entry points (forms, inputs)
- New data storage (localStorage, IndexedDB, cookies)
- New third-party integrations
- New file upload/download capabilities
- New authentication/authorization points

#### 5.2 Potential Threat Vectors

**REQUIRED**: Explicitly identify threats in each category:

##### **Injection Risks**

- **XSS (Cross-Site Scripting)**:

  - User input fields that render HTML: {list specific inputs}
  - Dynamic content rendering: {identify components}
  - Mitigation: Use Angular's built-in sanitization, avoid `bypassSecurityTrust*`, use `[innerText]` instead of `[innerHTML]`

- **SQL/NoSQL Injection** (if applicable):

  - API endpoints accepting query parameters: {list endpoints}
  - Mitigation: Parameterized queries on backend, input validation

- **Command Injection** (if applicable):
  - File operations, system commands
  - Mitigation: Whitelist allowed operations, validate file paths

##### **Data Exposure Risks**

- **Sensitive Data Handling**:

  - What sensitive data is handled: {PII, credentials, financial data, etc.}
  - Where it's stored: {memory only, localStorage, API}
  - Who can access it: {role-based access}
  - Mitigation: Encrypt at rest, use HTTPS, implement proper RBAC, minimize logging of sensitive data

- **Logging Risks**:
  - What data is logged: {ensure no PII/passwords in logs}
  - Mitigation: Sanitize logs, use redaction for sensitive fields

##### **Authentication & Authorization Risks**

- **New Protected Routes**:

  - Routes requiring authentication: {list routes}
  - Required permissions/roles: {list roles}
  - Mitigation: Implement CanActivate/CanMatch guards, verify on backend

- **Token Handling**:

  - Where tokens are stored: {HttpOnly cookies preferred}
  - Token refresh mechanism: {describe}
  - Mitigation: Short-lived tokens, secure storage, CSRF protection

- **Authorization Bypass**:
  - Client-side permission checks: {list where}
  - Mitigation: Always verify permissions on backend, never trust client checks alone

##### **Third-Party Dependencies**

- **New Libraries Introduced**:
  - Library name & version: {list}
  - Known vulnerabilities: {check npm audit}
  - Supply chain risks: {verify package integrity}
  - Mitigation: Pin versions, regular security updates, review license compatibility

##### **Client-Side Risks**

- **Local Storage/Session Storage**:

  - What data is stored: {list}
  - Risk: Accessible via XSS
  - Mitigation: Store only non-sensitive data, use HttpOnly cookies for tokens

- **Cookies**:

  - Cookie attributes: {Secure, HttpOnly, SameSite}
  - Mitigation: Proper cookie configuration for CSRF protection

- **DOM Manipulation**:
  - Dynamic element creation: {identify locations}
  - Risk: Potential XSS via unsafe innerHTML
  - Mitigation: Use Renderer2, sanitize inputs, avoid direct DOM manipulation

##### **CSRF (Cross-Site Request Forgery)**

- **State-Changing Operations**:
  - POST/PUT/DELETE endpoints: {list}
  - Mitigation: Use Angular's HttpClientXsrfModule, verify CSRF tokens on backend

#### 5.3 Security Checklist Reference

Apply the following items from `.github/instructions/security.instructions.md`:

- [ ] Token handling: No hardcoded tokens, proper refresh mechanism
- [ ] Data access: Validate user permissions before data operations
- [ ] XSS prevention: Use Angular sanitizer, avoid bypass methods
- [ ] CSRF protection: HttpClientXsrfModule configured
- [ ] Route security: Guards implemented for protected routes
- [ ] Input validation: All user inputs validated and sanitized
- [ ] Error messages: Don't expose sensitive system information
- [ ] Subscription management: Use takeUntilDestroyed to prevent memory leaks

#### 5.4 Security Testing Requirements

**Security-Specific Tests**:

- [ ] Attempt to access protected routes without authentication
- [ ] Attempt to perform actions without proper authorization
- [ ] Test input validation with malicious payloads (XSS, SQL injection attempts)
- [ ] Verify CSRF token validation on state-changing operations
- [ ] Test with different user roles to ensure proper RBAC
- [ ] Verify sensitive data is not logged or exposed in error messages

**Security Review Triggers**:

- Any use of `bypassSecurityTrust*` methods → Requires justification and approval
- Any new authentication/authorization logic → Security team review
- Any handling of PII or sensitive data → Privacy team review
- Any new API endpoints → Backend security review

#### 5.5 Mitigation Summary

**Primary Defenses**:

1. {Top mitigation strategy for this feature}
2. {Second most important mitigation}
3. {Third mitigation}

**Monitoring & Alerts**:

- What security events should be logged: {authentication failures, authorization denials, suspicious inputs}
- Alert thresholds: {e.g., 5 failed auth attempts in 1 minute}

---

## Specs Section - Implementation Plan

**Used in**: Story/Task Specs (Section 6)

### 6. Implementation Plan

**CRITICAL**: This section must be concrete and actionable. Include:
- **Exact file paths** from Technical Context (no placeholders)
- **Code snippets** showing key changes (imports, state additions, template bindings)
- **Step numbers** with clear dependencies
- **Reference to Technical Context** for complete implementation details
- **Always use the existing codebase and patterns** as the source of truth (do not suggest new patterns or structures not already present in the codebase if not explicitly supported by the Technical Context)

**Structure**: Organize by phase with specific files and code examples per step.

---

#### Phase 1: Setup & Infrastructure

**If new libraries needed:**

1. Generate Nx libraries with exact commands:

```bash
# Example: Create new feature library
nx g @nx/angular:lib {feature-name} \
  --directory=libs/{domain}/{feature-name}/feature \
  --importPath=@mep/{domain}-{feature-name}-feature \
  --tags=domain:{domain},type:feature,scope:lib \
  --standalone
```

2. Create API contracts in `libs/{domain}/{feature}/api/src/lib/{name}.ts`:

```typescript
// Example interface from Technical Context
export interface {EntityName} {
  id: string;
  // ... fields from Swagger or Technical Context
}
```

3. Update `project.json` tags:

```json
{
  "tags": ["domain:{domain}", "type:feature", "scope:lib"]
}
```

**If modifying existing libraries:** Skip to Phase 2.

---

#### Phase 2: Data Layer

**For NgRx state changes:**

1. **Update State Interface** (`libs/{domain}/{feature}/data-access/src/lib/+state/{name}.state.ts`):

```typescript
export interface {Feature}State {
  // ... existing properties
  {newProperty}: {Type};  // Add new state property
}

export const initial{Feature}State: {Feature}State = {
  // ... existing
  {newProperty}: {defaultValue},
};
```

2. **Add Actions** (`libs/{domain}/{feature}/data-access/src/lib/+state/{name}.actions.ts`):

```typescript
export const {actionName} = createAction(
  '[{Feature}] {Action Description}',
  props<{ payload: {Type} }>()
);
```

3. **Update Reducer** (`libs/{domain}/{feature}/data-access/src/lib/+state/{name}.reducer.ts`):

```typescript
on({actions}.{actionName}, (state, { payload }) => ({
  ...state,
  {property}: payload,
})),
```

4. **Add Selectors** (`libs/{domain}/{feature}/data-access/src/lib/+state/{name}.selectors.ts`):

```typescript
export const select{PropertyName} = createSelector(
  select{Feature}State,
  (state) => state.{property}
);
```

5. **Expose via Facade** (`libs/{domain}/{feature}/data-access/src/lib/{name}.facade.ts`):

```typescript
public readonly {property}$ = this.store.select(
  {selectors}.select{PropertyName}
);
```

**For service implementations:**

1. **Create/Update Service** (`libs/{domain}/{feature}/data-access/src/lib/{name}.service.ts`):

```typescript
@Injectable({ providedIn: 'root' })
export class {ServiceName}Service {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.{apiProperty};

  {methodName}(request: {RequestType}): Observable<{ResponseType}> {
    return this.http.{method}<{ResponseType}>(
      `${this.baseUrl}/{endpoint}`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }
}
```

---

#### Phase 3: UI Components

**For presentational components (ui lib):**

1. **Create Component** (if new):

```bash
nx g @nx/angular:component {component-name} \
  --project={domain}-{feature}-ui \
  --standalone \
  --changeDetection=OnPush
```

2. **Component Class** (`libs/{domain}/{feature}/ui/src/lib/{component}/{component}.component.ts`):

```typescript
@Component({
  selector: '{prefix}-{component-name}',
  standalone: true,
  imports: [CommonModule /* add needed imports */],
  templateUrl: './{component-name}.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class {ComponentName}Component {
  // Inputs
  public readonly data = input.required<{Type}>();
  
  // Outputs
  public readonly action = output<{Type}>();
  
  // Computed
  protected readonly computed = computed(() => {
    // Derive value from inputs
  });
}
```

3. **Template** (`{component-name}.component.html`):

```html
<!-- Use modern control flow -->
@if (data(); as item) {
  <div class="{component-class}">
    @for (item of items(); track item.id) {
      <{prefix}-child [data]="item" (action)="action.emit($event)" />
    }
  </div>
}
```

**For smart components (feature lib):**

1. **Component Class** (`libs/{domain}/{feature}/feature/src/lib/{component}/{component}.component.ts`):

```typescript
export class {ComponentName}Component {
  // Inject facade/services
  private readonly facade = inject({Feature}Facade);
  private readonly destroyRef = inject(DestroyRef);
  
  // Subscribe to state
  protected readonly data$ = this.facade.{property}$;
  
  // Handle actions
  protected on{Action}(payload: {Type}): void {
    this.facade.dispatch{Action}(payload);
  }
  
  // Cleanup subscriptions
  constructor() {
    this.data$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(/* ... */);
  }
}
```

---

#### Phase 4: Integration

**For routing changes:**

1. **Update Routes** (`apps/{app}/src/app/app.routes.ts` or feature routes):

```typescript
export const routes: Routes = [
  {
    path: '{route-path}',
    loadComponent: () => import('./path/to/component').then(m => m.{Component}),
    canActivate: [{GuardName}],  // If auth required
  },
];
```

2. **Add Guards** (if needed):

```typescript
export const {guardName}: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated$;
};
```

**For forms:**

1. **Typed Reactive Forms** (in component):

```typescript
private readonly fb = inject(FormBuilder);

protected readonly form = this.fb.group<{FormInterface}>({
  {field}: this.fb.control<{Type}>({defaultValue}, {
    validators: [Validators.required],
    nonNullable: true,
  }),
});

protected onSubmit(): void {
  if (this.form.valid) {
    const value = this.form.getRawValue();
    // Dispatch action or call service
  }
}
```

---

#### Phase 5: Testing

**Unit tests** (key examples, not exhaustive):

1. **Component Test** (`{component}.component.spec.ts`):

```typescript
it('should emit action when user clicks button', () => {
  const actionSpy = jasmine.createSpy('action');
  component.action.subscribe(actionSpy);
  
  // Trigger action
  component.on{Action}({ id: '123' });
  
  expect(actionSpy).toHaveBeenCalledWith({ id: '123' });
});
```

2. **Reducer Test** (`{name}.reducer.spec.ts`):

```typescript
it('should update state on {action}', () => {
  const action = {actions}.{actionName}({ payload: {value} });
  const result = {reducer}(initial{Feature}State, action);
  
  expect(result.{property}).toEqual({value});
});
```

3. **Selector Test** (`{name}.selectors.spec.ts`):

```typescript
it('should select {property}', () => {
  const state = { {property}: {value} };
  const result = {selectors}.select{Property}.projector(state);
  
  expect(result).toEqual({value});
});
```

---

#### Phase 6: Polish & Documentation

1. **Error Handling**: Add try-catch in effects, handle HttpErrorResponse
2. **Loading States**: Add loading flags to state, bind to UI spinners
3. **Update README**: Document new components/services in library README.md

---

**Implementation Notes:**

- Reference **Technical Context** for:
  - Complete file paths and affected components list
  - Full DTO/interface definitions from Swagger
  - Detailed security considerations
  - Complete test coverage requirements

- All code snippets above are **examples** showing the pattern; actual field names, types, and logic come from the Technical Context.

- Follow `.github/skills/nx-patterns/SKILL.md` for library structure and `.github/copilot-instructions.md` for Angular patterns.

---

## Specs Section - Testing & Acceptance

**Used in**: Story/Task Specs (Sections 7-8)

### 7. Testing Strategy

- **Unit Tests**: Components, services, effects, reducers, selectors (>80% coverage)
- **Integration Tests**: Feature workflows, state management flows
- **E2E Tests**: Note that QA team handles E2E; developer responsibility is unit/integration coverage

#### 7.1 Acceptance Criteria

**Functional**:

- [ ] {Specific testable criterion from FR-1}
- [ ] {Specific testable criterion from FR-2}
- [ ] All user interactions work as expected
- [ ] Data persists correctly
- [ ] Error scenarios handled gracefully

**Technical**:

- [ ] All new code follows Angular 20+ patterns
- [ ] Nx dependency graph has no violations
- [ ] All tests pass (unit, integration)
- [ ] Code coverage >80% for new code
- [ ] No console errors or warnings
- [ ] Passes linting and formatting checks
- [ ] No security vulnerabilities introduced

**Performance**:

- [ ] Initial load <2s
- [ ] UI interactions <100ms
- [ ] API calls use proper loading states
- [ ] OnPush change detection where appropriate

**Accessibility**:

- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] ARIA labels on interactive elements

---

## Specs Section - Risk Assessment & Rollout

**Used in**: Story/Task Specs (Sections 9-10)

### 9. Risk Assessment

**Technical Risks**:

- {Risk 1}: {description, likelihood, impact, mitigation}

**Dependency Risks**:

- {Third-party library limitations or breaking changes}

**Performance Risks**:

- {Large data sets, complex calculations, mitigation strategies}

**Security Risks**:

- {XSS, CSRF, authentication bypass, mitigation strategies}

> **Note**: Detailed security analysis is required in Section 5 (Security Analysis). This section covers implementation-phase risks.

### 10. Rollout & Migration

- **Feature Flags**: If applicable, use `shared-feature-flags-api`
- **Breaking Changes**: If applicable, describe migration path
- **Documentation Updates**: User-facing and developer docs

### 11. Appendix

- **Related Tickets**: {Jira keys}
- **Reference Implementations**: {File paths to similar features}
- **API Endpoints**: {List endpoints with methods}
- **Design Assets**: {Links if available}

---

## Epic Specs Section - Overview & Milestones

**Used in**: Epic Specs (Sections 1-2)

### 1. Overview

- **Jira Ticket**: {JIRA_KEY}
- **Epic Goal**: High-level objective (what will be achieved across all stories)
- **Business Value**: What problems does this epic solve for stakeholders
- **Success Criteria**: Measurable outcomes for the epic completion
- **Priority**: Business priority level
- **Stakeholders**: Teams/roles involved
- **Estimated Complexity**: T-shirt size (XS=25, S=50, M=100, L=150, XL=200 story points)

### 2. Milestones & Timeline

**Milestone Structure**:

1. **{Milestone Name}** - {short description}
   - **Target Date**: {Sprint N or specific date}
   - **Acceptance Criteria**:
     - [ ] {Specific, testable criterion}
     - [ ] {Another criterion}

2. **{Next Milestone}** - {description}
   - **Target Date**: {Sprint N or specific date}
   - **Acceptance Criteria**:
     - [ ] {Specific, testable criterion}
     - [ ] {Another criterion}

**Note**: Structure milestones to show progression toward epic completion, with clear dependencies noted between milestones.

#### 3. Dependencies & Impacted Areas

**Affected Applications**:

- `apps/{app-name}` - {reason affected}

**Affected Libraries** (per Nx layering):

- `libs/{domain}/{feature}/feature` - {reason affected}
- `libs/{domain}/{feature}/data-access` - {reason affected}
- `libs/{domain}/{feature}/ui` - {reason affected}

**Impacted Teams**:

- {Team Name}: {Responsibility}

**External Dependencies**:

- {Third-party services or platforms affected}
- {Breaking changes or integrations required}

---

## Epic Specs Section - Suggested Child Tickets

**Used in**: Epic Specs (Section 4)

**IMPORTANT**: This is a machine-readable suggestion list. Creating actual Jira issues requires explicit human or `jira-operator` action. Do NOT automatically create issues.

**Format**: Each child ticket includes title, description, acceptance criteria, effort estimate, and labels for Jira creation.

| # | Title | Description | Acceptance Criteria | Effort | Labels |
| --- | ------- | ------------- | ------------------- | -------- | -------- |
| 1 | `{FR-ID}`: {Component Title} | {1-2 line purpose} | -Criterion 1 -Criterion 2 | {5\|8\|13\|21} | `type:feature`, `domain:{domain}` |
| 2 | `{FR-ID}`: {Another Component} | {Purpose} | -Criterion 1 -Criterion 2 | {points} | `type:feature`, `domain:{domain}` |

**Child Ticket Template**:

Each child ticket should be created as:

- **Issue Type**: Story or Task (depending on nature)
- **Project**: Same project as Epic
- **Parent**: {JIRA_KEY} (the Epic)
- **Summary**: {Matching table title above}
- **Description**: {Matching description above}
- **Acceptance Criteria**: {Listed as checkboxes}
- **Story Points**: {Effort estimate}
- **Labels**: {domain:*, type:*, scope:lib}
- **Components**: {Relevant MEP components}

**Example**:

```markdown
FR-123: Implement Export Parallelization
Parent: EP-456 (Epic)
Acceptance Criteria:
  - [ ] Parallel chunk processing reduces export time by 50%
  - [ ] Handles errors in individual chunks gracefully
  - [ ] Sample dataset exports complete within 2 minutes
Story Points: 13
Labels: domain:hcui, type:feature, scope:lib
```

#### 5. Security & Risk Summary

**Security Considerations for Epic**:

- New authentication/authorization logic: {describe}
- Sensitive data handling across stories: {describe}
- API security changes: {describe}
- Third-party integration risks: {describe}

**Top Risks**:

1. {Risk}: {Description} → **Mitigation**: {Strategy}
2. {Risk}: {Description} → **Mitigation**: {Strategy}
3. {Risk}: {Description} → **Mitigation**: {Strategy}

**Rollout Strategy**:

- Feature flags: {Which feature flags guard new functionality}
- Incremental rollout: {Phased approach for deployment}
- Backwards compatibility: {Breaking changes or migration path}
- Monitoring & alerts: {What metrics indicate success/failure}

---

## Spike Specs Section - Objective & Experiments

**Used in**: Spike Specs (Sections 1-3)

### 1. Objective & Background

**Research Goal**: What are we trying to learn or evaluate?

- **Primary Question**: {The core question this spike answers}
- **Secondary Questions**: {Related unknowns to explore}
- **Success Definition**: {What does "successful research" look like}

**Background**:

- Why is this spike needed now
- What decisions depend on the results
- Business/technical impact of the spike outcome

### 2. Timebox & Experiment Plan

**Timebox**: {Number of days/hours allocated for research}

- Start Date: {Date}
- End Date: {Date}
- Effort: {Dev days or hours}

**Experiment Plan**:

1. **Experiment 1: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

2. **Experiment 2: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

3. **Experiment 3: {Title}**
   - **Objective**: {What are we testing}
   - **Approach**: {How will we test it}
   - **Expected Outcome**: {What success looks like}
   - **Time Allocation**: {Hours}

### 3. Backend Service Dependencies (if applicable)

**Required Services for Spike Experiments**:

| Service | Environment | Base URL | Auth | Notes |
| --------- | ------------- | ---------- | ------ | ------- |
| {Service Name} | dev | `{devUrl}` | {type} | Needed for Experiment 1-2 |

**Key Endpoints to Test**:

1. **{METHOD} {path}** - {Purpose}
   - Request: `{RequestType}` ({fields})
   - Response: `{ResponseType}` ({fields})
   - Sample payload: {Example JSON}

**Data Models for Testing** (from Swagger):

```typescript
// Key DTOs for spike experiments
export interface {RequestDTO} {
  {field}: {type};
}

export interface {ResponseDTO} {
  {field}: {type};
}
```

**Authentication Setup**:

- Credentials location: {environment variable, config, etc.}
- Token refresh needed: {Yes/No}
- CORS/CSRF considerations: {If any}

---

## Spike Specs Section - Success & Follow-up

**Used in**: Spike Specs (Sections 4-6)

### 4. Success/Failure Criteria

**Success Criteria** (Spike is successful if):

- [ ] {Specific, measurable criterion}
- [ ] {Another criterion}
- [ ] {Critical finding or learning achieved}

**Failure Criteria** (Spike inconclusive if):

- [ ] {Specific blocking issue}
- [ ] {Unavailable information}
- [ ] {Technical blocker encountered}

**Metrics** (How to measure results):

- {Metric 1}: {How to measure}
- {Metric 2}: {How to measure}

### 5. Minimal Repro Steps / Prototype Guidance

**Steps to Reproduce Experiments**:

1. Clone/checkout branch: `git checkout {branch}`
2. Setup environment: `npm ci --legacy-peer-deps`
3. Configure backend: `export API_URL={devUrl}`
4. Run Experiment 1:

    ```bash
    npm run {script}
    # Expected output: {description}
    ```

5. Validate results: {Validation steps}

**Code Locations**:

- Experiment 1 code: `libs/{domain}/{feature}/src/lib/{file}.ts`
- Test data: `libs/{domain}/{feature}/src/lib/__fixtures__/{data}.json`
- Config: `environment.{env}.ts`

**Prototype Implementation** (if applicable):

```typescript
// Minimal prototype to test spike hypothesis
// Key implementation details that informed the spike decision
```

### 6. Recommended Follow-up Stories

Based on spike findings, recommend creation of:

| Title | Purpose | Effort | Labels |
| ------- | --------- | -------- | -------- |
| `FR-{ID}`: {Story Title} | {Implement learning from Experiment 1} | 13 | `domain:{domain}`, `type:feature` |
| `FR-{ID}`: {Story Title} | {Implement learning from Experiment 2} | 8 | `domain:{domain}`, `type:feature` |

**Next Steps If Spike Results**:

- {Positive outcome}: Proceed with FR-{ID}
- {Negative outcome}: Investigate alternative approach
- {Inconclusive}: {Recommendation for follow-up research}

---

## Summary

These templates are referenced by the specs-writer agents to maintain consistent structure and guidance across all Specs documents. Each section includes placeholder guidance that agents use to populate actual Specs with real content from Jira tickets, backend services, and technical analysis.
