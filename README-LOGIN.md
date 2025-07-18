# System Logowania - Instrukcja

## 🚀 Uruchomienie

### Backend (Terminal 1)
```bash
cd server
npm install
npm run dev
```
Serwer uruchomi się na `http://localhost:5000`

### Frontend (Terminal 2)
```bash
npm run dev
```
Frontend uruchomi się na `http://localhost:3000`

## 🔐 Dane logowania

**Email:** `admin@example.com`  
**Hasło:** `Admin123!`

## 📋 Funkcjonalności

### Frontend
- ✅ Formularz logowania z walidacją
- ✅ Walidacja email (format)
- ✅ Walidacja hasła (min. 6 znaków)
- ✅ Obsługa błędów logowania
- ✅ Przycisk pokazywania/ukrywania hasła
- ✅ Responsywny design
- ✅ Animacje Framer Motion

### Backend
- ✅ Express.js API
- ✅ Endpoint `/api/login` (POST)
- ✅ Weryfikacja danych użytkownika
- ✅ Generowanie JWT tokenów
- ✅ Chroniony endpoint `/api/admin` (GET)
- ✅ Middleware weryfikacji tokenów

### Panel Administratora
- ✅ Dashboard z kartami funkcji
- ✅ Wylogowanie z czyszczeniem tokenów
- ✅ Automatyczne przekierowanie po wygaśnięciu tokenu
- ✅ Responsywny interfejs

## 🔧 Jak używać

1. **Uruchom oba serwery** (backend i frontend)
2. **Kliknij "Admin"** w nawigacji strony głównej
3. **Zaloguj się** używając danych testowych
4. **Zarządzaj** przez panel administratora
5. **Wyloguj się** przyciskiem w prawym górnym rogu

## 🛡️ Bezpieczeństwo

- JWT tokeny z wygaśnięciem (24h)
- Walidacja po stronie frontendu i backendu
- Tokeny przechowywane w localStorage
- Automatyczne wylogowanie przy błędach autoryzacji

## 📁 Struktura plików

```
server/
├── server.js          # Backend Express
└── package.json       # Zależności serwera

src/
├── components/
│   └── LoginForm.jsx   # Formularz logowania
├── pages/
│   └── AdminPanel.jsx  # Panel administratora
└── App.jsx            # Routing główny
```