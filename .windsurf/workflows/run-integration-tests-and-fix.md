1. Create instance of test database by running the following commands
   a. cd /Users/nicholasdipinto/CascadeProjects/espresso-ml/infrastructure
   b. docker-compose up -d
   c. psql -h localhost -p 5432 -U postgres -d espresso_ml
2. Load test data into database
3. Run integration tests: `npm run test:integration`
4. For each failing test, do the following. Remember to address one failed test at a time. 
   a. Identify the root cause
   b. If root cause if from database, then suggest a fix for the database repo and stop running tests
   c. Fix the issue
   d. Re-run the individual test to verify the fix
   e. Repeat these steps until test is fixed
5. Repeat on all integration tests until all are passing