Integrate src/pages/login.astro src/components/auth/LoginForm.tsx with the Astro backend based on the specification .ai/auth-spec.md. Start by analyzing the existing code in the context of best practices .cursor/rules/astro.mdc and .cursor/rules/react.mdc

The presented plan should meet the assumptions outlined in the user stories section: .ai/prd.md

Use .cursor/rules/supabase-auth.mdc to achieve correct integration of the login process with Supabase Auth.

Before we start, ask me 5 key technical questions addressing unclear elements of integration that will help you carry out the entire implementation from start to finish.

---
AI:
Technical Integration Questions

1. Session Cookie Strategy During Transition
Currently, the REST API endpoints use a hardcoded userId with SERVICE_ROLE_KEY bypassing RLS. According to .ai/auth-spec.md (section 2.3), the plan is to support both Bearer token (for external clients) AND cookies (for UI). Should I:
•  Implement BOTH strategies immediately in the auth endpoints and modify existing REST endpoints to use getAuthenticatedUser()?
•  Or implement auth endpoints first with cookie-only approach, then migrate REST endpoints in a follow-up step?

2. Middleware Public Paths Configuration
The specification mentions several public paths (/login, /signup, /forgot-password, /auth/callback). I notice your current project has /login.astro. Should I:
•  Keep the existing flat structure (/login, /signup) OR move them to /auth/* paths (/auth/login, /auth/signup) as suggested in .cursor/rules/supabase-auth.mdc?
•  The spec lists both patterns - which do you prefer?

3. Supabase Client Instance Management
Your current src/db/supabase.client.ts creates a single shared client instance. According to .cursor/rules/supabase-auth.mdc, I need to create server instances per-request using @supabase/ssr. Should I:
•  Replace the existing supabaseClient completely with createSupabaseServerInstance() OR keep both (old for non-auth, new for auth)?
•  Update Astro.locals.supabase to use the per-request instance in middleware?

4. User Object Storage in Astro.locals
The specification says to store locals.user = { id, email } in middleware. Currently, your env.d.ts only has locals.supabase. Should I:
•  Extend the Locals interface to include user?: { id: string; email: string } AND supabase (keeping both)?
•  Or replace locals.supabase with just locals.user since we'll create Supabase instances on-demand?

5. Error Handling for Unconfirmed Email
The spec mentions handling "email niepotwierdzony" (unconfirmed email) separately from invalid credentials. In Supabase, this typically requires checking email confirmation settings. Should I:
•  Assume email confirmation is ENABLED in your Supabase project and implement the "Sprawdź skrzynkę pocztową" flow for signup?
•  Or assume confirmation is DISABLED (auto-confirm) and skip that messaging?
•  Do you want me to check your Supabase project settings first, or should I implement both paths with conditional logic?

Please answer these questions so I can provide the most accurate implementation plan for your project.
