# Specyfikacja Techniczna Architektury Uwierzytelniania

Zakres: US-001 (Rejestracja), US-002 (Logowanie) wraz z odzyskiwaniem hasła. Specyfikacja nie zmienia istniejących kontraktów REST (kont, kategorii, transakcji), a jedynie dodaje i egzekwuje autoryzację zgodnie z dokumentacją.

## 1) Architektura interfejsu użytkownika (UI)

1.1 Strony Astro (publiczne i chronione)
- Publiczne (bez sesji):
  - `src/pages/login.astro` – logowanie.
  - `src/pages/signup.astro` – rejestracja.
  - `src/pages/forgot-password.astro` – inicjacja resetu hasła.
  - `src/pages/auth/callback.astro` – callback Supabase (email confirm/reset). Minimalny SSR + przekierowania.
- Chronione (wymagana sesja):
  - `src/pages/dashboard.astro` – bez zmian, ale dostęp tylko dla zalogowanych.
  - `src/pages/transactions.astro` – j.w.
- Strona główna:
  - `src/pages/index.astro` – jeśli zalogowany → redirect do `/dashboard`, w p.p. redirect do `/login`.

1.2 Layouty
- `src/layouts/Layout.astro` (public):
  - Używany przez login, signup, forgot-password, callback.
- `src/layouts/AuthenticatedLayout.astro` (chroniony):
  - Dodanie sekcji „Użytkownik: <email>”.
  - Zastąpienie „Profile” akcją „Wyloguj” (POST → `/api/auth/logout`), po sukcesie redirect do `/login`.

1.3 Komponenty React (wyspy)
- `src/components/auth/LoginForm.tsx`
  - Pola: email, password.
  - Walidacja klienta (Zod):
    - email: wymagane, poprawny format.
    - password: wymagane (min. 8 znaków – spójnie z SignupForm).
  - Akcja: `POST /api/auth/login` (credentials: include). Po 200 → `window.location.assign('/dashboard')`.
  - Komunikaty błędów (PL):
    - „Podaj adres email.”, „Podaj hasło.”, „Nieprawidłowe dane logowania.”, „Konto nieaktywne lub niepotwierdzone.”
- `src/components/auth/SignupForm.tsx`
  - Pola: email, password, confirmPassword.
  - Walidacja (Zod):
    - email: wymagane, format.
    - password: min. 8 znaków, co najmniej 1 litera i 1 cyfra.
    - confirmPassword: równe password.
  - Akcja: `POST /api/auth/signup`.
  - Scenariusz: jeśli wymagane potwierdzenie email przez Supabase → komunikat „Sprawdź skrzynkę pocztową…”.
  - Błędy: „Adres email jest już zajęty.”, „Hasło niespełnia wymagań.”
- `src/components/auth/PasswordRecoveryForm.tsx`
  - Pole: email.
  - Walidacja: wymagane, format.
  - Akcja: `POST /api/auth/recover` (z `redirectTo` ustawionym na `/auth/callback`).
  - Sukces: „Wysłaliśmy instrukcje resetu hasła na podany adres.”

1.4 Rozdział odpowiedzialności: Astro vs React
- Astro Pages:
  - SSR, routing i ochrona tras (middleware), ustawianie meta/layoutu.
  - Brak logiki formularzy, jedynie osadzanie wysp React.
- React Components (formularze):
  - Kontrola stanu, walidacja klienta, wywołania fetch do API auth.
  - Obsługa komunikatów błędów i przekierowań po sukcesie.

1.5 Scenariusze krytyczne (happy/edge paths)
- Rejestracja: nowy email → (a) konto utworzone i zalogowane (gdy brak wymogu potwierdzenia) lub (b) komunikat o potwierdzeniu email.
- Logowanie: poprawne dane → `/dashboard`; błędne dane → komunikat; email niepotwierdzony → komunikat.
- Odzyskiwanie hasła: wysłanie maila → komunikat sukcesu; wejście w link → `/auth/callback` → formularz ustawienia nowego hasła lub auto-wymiana kodu na sesję + `updateUser({ password })`.
- Wygaśnięcie sesji: API zwraca 401 → istniejąca logika `handle401` w UI przekierowuje do `/login` (zgodność z istniejącym kodem).

1.6 Walidacje i treści błędów (kanoniczne)
- Email: „Wprowadź poprawny adres email.”
- Hasło: „Hasło musi mieć min. 8 znaków i zawierać literę oraz cyfrę.”
- Hasła różne: „Hasła nie są zgodne.”
- Konto istnieje: „Adres email jest już zajęty.”
- Dane logowania błędne: „Nieprawidłowe dane logowania.”
- Zbyt wiele prób: „Zbyt wiele nieudanych prób. Spróbuj ponownie później.”

## 2) Logika backendu

