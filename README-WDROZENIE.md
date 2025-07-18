# Instrukcja wdrożenia strony Wiktoriabeutybrows na Render.com

## Przygotowanie

1. Utwórz konto na [Render.com](https://render.com)
2. Połącz swoje konto GitHub z Render.com (jeśli kod jest przechowywany na GitHub)
3. Upewnij się, że masz dostęp do kodu źródłowego projektu

## Wdrożenie za pomocą pliku render.yaml

Najłatwiejszym sposobem wdrożenia jest użycie pliku `render.yaml`, który został już przygotowany w projekcie.

1. Zaloguj się do [Render.com](https://render.com)
2. Przejdź do sekcji "Blueprints" w panelu bocznym
3. Kliknij "New Blueprint Instance"
4. Wybierz repozytorium z kodem projektu (jeśli używasz GitHub) lub prześlij kod ręcznie
5. Render automatycznie wykryje plik `render.yaml` i skonfiguruje wszystkie usługi
6. Kliknij "Apply" aby rozpocząć wdrożenie

## Wdrożenie ręczne (alternatywnie)

Jeśli wdrożenie za pomocą pliku `render.yaml` nie działa, możesz wdrożyć każdą usługę ręcznie:

### 1. Baza danych MySQL

1. W panelu Render.com przejdź do sekcji "Databases"
2. Kliknij "New Database"
3. Wybierz "MySQL"
4. Ustaw nazwę: `wiktoriabeutybrows-db`
5. Wybierz plan (Free tier jest dostępny)
6. Kliknij "Create Database"
7. Po utworzeniu bazy danych, zapisz dane dostępowe (host, user, password, database)
8. Połącz się z bazą danych za pomocą klienta MySQL i wykonaj skrypt `server/init-database.sql`

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
   - `DB_HOST`: host bazy danych z kroku 1
   - `DB_USER`: użytkownik bazy danych
   - `DB_PASSWORD`: hasło do bazy danych
   - `DB_NAME`: nazwa bazy danych
   - `JWT_SECRET`: wygeneruj losowy ciąg znaków jako klucz JWT
   - `PORT`: 3001
   - `NODE_ENV`: production
10. Kliknij "Create Web Service"

### 3. Frontend

1. W panelu Render.com przejdź do sekcji "Web Services"
2. Kliknij "New Web Service"
3. Wybierz repozytorium lub prześlij kod ręcznie
4. Ustaw nazwę: `wiktoriabeutybrows-frontend`
5. Ustaw Root Directory: `/`
6. Ustaw Build Command: `npm install && npm run build`
7. Ustaw Start Command: `npm run preview`
8. Wybierz plan (Free tier jest dostępny)
9. W sekcji "Environment Variables" dodaj:
   - `VITE_API_URL`: URL backendu z kroku 2 (np. https://wiktoriabeutybrows-backend.onrender.com)
10. Kliknij "Create Web Service"

## Po wdrożeniu

1. Sprawdź czy wszystkie usługi działają poprawnie w panelu Render.com
2. Otwórz stronę frontend w przeglądarce (URL będzie dostępny w panelu Render.com)
3. Zaloguj się jako administrator używając:
   - Email: admin@example.com
   - Hasło: password
4. Zmień hasło administratora w panelu administracyjnym
5. Skonfiguruj dostępne terminy wizyt, usługi i inne ustawienia

## Rozwiązywanie problemów

1. **Problem z bazą danych**: Sprawdź czy dane dostępowe są poprawne i czy baza danych jest dostępna
2. **Problem z backendem**: Sprawdź logi w panelu Render.com
3. **Problem z frontendem**: Sprawdź czy zmienna `VITE_API_URL` jest poprawnie ustawiona
4. **Problemy z CORS**: Sprawdź czy domena frontendu jest dodana do listy dozwolonych domen w konfiguracji CORS w pliku `server.js`

## Uwagi

- Darmowy plan na Render.com ma ograniczenia wydajności i może się wyłączać po okresie nieaktywności
- Dla produkcyjnego użycia zalecany jest plan płatny
- Pamiętaj o regularnym tworzeniu kopii zapasowych bazy danych