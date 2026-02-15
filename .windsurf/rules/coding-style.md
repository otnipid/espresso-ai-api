---
trigger: always_on
---
# Project Rules

## Architecture
- Prefer modular services over monolith files.
- No business logic in controllers.

## Code Quality
- Always write tests for new features based on the user stories and requirements.
- Prefer explicit types.
- Avoid magic numbers.

## Stack
- Frontend: Node.js + Typescript
- DB: PostgreSQL
- Infra: Docker + Kubernetes

## Style
- Small functions (<30 lines)
- Always include documentation for new functions and classes including:
    - A description of the function
    - Parameters
    - Return value
- No deep nesting