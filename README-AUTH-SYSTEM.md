# System Logowania i Rejestracji - Salon Kosmetyczny

Kompletny system uwierzytelniania dla salonu kosmetycznego z funkcjami rejestracji, logowania i zarządzania kontami użytkowników.

## 🚀 Funkcjonalności

### 🔐 Rejestracja użytkowników
- Formularz rejestracji z polami: imię, nazwisko, telefon, email, hasło
- Walidacja danych po stronie frontendu i backendu
- Bezpieczne hashowanie haseł (bcrypt)
- Domyślny status nieaktywny (wymaga zatwierdzenia przez administratora)

### 🔑 System logowania
- Logowanie tylko dla zatwierdzonych użytkowników (is_active = true)
- Uwierzytelnianie JWT z tokenami
- Różne role użytkowników (user, admin)
- Automatyczne wylogowanie przy wygaśnięciu tokenu

### 📅 Umawianie wizyt
- Dostęp tylko dla zalogowanych i zatwierdzonych użytkowników
- Komunikat informacyjny dla niezalogowanych użytkowników
- Formularz rezerwacji z wyborem daty, godziny i notatkami
- Integracja z systemem dostępnych terminów

### 🛠️ Panel administratora
- Zarządzanie użytkownikami (aktywacja/dezaktywacja/usuwanie)
- Zarządzanie dostępnymi terminami
- Przeglądanie i potwierdzanie rezerwacji
- Filtrowanie i wyszukiwanie użytkowników

## 📋 Wymagania

- Node.js (v16 lub nowszy)
- MySQL lub MariaDB
- npm lub yarn

## 🔧 Instalacja

### 1. Klonowanie i instalacja zależności

```bash
# Instalacja zależności frontendu
npm install

# Instalacja zależności backendu
cd server
npm install
```

### 2. Konfiguracja bazy danych

1. Utwórz bazę danych MySQL:
```sql
CREATE DATABASE beauty_salon;
```

2. Zaimportuj strukturę bazy danych:
```bash
mysql -u root -p beauty_salon < server/database.sql
```

3. Skonfiguruj plik `.env` w folderze `server`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=twoje_haslo
DB_NAME=beauty_salon
JWT_SECRET=twoj-super-tajny-klucz-jwt
PORT=3001
```

### 3. Uruchomienie aplikacji

```bash
# Uruchomienie całej aplikacji (frontend + backend)
npm start

# Lub osobno:
# Backend
cd server && npm start

# Frontend (w nowym terminalu)
npm run dev
```

## 🗄️ Struktura bazy danych

### Tabela `users`
- `id` - klucz główny
- `first_name` - imię użytkownika
- `last_name` - nazwisko użytkownika
- `phone` - numer telefonu
- `email` - adres email (unikalny)
- `password_hash` - zahashowane hasło
- `is_active` - status aktywności konta (domyślnie false)
- `role` - rola użytkownika (user/admin)
- `created_at` - data utworzenia
- `updated_at` - data ostatniej aktualizacji

### Tabela `available_slots`
- `id` - klucz główny
- `date` - data dostępnego terminu
- `time` - godzina dostępnego terminu
- `created_at` - data utworzenia

### Tabela `appointments`
- `id` - klucz główny
- `user_id` - ID użytkownika (klucz obcy)
- `date` - data wizyty
- `time` - godzina wizyty
- `notes` - dodatkowe notatki
- `status` - status wizyty (pending/confirmed/cancelled)
- `created_at` - data utworzenia
- `updated_at` - data ostatniej aktualizacji

## 🔐 Bezpieczeństwo

- Hasła są hashowane przy użyciu bcrypt (10 rund)
- Tokeny JWT z czasem wygaśnięcia (24h)
- Walidacja danych po stronie serwera
- Ochrona przed SQL Injection (prepared statements)
- CORS skonfigurowany dla bezpiecznej komunikacji

## 👤 Domyślne konto administratora

Po zaimportowaniu bazy danych dostępne jest domyślne konto administratora:
- **Email:** admin@example.com
- **Hasło:** password

⚠️ **WAŻNE:** Zmień hasło administratora po pierwszym logowaniu!

## 🎯 Przepływ użytkownika

### Dla nowych użytkowników:
1. Rejestracja przez formularz
2. Oczekiwanie na zatwierdzenie przez administratora
3. Po zatwierdzeniu - możliwość logowania
4. Dostęp do funkcji umawiania wizyt

### Dla administratora:
1. Logowanie do panelu administratora
2. Zarządzanie użytkownikami (zatwierdzanie/odrzucanie)
3. Zarządzanie dostępnymi terminami
4. Przeglądanie i potwierdzanie rezerwacji

## 🌐 API Endpoints

### Uwierzytelnianie
- `POST /api/register` - rejestracja użytkownika
- `POST /api/login` - logowanie użytkownika

### Zarządzanie użytkownikami (Admin)
- `GET /api/admin/users` - lista użytkowników
- `PATCH /api/admin/users/:id/activate` - aktywacja/dezaktywacja użytkownika
- `DELETE /api/admin/users/:id` - usunięcie użytkownika

### Rezerwacje
- `POST /api/book-appointment` - umówienie wizyty (wymaga logowania)
- `GET /api/available-dates` - dostępne daty
- `GET /api/available-slots/:date` - dostępne godziny dla daty

### Zarządzanie terminami (Admin)
- `GET /api/admin/slots/:date` - terminy dla daty
- `POST /api/admin/slots` - dodanie terminu
- `DELETE /api/admin/slots/:date/:time` - usunięcie terminu

### Harmonogram (Admin)
- `GET /api/admin/appointments` - lista wizyt
- `PATCH /api/admin/appointments/:id/confirm` - potwierdzenie wizyty
- `DELETE /api/admin/appointments/:id` - usunięcie wizyty

## 🎨 Technologie

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React (ikony)

### Backend
- Node.js
- Express.js
- MySQL2
- bcrypt
- jsonwebtoken
- dotenv
- cors

## 📱 Responsywność

Aplikacja jest w pełni responsywna i działa na:
- Komputerach stacjonarnych
- Tabletach
- Telefonach komórkowych

## 🔄 Aktualizacje

Aby zaktualizować system:
1. Pobierz najnowszą wersję
2. Uruchom `npm install` w głównym folderze i folderze `server`
3. Sprawdź czy struktura bazy danych wymaga aktualizacji
4. Zrestartuj aplikację

## 🐛 Rozwiązywanie problemów

### Błąd połączenia z bazą danych
- Sprawdź konfigurację w pliku `.env`
- Upewnij się, że MySQL jest uruchomiony
- Zweryfikuj dane logowania do bazy

### Błąd CORS
- Sprawdź konfigurację CORS w `server.js`
- Upewnij się, że frontend i backend działają na odpowiednich portach

### Problemy z tokenami JWT
- Sprawdź konfigurację `JWT_SECRET` w `.env`
- Wyczyść localStorage w przeglądarce
- Zrestartuj serwer

## 📞 Kontakt

W przypadku problemów lub pytań, skontaktuj się z administratorem systemu.

---

**Uwaga:** Ten system jest gotowy do wdrożenia na serwerze produkcyjnym. Pamiętaj o zmianie domyślnych haseł i kluczy przed wdrożeniem!