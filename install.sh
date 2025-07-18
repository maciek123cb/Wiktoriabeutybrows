#!/bin/bash

echo "========================================"
echo "  INSTALACJA SYSTEMU UWIERZYTELNIANIA"
echo "  Salon Kosmetyczny - Wiktoriabeauty"
echo "========================================"
echo

echo "[1/4] Instalacja zależności frontendu..."
npm install
if [ $? -ne 0 ]; then
    echo "BŁĄD: Nie udało się zainstalować zależności frontendu"
    exit 1
fi

echo
echo "[2/4] Instalacja zależności backendu..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "BŁĄD: Nie udało się zainstalować zależności backendu"
    exit 1
fi

echo
echo "[3/4] Sprawdzanie konfiguracji..."
if [ ! -f .env ]; then
    echo "UWAGA: Plik .env nie istnieje!"
    echo "Utwórz plik .env w folderze server/ z konfiguracją bazy danych"
    echo "Przykład:"
    echo "DB_HOST=localhost"
    echo "DB_USER=root"
    echo "DB_PASSWORD="
    echo "DB_NAME=beauty_salon"
    echo "JWT_SECRET=your-super-secret-jwt-key"
    echo "PORT=3001"
fi

cd ..

echo
echo "[4/4] Instalacja zakończona!"
echo
echo "========================================"
echo "  NASTĘPNE KROKI:"
echo "========================================"
echo "1. Skonfiguruj bazę danych MySQL"
echo "2. Zaimportuj strukturę: mysql -u root -p beauty_salon < server/database.sql"
echo "3. Skonfiguruj plik server/.env"
echo "4. Uruchom aplikację: npm start"
echo
echo "Domyślne konto administratora:"
echo "Email: admin@example.com"
echo "Hasło: password"
echo
echo "UWAGA: Zmień hasło administratora po pierwszym logowaniu!"
echo "========================================"