<plan_testów>
# Plan testów dla projektu BudgetManager (Astro + React + Supabase)

1. Wprowadzenie i cele testowania
- Cel nadrzędny: potwierdzenie jakości MVP w obszarach autoryzacji, zarządzania kontami/kategoriami/transakcjami, podsumowań finansowych oraz stabilności integracji AI (OpenRouter).
- Cele szczegółowe: poprawność funkcjonalna (walidacje Zod), niezawodność API (statusy i komunikaty błędów), użyteczność i dostępność UI, bezpieczeństwo (autoryzacja/RLS, cookies), wydajność (czas odpowiedzi i budżety zasobów), regresja (stabilne pipeline’y CI).

2. Zakres testów
- Frontend (Astro 5 + React 19, TS 5, Tailwind 4, shadcn/ui):
  - Komponenty transakcji: `src/components/transactions/*` (formularze, tabela, paginacja, dialogi, walidacje, stany błędów/ładowania).
  - Komponenty dashboardu: `src/components/dashboard/*` i hooki dat: `src/hooks/useDashboardDateRange.ts`, `src/hooks/useSummaries.ts`.
  - Warstwa danych w przeglądarce: `src/lib/api/*` (obsługa 401 -> redirect), React Query (`src/components/QueryClientProvider.tsx`, `src/hooks/*`).
  - Utilsy/UI: `src/lib/utils/*`, `src/lib/transactions/types.ts`, komponenty shadcn `src/components/ui/*`.
- Backend (Astro endpoints + Supabase BaaS):
  - Middleware: `src/middleware/index.ts` (ochrona tras, redirecty).
  - API (REST + RPC): `src/pages/api/rest/v1/*` (accounts, categories, transactions) oraz `rpc/get_expense_summary.ts`, `rpc/get_income_summary.ts` (walidacje, statusy, formaty odpowiedzi, błędy).
  - Serwisy: `src/lib/services/*` (account/category/transaction/summary/openrouter), konfiguracja Supabase: `src/lib/supabase.server.ts`, klient: `src/db/supabase.client.ts`.
  - Integracja AI: `src/lib/services/openrouter.*`, `src/pages/api/verify-openrouter.ts`.
- Poza zakresem (MVP): integracje bankowe i importy zewnętrzne, zaawansowana analityka/wykresy.

3. Typy testów
- Analiza statyczna i jakość kodu
  - ESLint (`npm run lint`), Prettier (`npm run format`), ścisłe typowanie TS (tsconfig strict – już włączone).
- Testy jednostkowe (Vitest)
  - Walidatory Zod: `src/lib/auth/validators.ts`, `src/lib/transactions/types.ts` (schematy formularzy), `Transaction*Schema` w serwisach.
  - Utilsy: `currency.ts` (konwersje cents/dollars, formatowanie), `datetime.ts` (parsowanie/formaty dat), `postgrest-parser.ts` (parsowanie zapytań), `transaction-mappers.ts` (mapowania DTO->VM, klasy kolorów).
  - OpenRouter: `openrouter.config.ts` (validateConfig, presety), `openrouter.errors.ts` (klasy błędów, mapowanie), `openrouter.service.ts` (validateResponseFormat, parseResponse – z danymi fixture), `openrouter.client.ts` (timeout, sieć – stub fetch).
  - React: małe komponenty i logika UI (np. `MoneyInput`, elementy `TransactionsTable`/`TransactionRow`, `PaginationControls`) oraz podstawowa interakcja/ARIA.
- Testy integracyjne (Vitest + MSW/JSDOM lub supertest dla API)
  - Hooki React Query: `useTransactions*`, `useSummaries`, `useAccountsQuery`, `useCategoriesQuery` – cache/invalidation, stany błędów, retry.
  - Warstwa API przeglądarkowa: `src/lib/api/*` – mapowanie statusów (401 -> redirect do `/login`), obsługa 204/422/500.
  - Endpoints Astro (bez pełnego serwera): wywoływanie eksportów `GET/POST/PATCH/DELETE` z mockiem `context.locals.supabase/user`, walidacje Zod i statusy.
  - Serwisy bazodanowe: `account.service.ts`, `category.service.ts`, `transaction.service.ts`, podsumowania – z lokalnym Supabase lub stubem.
  - Middleware: ochrona tras i redirecty na podstawie obecności `locals.user`.
- Testy E2E (Playwright)
  - Ścieżki krytyczne: rejestracja -> potwierdzenie (scenariusz 202) -> logowanie -> dashboard -> dodanie/edycja/usunięcie transakcji -> paginacja -> wylogowanie.
  - Scenariusze błędów: niepoprawne logowanie, brak uprawnień (redirect do `/login`), awarie API (toasty/komunikaty), puste stany, skeletony.
  - Dostępność (axe-core/playwright): role/aria, kontrast, fokus, nawigacja klawiaturą w dialogach/selectach.
