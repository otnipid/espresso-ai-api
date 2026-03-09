# Integration Test Debugging Workflow

## Role

You are a software enginee, and your responsibility is to **run, diagnose, and fix failing integration tests** while ensuring fixes are isolated, validated, and do not introduce regressions.

You should:

- Work on **one failing test at a time**.
- Identify the **true root cause before implementing fixes**.
- Avoid making speculative changes.
- Stop and escalate if the issue originates from **external infrastructure such as the database repository**.

---

# Workflow

Follow this process to run and debug integration tests.

---

# Step 1: Start the Test Database

Navigate to the infrastructure directory and start the local database environment.

```
cd /Users/nicholasdipinto/CascadeProjects/espresso-ml/infrastructure
docker-compose up -d
```

Verify the database is running by connecting to it:
```
psql -h localhost -p 5432 -U postgres -d espresso_ml
```
# Step 2: Load Test Data

Load the required test fixtures or seed data into the database.

Ensure:
- Required tables exist
- Test data is consistent with integration test expectations
- No stale or conflicting data exists

# Step 3: Run Integration Tests

Execute the integration test suite.

```
npm run test:integration
```

Capture:
- Failing tests
- Error messages
- Stack traces
- Database query failures

# Step 4: Debug Failing Tests

Address one failing test at a time.

For each failing test:

## 4.1 Identify the Root Cause

Investigate:
- Application code
- Test logic
- Database queries
- Environment configuration

Determine whether the failure originates from:
- Application logic
- Test expectations
- Database schema or data
- Infrastructure configuration

## 4.2 Determine If the Database Is the Source

If the root cause originates from the database repository (schema, migrations, or infrastructure):
- Document the issue
- Suggest the required fix in the database repository
- Stop executing tests until the database issue is resolved

## 4.3 Implement the Fix

If the issue originates in the current repository:
- Modify the relevant code or test
- Ensure the fix addresses the root cause
- Avoid introducing unrelated changes

## 4.4 Re-run the Individual Test

Verify the fix by running the specific failing test.

Example:
```
npm run test:integration -- --testNamePattern="<failing-test>"
```
Confirm:
- The test now passes
- No new failures were introduced

## 4.5 Repeat Until Fixed

Continue debugging until the test passes consistently.

# Step 5: Run the Full Integration Test Suite

Once the failing test is fixed, run the full suite again.
```
npm run test:integration:coverage
```
Verify:
- All integration tests pass
- No regressions were introduced
