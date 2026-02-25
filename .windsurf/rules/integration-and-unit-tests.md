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
- Unit tests CANNOT mock the unit under test (e.g. cannot mock ShotService when testing ShotService)

**File Naming Convention:**
- `*.unit.test.ts` in `src/__tests__/unit/` directory

**Criteria:**
- Uses mocked `DataSource` or repositories
- Tests business logic in isolation
- No actual database operations
- Fast execution, no external dependencies
- Tests validation, calculations, transformations

**Usage:**
```bash
# Run unit tests only
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run unit tests in watch mode
npm run test:unit:watch
```

# Integration Tests
- An integration test should test how multiple components work together with real external dependencies
- Any test that requires a database connection MUST be classified as an integration test
- An integration test MUST
    - use real database setup
    - test component interactions
    - verify database constraints

**File Naming Convention:**
- `*.integration.test.ts` in `src/__tests__/integration/` directory

**Criteria:**
- Uses `testDataSource` or any real `DataSource`
- Creates/modifies/deletes actual database records
- Tests database transactions
- Tests repository/service layer with real database
- Tests database constraints and relationships
- Uses TypeORM entities with real persistence

**Usage:**
```bash
# Run integration tests only
npm run test:integration

# Run integration tests with coverage
npm run test:integration:coverage

# Run integration tests in watch mode
npm run test:integration:watch
```

# All Tests
```bash
# Run all tests (unit + integration)
npm run test

# Run all tests with coverage
npm run test:coverage

# Run all tests in watch mode
npm run test:watch
```