2.1 Struktura endpointów
- Katalog: `src/pages/api/auth/`
  - `login.ts` (POST)
    - Body: `{ email: string, password: string }`
    - 200: `{ user: { id: string, email: string } }` (opcjonalnie) + ustawione ciasteczka sesyjne Supabase
    - 401: `{ error: "Nieprawidłowe dane logowania" }`
    - 429: rate limit (opcjonalnie): `{ error: "Zbyt wiele prób" }`
  - `signup.ts` (POST)
    - Body: `{ email: string, password: string }`
    - 200/201: `{ message: "Konto utworzone" }` lub 202: „Potwierdź email” (zależnie od ustawień Supabase)
    - 409: `{ error: "Adres email jest już zajęty" }`
  - `logout.ts` (POST)
    - 204 lub 303 → `/login` (czyści ciasteczka sesji przez `supabase.auth.signOut()`)
  - `recover.ts` (POST)
    - Body: `{ email: string, redirectTo?: string }`
    - 200: `{ message: "Wysłano instrukcje resetu hasła" }`
- Istniejące REST `/api/rest/v1/...` (konta/kategorie/transakcje)
  - Bez zmian ścieżek i modeli – wymagana autoryzacja (patrz 2.3).

2.2 Modele danych
- Uwierzytelnianie korzysta z wbudowanych tabel Supabase Auth (brak dodatkowych tabel).
- Opcjonalnie w przyszłości: `profiles` (nie wymagane dla US-001/002).

2.3 Mechanizm autoryzacji w REST
- Funkcja kanoniczna: `src/lib/auth.ts:getAuthenticatedUser(request, supabase)`
  - Priorytet: nagłówek `Authorization: Bearer <JWT>` (zgodnie z dokumentacją w `docs/api/**`).
  - Dla kompatybilności UI (fetch z `credentials: 'include'`): dopuszczalne rozszerzenie o odczyt tokena z ciasteczek (np. `sb-access-token`) – fallback, jeśli brak nagłówka.
  - Błąd → rzuca `AuthenticationError` i zwraca 401 w formacie `{ error: string }`.
- Konsekwencja: UI działa na ciasteczkach, a zewnętrzni klienci (curl/Postman) na nagłówku Bearer – bez zmiany istniejącej dokumentacji.

2.4 Walidacja wejścia
- Biblioteka: `zod` (spójnie z istniejącym kodem usług i REST).
- Schematy:
  - `LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8) })`.
  - `SignupSchema = z.object({ email: z.string().email(), password: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/), confirmPassword?: z.string() })` + ewentualne `refine`.
  - `RecoverSchema = z.object({ email: z.string().email(), redirectTo: z.string().url().optional() })`.
- Błędy walidacji → 422 z listą komunikatów (pojedynczy string scalony lub tablica errorów – preferowany pojedynczy string jak w istniejących endpointach).

2.5 Obsługa wyjątków (konwencja)
- Format odpowiedzi błędu: `application/json` → `{ error: string, code?: string, details?: unknown }`.
- Mapowanie:
  - Brak/niepoprawny token → 401.
  - Zły login/hasło → 401.
  - Email zajęty → 409.
  - Walidacja wejścia → 422.
  - Rate limit (jeśli włączony) → 429.
  - Błędy serwera/Supabase → 500 (logowanie szczegółów po stronie serwera, bez ujawniania wrażliwych danych).
- Ujednolicone logowanie: `console.error` z kontekstem (bez haseł/sekretów).

2.6 SSR i konfiguracja (astro.config.mjs)
- Obecna konfiguracja (`output: 'server'`, adapter Node) jest poprawna i zgodna z potrzebami auth.
- Strony zależne od sesji: dodać `export const prerender = false;` (login, signup, forgot-password, auth/callback, dashboard, transactions), aby uniknąć prerenderingu.
- Middleware `src/middleware/index.ts` pozostaje miejscem ochrony tras.

## 3) System uwierzytelniania (Supabase Auth + Astro)

3.1 Integracja i przepływy
- Rejestracja: `POST /api/auth/signup` → `supabase.auth.signUp` (z `emailRedirectTo=/auth/callback`).
- Potwierdzenie email: użytkownik klika link → `/auth/callback` → wymiana kodu na sesję (jeśli dotyczy) i redirect do `/dashboard` lub pokazanie komunikatu o sukcesie.
- Logowanie: `POST /api/auth/login` → `supabase.auth.signInWithPassword` → ustawione ciasteczka sesji przez Supabase → redirect do `/dashboard`.
- Reset hasła: `POST /api/auth/recover` → email z linkiem do `/auth/callback?type=recovery` → na callback wczytanie formularza ustawienia nowego hasła (wyspa React) i `supabase.auth.updateUser({ password })`.
- Wylogowanie: `POST /api/auth/logout` → `supabase.auth.signOut()` (czyści cookies) → redirect `/login`.

3.2 Ciasteczka i bezpieczeństwo
- Nazwy (zgodne z Supabase): `sb-access-token`, `sb-refresh-token` (ustawiane automatycznie przy poprawnym użyciu klienta po stronie serwera lub helperów).
- Atrybuty: `HttpOnly`, `Secure` (na produkcji), `SameSite=Lax`, `Path=/`.
- Brak przechowywania JWT w `localStorage` (minimalizacja ryzyka XSS). UI używa `fetch(..., { credentials: 'include' })` – już obecne w kodzie.

