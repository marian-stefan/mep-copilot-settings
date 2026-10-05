---
name: c4-diagrams
description: "Generate C4 model diagrams (Context, Container, Component, Code) from architecture documents. Use when: creating C4 diagrams, system context diagram, container diagram, component diagram, architecture visualization, software architecture overview, C4 model. Keywords: C4, context, container, component, architecture, system diagram, structurizr."
argument-hint: "describe the C4 level and scope, or reference a design document"
---

# C4 Diagram Generation

## When to Use

- Visualize a system's boundaries and external actors (Level 1 — System Context)
- Show the internal containers of a system: APIs, databases, message queues (Level 2 — Container)
- Break down a container into its components: controllers, services, repositories (Level 3 — Component)
- Map low-level code structure for a critical component (Level 4 — Code) — use sparingly

## Procedure

1. **Read the source document** provided as input (impact map, high-level design, requirements, codebase).
2. **Determine the C4 level** the user needs. If not specified, default to producing **Level 1 (System Context)** and **Level 2 (Container)** together, as these provide the most value with the least ambiguity.

   | Level | Purpose | Typical Audience |
   |-------|---------|------------------|
   | 1 — System Context | System scope, users, and external dependencies | Everyone |
   | 2 — Container | Runtime units: apps, APIs, databases, queues | Technical & architectural |
   | 3 — Component | Internal structure of one container | Developers |
   | 4 — Code | Class/module relationships within a component | Developers (rare) |

3. **Identify the elements** for the chosen level:
   - **Level 1**: System in scope, personas/actors, external systems
   - **Level 2**: All containers within the system boundary (web apps, APIs, databases, message brokers, background workers), plus external systems
   - **Level 3**: Pick one container; list its internal components (controllers, services, repositories, gateways)
   - **Level 4**: Pick one component; list classes, interfaces, key relationships

4. **Generate the Mermaid C4 diagram** using Mermaid's C4 syntax extensions:
   - Use the correct diagram type: `C4Context`, `C4Container`, `C4Component`, or `C4Dynamic`
   - Apply the C4 macros: `Person`, `System`, `System_Ext`, `Container`, `Container_Db`, `Container_Queue`, `Component`, `Rel`, `BiRel`
   - Use `System_Boundary`, `Container_Boundary`, or `Boundary` to group elements
   - Every element must have a **short label** and a **technology/description** tag

5. **Wrap output** in a fenced code block with ` ```mermaid ` so it renders in Markdown previews.

6. **Add a legend section** below the diagram briefly listing each element and its technology choice, if not obvious from the diagram labels.

## Mermaid C4 Syntax Reference

### Level 1 — System Context

```
C4Context
    title System Context Diagram — <System Name>

    Person(alias, "Label", "Description")
    System(alias, "Label", "Description")
    System_Ext(alias, "Label", "Description")

    Rel(from, to, "label", "protocol")
```

### Level 2 — Container

```
C4Container
    title Container Diagram — <System Name>

    Person(alias, "Label", "Description")
    System_Ext(alias, "Label", "Description")

    Container_Boundary(boundary_alias, "System Name") {
        Container(alias, "Label", "Technology", "Description")
        ContainerDb(alias, "Label", "Technology", "Description")
        ContainerQueue(alias, "Label", "Technology", "Description")
    }

    Rel(from, to, "label", "protocol")
```

### Level 3 — Component

```
C4Component
    title Component Diagram — <Container Name>

    Container_Boundary(boundary_alias, "Container Name") {
        Component(alias, "Label", "Technology", "Description")
    }

    Rel(from, to, "label")
```

### Level 4 — Code (use sparingly)

For Level 4, prefer a standard Mermaid `classDiagram` over C4 macros, since Mermaid does not provide C4 code-level primitives:

```
classDiagram
    class ClassName {
        +method() ReturnType
        -field: Type
    }
    ClassName --> DependencyClass : uses
```

## Style Guidelines

- **One diagram per level.** Do not mix System Context elements with Container-level detail in the same diagram.
- **Keep diagrams under ~20 elements.** If larger, split into focused views (e.g., one Container diagram per bounded context).
- **Label all relationships** with the action/message and protocol (e.g., `"Sends booking event"`, `"HTTPS/JSON"`).
- **Use `_Ext` suffixes** for all systems outside the team's control.
- **Technology tags are mandatory** on Level 2 and Level 3 elements (e.g., `".NET 8 Web API"`, `"PostgreSQL"`, `"RabbitMQ"`).
- **Title every diagram** using the pattern: `<Level Name> — <Scope>`.

## Quality Checklist

Before finalizing, verify:
- [ ] Every person/actor from the requirements appears in Level 1
- [ ] Every external system/dependency is marked with `_Ext`
- [ ] All relationships have labels (no unlabeled arrows)
- [ ] Technology choices are stated on Level 2+ elements
- [ ] The diagram renders correctly in Mermaid (valid syntax)
- [ ] No element appears without at least one relationship
