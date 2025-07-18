# Instrukcja wdrożenia strony Wiktoriabeutybrows na Render.com

## Ważna informacja

Render.com w swoim systemie Blueprint obsługuje tylko bazę danych PostgreSQL, nie MySQL. Projekt został dostosowany do pracy z PostgreSQL na Render.com, zachowując kompatybilność z MySQL w środowisku lokalnym.

## Przygotowanie

1. Utwórz konto na [Render.com](https://render.com)
2. Połącz swoje konto GitHub z Render.com (jeśli kod jest przechowywany na GitHub)
3. Upewnij się, że masz dostęp do kodu źródłowego projektu

## Wdrożenie za pomocą pliku render.yaml

1. Zaloguj się do [Render.com](https://render.com)
2. Przejdź do sekcji "Blueprints" w panelu bocznym
3. Kliknij "New Blueprint Instance"
4. Wybierz repozytorium z kodem projektu lub prześlij kod ręcznie
5. Render automatycznie wykryje plik `render.yaml` i skonfiguruje wszystkie usługi
6. Kliknij "Apply" aby rozpocząć wdrożenie

Po wdrożeniu, baza danych PostgreSQL zostanie automatycznie zainicjalizowana przez adapter bazy danych.

## Wdrożenie ręczne (alternatywnie)

Jeśli wdrożenie za pomocą pliku `render.yaml` nie działa, możesz wdrożyć każdą usługę ręcznie:

### 1. Baza danych PostgreSQL

1. W panelu Render.com przejdź do sekcji "Databases"
2. Kliknij "New Database"
3. Wybierz "PostgreSQL"
4. Ustaw nazwę: `wiktoriabeutybrows-db`
5. Wybierz plan (Free tier jest dostępny)
6. Kliknij "Create Database"
7. Po utworzeniu bazy danych, zapisz connection string

### 2. Backend (API)

1. W panelu Render.com przejdź do sekcji "Web Services"
2. Kliknij "New Web Service"
3. Wybierz repozytorium lub prześlij kod ręcznie
4. Ustaw nazwę: `wiktoriabeutybrows-backend`
5. Ustaw Root Directory: `/`
6. Ustaw Build Command: `cd server && npm install`
7. Ustaw Start Command: `cd server && node server.js`
8. Wybierz plan (Free tier jest dostępny)
9. W sekcji "Environment Variables" dodaj następujące zmienne:
   - `DATABASE_URL`: connection string bazy danych z kroku 1
   - `DB_TYPE`: postgres
   - `JWT_SECRET`: wygeneruj losowy ciąg znaków jako klucz JWT
   - `PORT`: 3001
   - `NODE_ENV`: production
10. Kliknij "Create Web Service"

### 3. Frontend

1. W panelu Render.com przejdź do sekcji "Static Sites"
2. Kliknij "New Static Site"
3. Wybierz repozytorium lub prześlij kod ręcznie
4. Ustaw nazwę: `wiktoriabeutybrows-frontend`
5. Ustaw Root Directory: `/`
6. Ustaw Build Command: `npm install && npm run build`
7. Ustaw Publish Directory: `dist`
8. W sekcji "Environment Variables" dodaj:
   - `VITE_API_URL`: URL backendu (np. https://wiktoriabeutybrows-backend.onrender.com)
9. Kliknij "Create Static Site"

## Po wdrożeniu

1. Sprawdź czy wszystkie usługi działają poprawnie w panelu Render.com
2. Otwórz stronę frontend w przeglądarce (URL będzie dostępny w panelu Render.com)
3. Zaloguj się jako administrator używając:
   - Email: admin@example.com
   - Hasło: password
4. Zmień hasło administratora w panelu administracyjnym
5. Skonfiguruj dostępne terminy wizyt, usługi i inne ustawienia

## Rozwiązywanie problemów

1. **Problem z bazą danych**: Sprawdź logi w panelu Render.com, aby zobaczyć czy adapter bazy danych działa poprawnie
2. **Problem z backendem**: Sprawdź logi w panelu Render.com
3. **Problem z frontendem**: Sprawdź czy zmienna `VITE_API_URL` jest poprawnie ustawiona
4. **Problemy z CORS**: Sprawdź czy domena frontendu jest dodana do listy dozwolonych domen w konfiguracji CORS

## Uwagi

- Darmowy plan na Render.com ma ograniczenia wydajności i może się wyłączać po okresie nieaktywności
- Dla produkcyjnego użycia zalecany jest plan płatny
- Pamiętaj o regularnym tworzeniu kopii zapasowych bazy danych