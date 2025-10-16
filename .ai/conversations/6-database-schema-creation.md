You are a database architect whose task is to create a PostgreSQL database schema based on information provided from planning sessions, a Product Requirements Document (PRD), and the tech stack. Your goal is to design an efficient and scalable database structure that meets project requirements.

1. <prd>
file .ai/prd.md
</prd>

This is the Product Requirements Document that specifies features, functionalities, and project requirements.

2. <session_notes>
<conversation_summary>

<decisions>
1. Users table should be minimal, leveraging Supabase's auth.users table with an optional profiles table for additional data
2. Accounts table should NOT store balance as a separate field - balances should be calculated from assigned transactions
3. Transactions should use transaction_type ENUM field with 'expense' and 'income' values instead of negative/positive amounts
4. Transaction amounts should be stored as integers in balance_cents field representing money in cents
5. Predefined categories should be created automatically when users are created, with user_id field for all categories (no distinction between predefined and custom)
6. AI category suggestions should be stored in a separate ai_suggestions table with belongs_to/has_one relationship to transactions
7. AI suggestions table should have: suggested_category_id, ai_confidence_score, approved (default NULL), transaction_id (foreign key)
8. Account deletion should use CASCADE DELETE with soft delete mechanism (deleted_at timestamp)
9. Indexing should include composite indexes on (user_id, created_at DESC) and (user_id, account_id, created_at DESC)
10. Monetary amounts stored as integers with upper bound constraint (≤ $999,999.99)
11. Account types ENUM should include: 'checking', 'savings', 'credit_card', 'cash', 'investment'
12. Transaction dates stored as TIMESTAMPZ type, created_at/updated_at as TIMESTAMPTZ
13. Categories table should have unique constraint on (user_id, LOWER(name)) to prevent case-insensitive duplicates
14. AI suggestion records should remain intact when users manually change transaction categories
15. Application-level aggregation should be sufficient for MVP (no materialized views)
</decisions>

<matched_recommendations>
1. Use NUMERIC or INTEGER data types for monetary amounts to avoid floating-point precision issues - matched with decision to use integers for balance_cents
2. Implement Row-Level Security (RLS) on all user-data tables with policies ensuring user_id = auth.uid() - agreed for database-level security
3. Create composite indexes for optimal query performance on common dashboard and reporting queries - agreed with specific index recommendations
4. Use soft delete mechanism for accounts to preserve transaction history while allowing data recovery - agreed with CASCADE DELETE and deleted_at timestamp
5. Store AI categorization data separately to preserve suggestion history and enable accuracy metrics - matched with separate ai_suggestions table decision
6. Use ENUM types for categorical data like account_type and transaction_type for type safety and performance - agreed for both fields
7. Implement proper foreign key constraints and validation to ensure data consistency - agreed with user ownership validation
8. Consider timezone handling by using appropriate PostgreSQL date/time types - agreed with TIMESTAMPTZ for transactions, TIMESTAMPTZ for audit fields
9. Add reasonable constraints and bounds to prevent data entry errors - agreed with upper bound constraints for monetary amounts
10. Plan for predefined categories to be automatically provisioned for new users - agreed with 15-20 standard categories covering common expense and income types
</matched_recommendations>

<database_planning_summary>
The BudgetManager MVP database schema planning has been comprehensively designed for a PostgreSQL database hosted on Supabase. The application will help users track expenses and income across multiple accounts with AI-powered categorization.

Main Requirements:
•  Support for multiple user accounts with secure authentication via Supabase
•  Transaction management with expense/income tracking across multiple financial accounts
•  AI-powered category suggestions with approval workflow and accuracy tracking
•  Category management with both predefined and custom user categories
•  Financial dashboard with summary calculations

Key Entities and Relationships:
1. Users: Minimal profile data, leveraging Supabase auth system
2. Accounts: User financial accounts (checking, savings, etc.) without stored balance
3. Transactions: Core transaction records with integer amounts in cents, transaction type ENUM
4. Categories: User-specific categories including auto-provisioned predefined ones
5. AI_Suggestions: Separate table tracking AI category recommendations and user decisions

Important Security and Scalability Concerns:
•  Row-Level Security (RLS) implemented on all user data tables
•  Foreign key constraints ensuring data consistency and user ownership validation
•  Soft delete mechanism for accounts to preserve transaction history
•  Optimized indexing strategy for dashboard queries and reporting
•  INTEGER storage for monetary amounts to avoid precision issues

Technical Decisions:
•  Balance calculations performed dynamically from transaction sums rather than stored values
•  Transaction types distinguished by ENUM field rather than positive/negative amounts
•  AI suggestion history preserved for accuracy metrics calculation
•  Date handling optimized for user timezone considerations
•  Application-level aggregation sufficient for MVP performance requirements
</database_planning_summary>

<unresolved_issues>
Currently, all major database design decisions have been resolved through the conversation. The schema is well-defined and ready for implementation. No critical unresolved issues remain for the MVP phase.
</unresolved_issues>

</conversation_summary>
</session_notes>

These are notes from the database schema planning session. They may contain important decisions, considerations, and specific requirements discussed during the meeting.

3. <tech_stack>
file .ai/tech-stack.md
</tech_stack>

Describes the technology stack that will be used in the project, which may influence database design decisions.

Follow these steps to create the database schema:

1. Carefully analyze session notes, identifying key entities, attributes, and relationships discussed during the planning session.
2. Review the PRD to ensure that all required features and functionalities are supported by the database schema.
3. Analyze the tech stack and ensure that the database design is optimized for the chosen technologies.

4. Create a comprehensive database schema that includes:
   a. Tables with appropriate column names and data types
   b. Primary keys and foreign keys
   c. Indexes to improve query performance
   d. Any necessary constraints (e.g., uniqueness, not null)

5. Define relationships between tables, specifying cardinality (one-to-one, one-to-many, many-to-many) and any junction tables required for many-to-many relationships.

6. Develop PostgreSQL policies for row-level security (RLS), if applicable, based on requirements specified in session notes or the PRD.

7. Ensure the schema follows database design best practices, including normalization to the appropriate level (typically 3NF, unless denormalization is justified for performance reasons).

The final output should have the following structure:
```markdown
1. List of tables with their columns, data types, and constraints
2. Relationships between tables
3. Indexes
4. PostgreSQL policies (if applicable)
5. Any additional notes or explanations about design decisions
```

Your response should provide only the final database schema in markdown format, which you will save in the file .ai/db-plan.md without including the thinking process or intermediate steps. Ensure the schema is comprehensive, well-organized, and ready to use as a basis for creating database migrations.
Don't create Supabase migrations