- Testy niefunkcjonalne
  - Wydajność: Lighthouse (TTFB, TTI, JS < 200KB na stronę transakcji dla MVP, CLS/LCP), timing kluczowych endpointów (P95 < 300 ms dla listy transakcji przy lokalnym DB).
  - Bezpieczeństwo: nagłówki i flagi cookies (httpOnly, sameSite, secure w PROD), brak wycieku sekretów, RLS (tylko własne dane), walidacje wejścia, błędy z Supabase mapowane bez ujawniania detali.
  - Odporność: retry React Query, degradacja przy błędach sieci (komunikaty/ponów), ograniczenia OpenRouter (429 retry/backoff).

4. Scenariusze testowe dla kluczowych funkcjonalności
- Autoryzacja i sesja
  - Logowanie: poprawne dane -> 200 i redirect na `/dashboard`; błędne dane -> 401 z komunikatem; niepotwierdzony email -> 401 z komunikatem.
  - Rejestracja: unikalny email -> 201 (lub 202 require confirm) + seeding (`user-seed.service.ts`); duplikat -> 409; słabe hasło -> 422.
  - Odzyskiwanie hasła: poprawny email -> 200 i komunikat; walidacje pola email.
  - Middleware: użytkownik niezalogowany na stronach chronionych -> redirect `/login`; zalogowany na `/login`/`/signup` -> redirect `/dashboard`.
- Konta (`src/pages/api/rest/v1/accounts/index.ts`, `account.service.ts`)
  - POST: tworzenie konta (różne `account_type`), 422 dla pustej nazwy/nieprawidłowego typu, 23505 -> komunikat o duplikacie.
  - GET: paginacja `limit/offset`, sortowanie po `created_at` (domyślnie desc), meta `total_count` spójne z danymi; 401 bez sesji.
- Kategorie (`categories/index.ts`, `category.service.ts`)
  - POST: tworzenie kategorii, trimming i walidacje białych znaków, wykrywanie duplikatu (ilike, constraint), komunikaty 422.
  - GET: `limit/offset/order` (regex pola), sortowanie `name/created_at/updated_at`, meta i statusy błędów 400/500 zgodnie z serwisem.
- Transakcje (`transactions/index.ts`, `transaction.service.ts`)
  - POST: poprawne dane -> 201 + reprezentacja; brak pól -> 400 z listą; 422 dla walidacji (kwota>0, ISO data, UUID-y); mapowanie FK (23503) na komunikaty „Account/Category not found or does not belong to user”.
  - GET: paginacja, joiny `accounts(name)` i `categories(name)`, transformacja w serwisie do DTO, meta zgodna; błędy 400/500 mapowane.
  - PATCH: `?id=eq.{uuid}` parsowany przez `postgrest-parser.ts`; walidacje: co najmniej jedno pole do aktualizacji, UUID, własność rekordu; komunikaty 404/422/500 jak w kodzie.
  - DELETE: `?id=eq.{uuid}`; 204 bez treści; 404 gdy brak/własność; 500 dla błędów DB.
- Dashboard i podsumowania (`rpc/get_*_summary.ts`, serwisy summary)
  - POST: wymagane `start_date`, `end_date` (ISO, start<=end), 422/400 dla walidacji; 200 z sumami (0…n); 500 przy błędach DB (zamapowane na „Service temporarily unavailable”).
  - Hook `useSummaries`: enable/disable na podstawie zakresu, `staleTime`, `select` do VM (format USD).
- UI transakcji
  - `MoneyInput`: regex dopuszcza puste, cyfry i 1 kropkę, max 2 miejsca po przecinku; ARIA `aria-invalid`/`aria-describedby` dla błędów.
  - `TransactionForm`: walidacje Zod pola po polu, czyszczenie błędów przy wpisywaniu, ustawianie domyślnego konta, tryby create/edit, disable podczas submitu.
  - `PaginationControls`: generacja stron z wielokropkami, dostępność (aria-label, aria-current), brzegowe wartości (1/ostatnia strona), zmiana pageSize.
  - `TransactionsTable`: skeletony podczas ładowania, pusty stan, poprawne formatowanie dat/kwot/klasy kolorów.
- Warstwa API w przeglądarce (`src/lib/api/*`)
  - 401 -> redirect do `/login`, 204 -> `undefined`, 422/500 -> komunikat z body lub `statusText`.
  - Prawidłowe składanie URL-i (select, order, paginacja) i propagacja błędów do UI (toast/komunikat).
- OpenRouter (`openrouter.provider/service/client/errors/config`, `verify-openrouter.ts`)
  - Brak klucza w env -> inicjalizacja rzuca błąd.
  - `validateResponseFormat`: pozytywne/negatywne scenariusze (strict JSON schema).
  - `chat`: puste `messages` -> ValidationError; błąd sieci/timeout -> NetworkError (retryable); 401/429/404 -> odpowiednie klasy błędów; parsowanie odpowiedzi (id/model/created/choices/usage).
  - Endpoint `GET /api/verify-openrouter`: „pass/fail” w zależności od stubów MSW.

