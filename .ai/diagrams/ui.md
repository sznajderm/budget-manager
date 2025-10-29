Utworzyłem diagram architektury UI dla systemu autentykacji w pliku .ai/diagrams/ui.md. 

Diagram wizualizuje:

1. Strukturę stron Astro - publiczne (login, signup, forgot-password, callback) i chronione (dashboard, transactions)
2. Komponenty React - formularze autentykacji jako wyspy (LoginForm, SignupForm, PasswordRecoveryForm)
3. API endpoints - /api/auth/* dla logowania, rejestracji, wylogowania i odzyskiwania hasła
4. Middleware i biblioteki - zarządzanie sesjami i walidacja JWT
5. Przepływ danych - od użytkownika przez formularze, API, aż do Supabase Auth

Diagram używa kodowania kolorami:
•  🟢 Zielone - nowe komponenty
•  🟡 Żółte - zaktualizowane komponenty
•  ⚪ Szare - istniejące bez zmian

Dodatkowo dołączyłem szczegółowe opisy kluczowych przepływów (rejestracja, logowanie, reset hasła, wylogowanie, ochrona tras) oraz uwagi implementacyjne dotyczące bezpieczeństwa i zgodności z istniejącą aplikacją.

--------------------------

# Diagram Architektury UI - System Autentykacji

## Opis

Diagram przedstawia zaktualizowaną architekturę interfejsu użytkownika aplikacji BudgetManager po wdrożeniu modułu autentykacji (US-001: Rejestracja, US-002: Logowanie) zgodnie ze specyfikacją techniczną.

### Legenda:
- **Komponenty zaznaczone na zielono** - nowe elementy dodane w ramach implementacji autentykacji
- **Komponenty zaznaczone na żółto** - istniejące elementy zaktualizowane o funkcjonalność autentykacji
- **Komponenty bez koloru** - istniejące elementy bez zmian

<mermaid_diagram>

```mermaid
flowchart TD
    %% Punkt wejścia
    Start([Użytkownik]) --> Index[index.astro]
    
    %% Routing główny
    Index -->|Sprawdzenie sesji| Decision{Zalogowany?}
    Decision -->|Tak| Dashboard
    Decision -->|Nie| Login
    
    %% Strony publiczne
    subgraph StronyPubliczne["Strony Publiczne (bez sesji)"]
        Login[login.astro]:::nowe
        Signup[signup.astro]:::nowe
        ForgotPassword[forgot-password.astro]:::nowe
        Callback[auth/callback.astro]:::nowe
    end
    
    %% Strony chronione
    subgraph StronyChronione["Strony Chronione (wymagana sesja)"]
        Dashboard[dashboard.astro]:::zaktualizowane
        Transactions[transactions.astro]:::zaktualizowane
    end
    
    %% Layouty
    subgraph Layouty["Layouty"]
        LayoutPublic[Layout.astro<br/>Podstawowy layout]
        LayoutAuth[AuthenticatedLayout.astro<br/>Sidebar + Wylogowanie]:::zaktualizowane
    end
    
    %% Komponenty React - Formularze
    subgraph KomponentyAuth["Komponenty React - Wyspy Autentykacji"]
        LoginForm[LoginForm.tsx<br/>email, password]:::nowe
        SignupForm[SignupForm.tsx<br/>email, password, confirmPassword]:::nowe
        RecoveryForm[PasswordRecoveryForm.tsx<br/>email]:::nowe
    end
    
    %% API Endpoints
    subgraph APIAuth["API Autentykacji"]
        APILogin[POST /api/auth/login]:::nowe
        APISignup[POST /api/auth/signup]:::nowe
        APILogout[POST /api/auth/logout]:::nowe
        APIRecover[POST /api/auth/recover]:::nowe
    end
    
    %% Middleware i biblioteki
    subgraph MiddlewareLib["Middleware i Biblioteki"]
        Middleware[middleware/index.ts<br/>Wstrzykuje Supabase client<br/>Ochrona tras]:::zaktualizowane
        AuthLib[lib/auth.ts<br/>getAuthenticatedUser<br/>Walidacja JWT]
        Validators[lib/auth/validators.ts<br/>Schematy Zod]:::nowe
        SessionLib[lib/auth/session.server.ts<br/>Zarządzanie sesją]:::nowe
    end
    
    %% Supabase
    Supabase[(Supabase Auth<br/>Baza użytkowników)]
    
    %% Połączenia - Layout
    Login --> LayoutPublic
    Signup --> LayoutPublic
    ForgotPassword --> LayoutPublic
    Callback --> LayoutPublic
    
    Dashboard --> LayoutAuth
    Transactions --> LayoutAuth
    
    %% Połączenia - Komponenty w stronach
    Login -.->|"osadza"| LoginForm
    Signup -.->|"osadza"| SignupForm
    ForgotPassword -.->|"osadza"| RecoveryForm
    
    %% Połączenia - Formularze do API
    LoginForm -->|"POST credentials"| APILogin
    SignupForm -->|"POST user data"| APISignup
    RecoveryForm -->|"POST email"| APIRecover
    LayoutAuth -->|"Przycisk Wyloguj"| APILogout
    
    %% Połączenia - API do Auth Library
    APILogin --> AuthLib
    APISignup --> AuthLib
    APILogout --> AuthLib
    APIRecover --> AuthLib
    
    %% Połączenia - Walidacja
    APILogin --> Validators
    APISignup --> Validators
    APIRecover --> Validators
    
    %% Połączenia - Supabase
    AuthLib <-->|"JWT verification<br/>User sessions"| Supabase
    
    %% Połączenia - Middleware
    Middleware -->|"locals.supabase"| StronyChronione
    Middleware -->|"locals.supabase"| StronyPubliczne
    Middleware -->|"Walidacja sesji"| SessionLib
    SessionLib --> AuthLib
    
    %% Przepływ po autentykacji
    APILogin -->|"200 + cookies"| Success1[Przekierowanie<br/>do /dashboard]
    APISignup -->|"201/202"| Success2[Komunikat<br/>lub przekierowanie]
    APILogout -->|"204 + clear cookies"| Success3[Przekierowanie<br/>do /login]
    APIRecover -->|"200"| Success4[Email wysłany]
    
    %% Callback flow
    Callback -->|"Token exchange"| Supabase
    Supabase -->|"Sukces"| Dashboard
    
    %% Błędy
    APILogin -->|"401/422/429"| Error1[Komunikaty błędów<br/>w formularzu]
    APISignup -->|"409/422"| Error2[Komunikaty błędów<br/>w formularzu]
    
    %% Wygaśnięcie sesji
    StronyChronione -->|"Brak sesji<br/>401"| Redirect[Przekierowanie<br/>do /login]
    
    %% Style classes
    classDef nowe fill:#90EE90,stroke:#333,stroke-width:2px,color:#064e3b
    classDef zaktualizowane fill:#FFD700,stroke:#333,stroke-width:2px,color:#7c2d12
    classDef default fill:#E8E8E8,stroke:#333,stroke-width:1px,color:#111827
```

</mermaid_diagram>

## Kluczowe przepływy

### 1. Rejestracja nowego użytkownika
1. Użytkownik wchodzi na `/signup`
2. Wypełnia formularz `SignupForm` (email, hasło, potwierdzenie hasła)
3. Walidacja po stronie klienta (Zod)
4. POST do `/api/auth/signup`
5. Walidacja po stronie serwera + `supabase.auth.signUp()`
6. Jeśli wymagane potwierdzenie email → komunikat "Sprawdź skrzynkę"
7. Użytkownik klika link w emailu → `/auth/callback` → wymiana tokena → `/dashboard`

### 2. Logowanie użytkownika
1. Użytkownik wchodzi na `/login`
2. Wypełnia formularz `LoginForm` (email, hasło)
3. Walidacja klienta (Zod)
4. POST do `/api/auth/login`
5. `supabase.auth.signInWithPassword()` → ustawienie ciasteczek sesyjnych
6. Sukces (200) → `window.location.assign('/dashboard')`
7. Błąd (401) → komunikat w formularzu

### 3. Odzyskiwanie hasła
1. Użytkownik wchodzi na `/forgot-password`
2. Podaje email w `PasswordRecoveryForm`
3. POST do `/api/auth/recover`
4. Wysyłka emaila z linkiem do `/auth/callback?type=recovery`
5. Użytkownik klika link → formularz ustawienia nowego hasła
6. `supabase.auth.updateUser({ password })`

### 4. Wylogowanie
1. Użytkownik w `AuthenticatedLayout` klika "Wyloguj"
2. POST do `/api/auth/logout`
3. `supabase.auth.signOut()` → wyczyszczenie ciasteczek
4. Przekierowanie do `/login`

### 5. Ochrona tras chronionych
1. Middleware `onRequest` wstrzykuje `locals.supabase` do wszystkich stron
2. Strony chronione (dashboard, transactions) sprawdzają sesję
3. Brak sesji → 401 → istniejąca logika `handle401` przekierowuje do `/login`
4. Sesja prawidłowa → dostęp do strony z `locals.user`

## Uwagi implementacyjne

### Rozdział odpowiedzialności
- **Astro Pages**: SSR, routing, ochrona tras, meta/layout
- **React Components**: Stan formularzy, walidacja klienta, wywołania API
- **API Endpoints**: Walidacja serwera, komunikacja z Supabase Auth
- **Middleware**: Wstrzykiwanie Supabase client, ochrona tras
- **Auth Library**: Funkcje pomocnicze autoryzacji, walidacja JWT

### Bezpieczeństwo
- JWT przechowywane w ciasteczkach `HttpOnly`, `Secure`, `SameSite=Lax`
- Brak przechowywania tokenów w `localStorage`
- Fetch z `credentials: 'include'`
- API akceptuje zarówno nagłówek `Authorization: Bearer <JWT>` (dla zewnętrznych klientów) jak i ciasteczka (dla UI)

### Zgodność z istniejącą aplikacją
- Istniejące endpointy REST (`/api/rest/v1/*`) nie zmieniają kontraktów
- Dodana autoryzacja przez `getAuthenticatedUser()` z `lib/auth.ts`
- Przejście z `SERVICE_ROLE` na walidację JWT + RLS
- Istniejący `handle401` w UI pozostaje bez zmian
