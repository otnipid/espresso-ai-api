---
trigger: always_on
---

# Unit Tests
- A unit test should test individual functions/classes in isolation with all external dependencies mocked
- ANY test that mocks database dependencies MUST be classified as a unit test
- A unit test MUST
    - mock all external dependencies
    - test single responsibility
    - be deterministic and fast

**File Naming Convention:**
- `*.test.ts` in `src/__tests__/unit/` directory

**Criteria:**
- Uses mocked `DataSource` or repositories
- Tests business logic in isolation
- No actual database operations
- Fast execution, no external dependencies
- Tests validation, calculations, transformations

# Integration Tests
- An integration test should test how multiple components work together with real external dependencies
- Any test that requires a database connection MUST be classified as an integration test
- An integration test MUST
    - use real database setup
    - test component interactions
    - verify database constraints

**File Naming Convention:**
- `*.test.ts` in `src/__tests__/integration/` directory
- Service layer tests that interact with database

**Criteria:**
- Uses `testDataSource` or any real `DataSource`
- Creates/modifies/deletes actual database records
- Tests database transactions
- Tests repository/service layer with real database
- Tests database constraints and relationships
- Uses TypeORM entities with real persistence