5. Środowisko testowe
- Konfiguracja
  - Node.js 22.14.x; przeglądarki Playwright: Chromium/Firefox/WebKit.
  - Pliki środowiskowe: `.env.test` z oddzielnymi wartościami (SUPABASE_URL/KEY dla instancji testowej, opcjonalnie dummy `OPENROUTER_API_KEY`).
  - Supabase: lokalna instancja (CLI/docker) z migracjami i seedami; alternatywnie stub Supabase w testach integracyjnych.
- Uruchomienia
  - Jednostkowe/integracyjne: Vitest + jsdom, MSW do interceptu `fetch` (API/AI), fake timers dla timeoutów.
  - E2E: serwer dev/preview (Astro) + Playwright z `baseURL=http://localhost:4321`, użytkownik testowy tworzony przez API signup i czyszczony po teście.
- Dane testowe
  - Fabryki/fixtury: konta, kategorie (w tym „Uncategorized”), transakcje (różne typy/kwoty/dat aby testować sort/paginację).
  - Idempotentne seedy per test suite; sprzątanie (truncate per user) po scenariuszach.

6. Narzędzia do testowania
- Jednostkowe/integracyjne: Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, MSW, jsdom, @vitest/coverage-v8.
- E2E: Playwright (+ @axe-core/playwright do a11y), reportery HTML/jUnit.
- Wydajność: Lighthouse CI (na buildzie preview), ewentualnie k6 dla wybranych endpointów.
- Bezpieczeństwo: OWASP ZAP baseline (skan podstawowy), eslint-plugin-security (opcjonalnie).
- Jakość/format: ESLint, Prettier, husky + lint-staged (już skonfigurowane).

7. Harmonogram testów (propozycja, 3–4 tygodnie)
- Tydzień 1: setup frameworków testowych, MSW, podstawowe testy utils/validatorów, smoke API routes.
- Tydzień 2: integracje hooków React Query, serwisy DB (z lokalnym Supabase), scenariusze błędów/redirectów, middleware.
- Tydzień 3: E2E główne ścieżki (auth, CRUD transakcji, dashboard), a11y checks, budżety Lighthouse.
- Tydzień 4: testy niefunkcjonalne (wydajność, bezpieczeństwo), domknięcie braków, stabilizacja i flake-reduction.

8. Kryteria akceptacji
- Funkcjonalne: 100% przejścia scenariuszy E2E krytycznych; poprawne statusy i komunikaty dla błędów (401/404/422/500) zgodnie z implementacją.
- Pokrycie: ≥80% linii/gałęzi w krytycznych modułach (`services/*`, `pages/api/*`, `lib/api/*`, `utils/*`), ≥90% dla utilsy/validatorów.
- Wydajność: Lighthouse na stronach `dashboard` i `transactions` – Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- Bezpieczeństwo: brak krytycznych/ wysokich problemów w skanie ZAP; cookies: httpOnly + sameSite=lax (secure w PROD); brak wycieku sekretów w logach.
- Stabilność: flake rate < 2% w Playwright przez 5 kolejnych uruchomień CI.

9. Role i odpowiedzialności
- QA Lead: strategia, priorytety, przegląd planu/raportów, kryteria wejścia/wyjścia.
- QA Engineer: implementacja testów (unit/integration/E2E), utrzymanie danych testowych, analiza defektów.
- Developerzy: wsparcie w testowalności, poprawki defektów, przegląd testów, mocki/stuby, utrzymanie walidacji i statusów.
- DevOps: konfiguracja CI (GitHub Actions), artefakty, tajemnice, środowiska testowe (Supabase, preview), Lighthouse CI.
- Product Owner: priorytetyzacja scenariuszy biznesowych, akceptacja kryteriów.

10. Procedury raportowania błędów
- System zgłoszeń (np. GitHub Issues/Jira) z szablonem zawierającym: tytuł, środowisko, kroki reprodukcji, wynik aktualny/oczekiwany, logi/konsola/network HAR, zrzuty ekranu/wideo, severity i impact.
- Triage: codzienny przegląd, klasyfikacja (P0–P3), przypisanie, ETA; regresje oznaczane etykietą „regression”.
- Defekty bezpieczeństwa: kanał priorytetowy, ograniczona widoczność, SLA naprawy (P0: 24h, P1: 72h).
- Zamknięcie: warunek – test odtwarzał błąd, commit z PR referencją, test regresyjny dodany i przechodzi w CI.

Załącznik: mapowanie plików o wysokim priorytecie
- Middleware i sesja: `src/middleware/index.ts`, `src/lib/supabase.server.ts`, `src/lib/auth/session.server.ts`.
- API: `src/pages/api/rest/v1/{accounts,categories,transactions}/index.ts`, `src/pages/api/rest/v1/rpc/{get_expense_summary,get_income_summary}.ts`.
- Serwisy: `src/lib/services/{account,category,transaction,expense-summary,income-summary}.service.ts`, `src/lib/services/openrouter.*`.
- Hooki/klient: `src/hooks/*`, `src/lib/api/*`, `src/components/QueryClientProvider.tsx`.
- UI transakcji: `src/components/transactions/*`.
- Utilsy/walidacje: `src/lib/utils/*`, `src/lib/transactions/types.ts`, `src/lib/auth/validators.ts`.
</plan_testów>
