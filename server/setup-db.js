require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('Rozpoczynam konfigurację bazy danych...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };
  
  try {
    console.log('Łączenie z serwerem MySQL...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Tworzenie bazy danych...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'beauty_salon'}`);
    
    console.log(`Przełączanie na bazę ${process.env.DB_NAME || 'beauty_salon'}...`);
    await connection.query(`USE ${process.env.DB_NAME || 'beauty_salon'}`);
    
    console.log('Wczytywanie skryptu inicjalizacyjnego...');
    const initScript = fs.readFileSync(path.join(__dirname, 'init-database.sql'), 'utf8');
    
    console.log('Wykonywanie skryptu inicjalizacyjnego...');
    await connection.query(initScript);
    
    console.log('Baza danych została pomyślnie skonfigurowana!');
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('Błąd podczas konfiguracji bazy danych:', error);
    return false;
  }
}

// Uruchom skrypt jeśli jest wywoływany bezpośrednio
if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('Konfiguracja zakończona pomyślnie.');
        process.exit(0);
      } else {
        console.error('Konfiguracja zakończona niepowodzeniem.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Nieoczekiwany błąd:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };