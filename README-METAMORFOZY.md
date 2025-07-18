# Galeria Metamorfoz - Instrukcja

## Opis funkcjonalności

System "Galeria Metamorfoz" umożliwia zarządzanie metamorfozami (przed i po zabiegu kosmetycznym) z pełnym panelem administratora i responsywnym frontendem.

## Funkcjonalności

### Panel Administratora (CMS)
- ✅ Dodawanie nowych metamorfoz z polami:
  - Nazwa zabiegu (tekst)
  - Zdjęcie przed (upload)
  - Zdjęcie po (upload)
- ✅ Edycja istniejących metamorfoz
- ✅ Usuwanie metamorfoz
- ✅ Bezpieczne przechowywanie zdjęć na serwerze
- ✅ Walidacja plików (tylko obrazy, limit 5MB)

### Frontend (Strona główna)
- ✅ Wyświetlanie 3 najnowszych metamorfoz
- ✅ Interaktywny suwak porównawczy "przed i po"
- ✅ Przycisk "Zobacz wszystkie metamorfozy"
- ✅ Responsywny design (RWD)

### Podstrona /metamorfozy
- ✅ Lista wszystkich metamorfoz w formie siatki
- ✅ Taki sam układ jak na stronie głównej
- ✅ Responsywny design
- ✅ Sekcja CTA zachęcająca do umówienia wizyty

## Instalacja

### 1. Zainstaluj nowe zależności

```bash
# W głównym katalogu projektu
npm install react-compare-image

# W katalogu server
cd server
npm install multer
```

### 2. Struktura bazy danych

Tabela `metamorphoses` zostanie automatycznie utworzona przy starcie serwera:

```sql
CREATE TABLE metamorphoses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  treatment_name VARCHAR(255) NOT NULL,
  before_image VARCHAR(500) NOT NULL,
  after_image VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Uruchomienie

```bash
# Uruchom serwer i frontend jednocześnie
npm start

# Lub osobno:
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
npm run dev
```

## Użytkowanie

### Panel Administratora

1. Zaloguj się jako administrator (`admin@example.com` / `password`)
2. Przejdź do zakładki "Metamorfozy"
3. Kliknij "Dodaj Metamorfozę"
4. Wypełnij formularz:
   - Nazwa zabiegu
   - Wybierz zdjęcie "przed"
   - Wybierz zdjęcie "po"
5. Kliknij "Dodaj"

### Edycja metamorfozy
1. W liście metamorfoz kliknij "Edytuj"
2. Zmień nazwę zabiegu lub/i wybierz nowe zdjęcia
3. Kliknij "Aktualizuj"

### Usuwanie
1. Kliknij "Usuń" przy wybranej metamorfozie
2. Potwierdź usunięcie

## API Endpoints

### Publiczne
- `GET /api/metamorphoses` - Lista wszystkich metamorfoz
- `GET /api/metamorphoses?limit=3` - Ograniczona lista

### Administratorskie (wymagają tokenu)
- `GET /api/admin/metamorphoses` - Lista dla admina
- `POST /api/admin/metamorphoses` - Dodanie (multipart/form-data)
- `PUT /api/admin/metamorphoses/:id` - Edycja (multipart/form-data)
- `DELETE /api/admin/metamorphoses/:id` - Usunięcie

## Struktura plików

```
src/
├── components/
│   ├── MetamorphosisGallery.jsx     # Komponent dla strony głównej
│   └── MetamorphosisManagement.jsx  # Panel administratora
├── pages/
│   └── MetamorphosisPage.jsx        # Pełna strona galerii
server/
├── uploads/
│   └── metamorphoses/               # Przechowywane zdjęcia
└── server.js                       # Endpointy API
```

## Routing

- `/` - Strona główna (z 3 najnowszymi metamorfozami)
- `/metamorfozy` - Pełna galeria metamorfoz
- `/admin` - Panel administratora (zakładka "Metamorfozy")

## Bezpieczeństwo

- ✅ Walidacja typów plików (tylko obrazy)
- ✅ Limit rozmiaru pliku (5MB)
- ✅ Autoryzacja JWT dla endpointów administratora
- ✅ Bezpieczne przechowywanie plików
- ✅ Automatyczne usuwanie starych plików przy edycji/usuwaniu

## Responsywność

- ✅ Mobile-first design
- ✅ Siatka adaptacyjna (1/2/3 kolumny)
- ✅ Optymalizacja dla urządzeń dotykowych
- ✅ Interaktywny suwak działa na wszystkich urządzeniach

## Możliwości rozbudowy

1. **Kategorie metamorfoz** - dodanie pola category
2. **Opis metamorfozy** - dodanie pola description
3. **Tagi** - system tagowania
4. **Sortowanie** - według daty, nazwy, popularności
5. **Filtrowanie** - według kategorii, zabiegu
6. **SEO** - meta tagi, structured data
7. **Galeria lightbox** - powiększanie zdjęć
8. **Animacje** - płynne przejścia, loading states
9. **Optymalizacja zdjęć** - automatyczne skalowanie, WebP
10. **Backup** - automatyczne kopie zapasowe zdjęć

## Troubleshooting

### Problem z uploadem zdjęć
- Sprawdź uprawnienia do katalogu `server/uploads/`
- Upewnij się, że multer jest zainstalowany
- Sprawdź logi serwera

### Zdjęcia nie wyświetlają się
- Sprawdź czy serwer serwuje pliki statyczne z `/uploads`
- Sprawdź ścieżki w bazie danych
- Sprawdź czy pliki istnieją fizycznie

### Suwak porównawczy nie działa
- Sprawdź czy `react-compare-image` jest zainstalowany
- Sprawdź console na błędy JavaScript
- Upewnij się, że zdjęcia się ładują

## Wsparcie

W przypadku problemów sprawdź:
1. Logi serwera (`console.log` w server.js)
2. Console przeglądarki (F12)
3. Network tab - czy API zwraca poprawne dane
4. Czy wszystkie zależności są zainstalowane