3.3 RLS i dostęp do danych
- Docelowo endpointy REST nie używają `SERVICE_ROLE` (obecnie używane do obejścia RLS w trybie testowym) – przejście na walidację JWT i RLS.
- `user.id` z tokena → filtry `eq('user_id', user.id)` w usługach (już obecne w service layer).

3.4 Kontrakty modułów (propozycja plików)
- `src/lib/auth/validators.ts`
  - `LoginSchema`, `SignupSchema`, `RecoverSchema` (eksporty Zod).
- `src/lib/auth/session.server.ts`
  - `getUserFromRequest(request, supabase): Promise<{ id: string; email?: string } | null>` – odczyt z Bearer i/lub cookies.
  - `requireUser(context): Promise<User>` – rzuca 401 przy braku użytkownika.
- `src/lib/auth/navigation.ts`
  - `redirectIfAuthenticated(context, to='/dashboard')`
  - `redirectIfUnauthenticated(context, to='/login')`
- `src/components/auth/*Form.tsx`
  - Każdy formularz przyjmuje `onSuccess?: () => void`, `onError?: (message: string) => void`.

3.5 Zależności i środowisko
- Zmienne środowiskowe: `SUPABASE_URL`, `SUPABASE_KEY` (klient/serwer), `SUPABASE_SERVICE_ROLE_KEY` (tylko serwer), opcjonalnie `AUTH_REDIRECT_BASE_URL` (np. do nadpisania redirectów w `recover`).
- Brak zmian w `astro.config.mjs` wymaganych dla auth.

## 4) Zgodność z istniejącymi wymaganiami i zachowaniem aplikacji

- Ścieżki i kontrakty REST pozostają bez zmian (konta, kategorie, transakcje).
- Dokumentacja API wymaga nagłówka `Authorization: Bearer <JWT>` – pozostaje aktualna. Endpointy dalej akceptują Bearer; UI działa na cookies (fetch `credentials: 'include'`).
- Istniejące klienty (np. Postman) nie zostaną złamane – brak zmiany adresów/formatów, jedynie egzekwowanie 401 przy braku/niepoprawnym tokenie.
- W UI już zaimplementowane `handle401` przekierowuje do `/login` – spójne z nową ochroną tras.

## 5) Przypadki brzegowe i UX błędów

- Niepotwierdzony email: jasny komunikat i link „Wyślij ponownie email potwierdzający” (opcjonalnie przez Supabase).
- Reset hasła – link wygasł/zużyty: komunikat „Link wygasł. Poproś o nowy.” i przekierowanie do `/forgot-password`.
- Brak połączenia z serwerem: „Problem z połączeniem. Spróbuj ponownie.”
- Ogólne błędy 5xx: „Wystąpił błąd po stronie serwera. Spróbuj ponownie później.”

## 6) Wymagania niefunkcjonalne i bezpieczeństwo

- Brak logowania haseł/sekretów do konsoli.
- Blokada brute force: rozważyć rate limit na `login` i `signup` (np. 5 prób/5 min/IP) – 429.
- CORS: brak ekspozycji poza domeną aplikacji (domyślne zachowanie wystarcza).
- Accessibility formularzy: etykiety, role, aria-invalid, komunikaty błędów – zgodne z istniejącą konwencją komponentów UI.

## 7) Przykładowe kontrakty (JSON)

Login – request:
```json path=null start=null
{
  "email": "user@example.com",
  "password": "P@ssw0rd123"
}
```
Login – sukces:
```json path=null start=null
{
  "user": { "id": "uuid", "email": "user@example.com" }
}
```
Login – błąd:
```json path=null start=null
{ "error": "Nieprawidłowe dane logowania" }
```
Recover – request:
```json path=null start=null
{ "email": "user@example.com", "redirectTo": "/auth/callback" }
```

---

Plan wdrożenia (kolejność):
1) Dodać strony `/login`, `/signup`, `/forgot-password` oraz `auth/callback` z wyspami React i walidacją Zod.
2) Dodać endpointy `/api/auth/*` i centralne schematy Zod.
3) Rozszerzyć middleware o ochronę tras i kontekst `locals.user`.
4) Zmodyfikować REST tak, aby używały `getAuthenticatedUser` zamiast `SERVICE_ROLE` i hardkodowanego `userId` (zachować kombinację Bearer/cookies).
5) Upewnić się, że strony zależne od sesji mają `prerender = false`.
6) Testy scenariuszy: happy path, błędne logowanie, unconfirmed email, reset hasła, wygaśnięta sesja, 401 → redirect.

Zmiany te zapewniają pełną zgodność z US-001/US-002 i nie naruszają istniejących kontraktów API ani zachowania aplikacji opisanych w dokumentacji.
