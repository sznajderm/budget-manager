As a senior fullstack developer, your task is to create a detailed implementation plan for a new feature in a web application. This plan should be comprehensive and clear enough for another fullstack developer to implement the view correctly and efficiently.

<feature_description>
When the user creates a new transaction, the new category AI suggestion should be created (ai_suggestions table).
This process should be asynchronous and should not impact users.
</feature_description>

<feature_requirements>
AI suggestion should be stored in the ai_suggestions table
It should use OpenRouter to get the category AI suggestion
Verify src/lib/services/openrouter.service.ts to check the current openrouter integration
</feature_requirements>

Now review the implementation rules:

<implementation_rules>
files: .cursor/rules/shared.mdc, .cursor/rules/frontend.mdc, .cursor/rules/astro.mdc, .cursor/rules/react.mdc, .cursor/rules/ui-shadcn-helper.mdc
</implementation_rules>

Review the defined types:

<types>
file src/types.ts
</types>

Before creating the plan, ask me 5 questions about what should be better specified with your recommendations.

The final plan save in .ai/category-suggestion-plan.md

---

AI:

1. AI Suggestion Trigger Timing
When should the AI suggestion be generated? Should it be:
•  Immediately after transaction creation (as a background job/queue)?
•  Via a scheduled job (e.g., every few minutes to batch process new transactions)?
•  On-demand when the user views the transaction list?

2. OpenRouter Model & Configuration
Which OpenRouter model should be used for category suggestions? Should it be:
•  Configurable via environment variable?
•  Use the defaultModel from OpenRouter config?
•  A specific model you'd like to hardcode (e.g., "meta-llama/llama-3.2-3b-instruct:free")?

3. AI Prompt Context
What context should be provided to the AI for making category suggestions? Should we include:
•  Only the current transaction (description, amount, type)?
•  User's existing categories list for context?
•  Historical transactions with their categories for pattern learning?
•  Account information?

4. Confidence Score Threshold
Should there be a minimum confidence score threshold for storing suggestions in the database? For example:
•  Store all suggestions regardless of confidence?
•  Only store suggestions with confidence >= 0.5?
•  Make it configurable?

5. Error Handling Strategy
How should AI suggestion failures be handled?
•  Should transaction creation fail if AI suggestion fails?
•  Log the error and continue without blocking the transaction creation?
•  Retry mechanism with exponential backoff?
•  Store a failed state in the ai_suggestions table?

---

1. Immediately after transaction creation (as a background job/queue)
2. Configurable via environment variable. You should use OPENROUTER_API_KEY and OPENROUTER_DEFAULT_MODEL variables
3. There should be sent: description, amount, type, user's existing categories. As an output I would expect to have selected one of user's existing categories
4. At this moment we should store all suggestions
5. Log the error and continue without blocking the transaction creation

Do you have any additional questions or you can proceed with plan creation?

---

AI:

Additional Question:

6. Background Job Implementation
Since you want this to be a background job, which approach should we use?
•  Simple async/await with fire-and-forget (non-blocking promise without await in the endpoint)?
•  Queue system (e.g., BullMQ, pg-boss, or similar)?
•  Separate API endpoint that gets called asynchronously?
•  Astro API endpoint with Astro.locals for background tasks?

---

6. Simple async/await with fire-and-forget (non-blocking promise without await in the endpoint)