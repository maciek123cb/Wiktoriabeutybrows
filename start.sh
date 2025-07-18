#!/bin/bash

echo "🚀 Uruchamianie Wiktoria Beauty..."

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany!"
    echo "Zainstaluj Node.js z https://nodejs.org"
    exit 1
fi

# Funkcja do zabijania procesów przy wyjściu
cleanup() {
    echo "🛑 Zatrzymywanie serwerów..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Uruchom backend w tle
echo "📡 Uruchamianie backendu..."
cd server
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ..

# Poczekaj na uruchomienie backendu
sleep 3

# Uruchom frontend w tle
echo "🌐 Uruchamianie frontendu..."
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!

# Wyświetl informacje
echo ""
echo "✅ Serwery uruchomione!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:3001"
echo ""
echo "📱 Na telefonie użyj IP komputera:"
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📱 http://$IP:3000"
echo ""
echo "⚠️  Naciśnij Ctrl+C aby zatrzymać serwery"

# Czekaj na sygnał zakończenia
wait