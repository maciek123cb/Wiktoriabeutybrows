@echo off
echo ========================================
echo   INSTALACJA SYSTEMU UWIERZYTELNIANIA
echo   Salon Kosmetyczny - Wiktoriabeauty
echo ========================================
echo.

echo [1/4] Instalacja zaleznosci frontendu...
call npm install
if %errorlevel% neq 0 (
    echo BLAD: Nie udalo sie zainstalowac zaleznosci frontendu
    pause
    exit /b 1
)

echo.
echo [2/4] Instalacja zaleznosci backendu...
cd server
call npm install
if %errorlevel% neq 0 (
    echo BLAD: Nie udalo sie zainstalowac zaleznosci backendu
    pause
    exit /b 1
)

echo.
echo [3/4] Sprawdzanie konfiguracji...
if not exist .env (
    echo UWAGA: Plik .env nie istnieje!
    echo Kopiowanie przykladowej konfiguracji...
    copy .env.example .env 2>nul || (
        echo Utworz plik .env w folderze server/ z konfiguracja bazy danych
        echo Przyklad:
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=beauty_salon
        echo JWT_SECRET=your-super-secret-jwt-key
        echo PORT=3001
    )
)

cd ..

echo.
echo [4/4] Instalacja zakonczona!
echo.
echo ========================================
echo   NASTEPNE KROKI:
echo ========================================
echo 1. Skonfiguruj baze danych MySQL
echo 2. Zaimportuj strukture: mysql -u root -p beauty_salon ^< server/database.sql
echo 3. Skonfiguruj plik server/.env
echo 4. Uruchom aplikacje: npm start
echo.
echo Domyslne konto administratora:
echo Email: admin@example.com
echo Haslo: password
echo.
echo UWAGA: Zmien haslo administratora po pierwszym logowaniu!
echo ========================================

pause