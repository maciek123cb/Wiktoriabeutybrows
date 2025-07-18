// Adapter bazy danych obsługujący zarówno MySQL jak i PostgreSQL
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Określ typ bazy danych na podstawie zmiennej środowiskowej lub domyślnie MySQL
const DB_TYPE = process.env.DB_TYPE || 'mysql';

let db = null;
let dbType = null;

async function initializeDatabase() {
  try {
    if (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') {
      const { Pool } = require('pg');
      dbType = 'postgres';
      
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      // Testowe połączenie
      await pool.query('SELECT NOW()');
      console.log('Połączono z bazą danych PostgreSQL');
      
      // Funkcja execute dla PostgreSQL
      db = {
        execute: async (query, params = []) => {
          try {
            // Konwersja zapytań MySQL na PostgreSQL
            const convertedQuery = convertMySQLToPostgres(query);
            console.log('Converted query:', convertedQuery);
            
            const result = await pool.query(convertedQuery, params);
            return [result.rows, result.fields];
          } catch (error) {
            console.error('Błąd wykonania zapytania PostgreSQL:', error);
            console.error('Oryginalne zapytanie:', query);
            throw error;
          }
        },
        end: async () => await pool.end()
      };
      
    } else {
      // MySQL
      const mysql = require('mysql2/promise');
      dbType = 'mysql';
      
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'beauty_salon'
      };
      
      db = await mysql.createConnection(dbConfig);
      console.log('Połączono z bazą danych MySQL');
    }
    
    return true;
  } catch (error) {
    console.error('Błąd inicjalizacji bazy danych:', error);
    return false;
  }
}

// Funkcja konwertująca zapytania MySQL na PostgreSQL
function convertMySQLToPostgres(query) {
  // Zamiana AUTO_INCREMENT na SERIAL
  query = query.replace(/AUTO_INCREMENT/g, 'SERIAL');
  
  // Zamiana składni INSERT IGNORE
  if (query.includes('INSERT IGNORE INTO')) {
    query = query.replace(/INSERT IGNORE INTO/g, 'INSERT INTO');
    // Dodaj ON CONFLICT DO NOTHING
    if (!query.includes('ON CONFLICT')) {
      query = query + ' ON CONFLICT DO NOTHING';
    }
  }
  
  // Zamiana ENUM na typ TEXT z ograniczeniem CHECK
  const enumRegex = /ENUM\(([^)]+)\)/g;
  query = query.replace(enumRegex, (match, values) => {
    return `TEXT CHECK (value IN (${values}))`;
  });
  
  // Zamiana składni ON UPDATE CURRENT_TIMESTAMP
  query = query.replace(/ON UPDATE CURRENT_TIMESTAMP/g, '');
  
  // Zamiana składni LONGTEXT na TEXT
  query = query.replace(/LONGTEXT/g, 'TEXT');
  
  // Zamiana składni INT na INTEGER
  query = query.replace(/\bINT\b/g, 'INTEGER');
  
  // Zamiana składni UNIQUE KEY na UNIQUE
  query = query.replace(/UNIQUE KEY [^(]+/g, 'UNIQUE ');
  
  // Zamiana składni parametrów w zapytaniach
  query = query.replace(/\?/g, (match, offset, string) => {
    // Sprawdź czy nie jesteśmy w stringu
    const beforeOffset = string.substring(0, offset);
    const quotes = beforeOffset.match(/'/g) || [];
    if (quotes.length % 2 !== 0) {
      return '?'; // Jesteśmy w stringu, nie zamieniaj
    }
    
    // Znajdź numer parametru
    const paramsBeforeOffset = (beforeOffset.match(/\?/g) || []).length;
    return `$${paramsBeforeOffset + 1}`;
  });
  
  return query;
}

// Funkcja do wykonania skryptu inicjalizacyjnego
async function runInitScript() {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const scriptPath = path.join(__dirname, dbType === 'postgres' ? 'init-postgres.sql' : 'init-database.sql');
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`Brak pliku inicjalizacyjnego: ${scriptPath}`);
      return false;
    }
    
    const script = fs.readFileSync(scriptPath, 'utf8');
    const statements = script.split(';').filter(stmt => stmt.trim());
    
    console.log(`Wykonywanie ${statements.length} zapytań inicjalizacyjnych...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`Wykonywanie zapytania ${i+1}/${statements.length}`);
          await db.execute(statement);
        } catch (error) {
          console.error(`Błąd wykonania zapytania ${i+1}:`, error);
          console.error('Zapytanie:', statement);
          // Kontynuuj wykonywanie pozostałych zapytań
        }
      }
    }
    
    console.log('Skrypt inicjalizacyjny wykonany pomyślnie');
    return true;
  } catch (error) {
    console.error('Błąd wykonania skryptu inicjalizacyjnego:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  runInitScript,
  getDb: () => db
};