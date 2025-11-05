<tech-stack>
Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testy:
- Vitest + @testing-library/react + MSW do testów jednostkowych i integracyjnych:
  - Vitest jako szybki framework testowy z pełnym wsparciem TypeScript i ESM
  - @testing-library/react, @testing-library/user-event, @testing-library/jest-dom do testowania komponentów React
  - MSW (Mock Service Worker) do mockowania API i przechwytywania żądań fetch
  - jsdom jako środowisko przeglądarki
  - @vitest/coverage-v8 do raportowania pokrycia kodu
- Playwright do testów E2E:
  - Testy end-to-end na przeglądarkach Chromium, Firefox i WebKit
  - @axe-core/playwright do automatycznych testów dostępności (a11y)
  - Reportery HTML i jUnit do raportowania wyników
- Lighthouse CI do testów wydajności (Performance, Accessibility, Best Practices)
- OWASP ZAP do podstawowych skanów bezpieczeństwa

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD
- Cloudflare do hostowania aplikacji
</tech-stack>