---
trigger: always_on
---

# Project Rules

## Architecture

- Prefer modular services over monolith files.
- No business logic in controllers.

## Code Quality

- Always write unit tests for any new code that is generated under the src/ directory.
- All test functions must include comments documenting the implementation of the test case and the expected outcome, including:
  - What is being tested
  - Expected results
  - Any setup or teardown steps
  - Input parameters
  - Any dependencies or external services used
  - Any mocked dependencies

## Stack

- When considering integration, always refer to the multi-repo awareness rules.
