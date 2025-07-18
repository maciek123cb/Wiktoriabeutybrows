@echo off
title Wiktoria Beauty Server

echo 🚀 Uruchamianie Wiktoria Beauty...

REM Sprawdź czy Node.js jest zainstalowany
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js nie jest zainstalowany!
    echo Zainstaluj Node.js z https://nodejs.org
    pause
    exit /b 1
)

echo 📡 Uruchamianie backendu...
cd server
start "Backend" cmd /k "npm install && npm start"
cd ..

timeout /t 3 /nobreak >nul

echo 🌐 Uruchamianie frontendu...
start "Frontend" cmd /k "npm install && npm run dev"

echo.
echo ✅ Serwery uruchomione!
echo 🌐 Frontend: http://localhost:3000
echo 📡 Backend: http://localhost:3001
echo.
echo 📱 Na telefonie użyj IP komputera
echo 📱 Sprawdź IP: ipconfig
echo.
pause