Prepare E2E test for the scenario using playwright:
<scenario>
1. Register a new user with email: 'testuser@example.com' and password: 'Topsecret99'
2. Log in a newly created user
3. Go to the dashboard page
4. Go to the transactions page
5. Add new transactions  (two 'income', two 'expense')
6. Verify if transactions are diplayed on the /transactions view
7. Verify if transactions are properly summed on the /dashboard view
</scenario>
Write only one test that will get through all those steps
Save this file in `e2e` folder.
Use existing page object models in e2e/page-objects
Take into account key business rules and edge cases .cursor/rules/playwright-e2e-testing.mdc