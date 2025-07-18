// Skrypt do debugowania połączenia z bazą danych
require('dotenv').config();
const { Pool } = require('pg');

async function debugPostgresConnection() {
  console.log('Rozpoczynam debugowanie połączenia z bazą danych PostgreSQL...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Ustawiony (ukryty ze względów bezpieczeństwa)' : 'Nie ustawiony');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('Próba połączenia z bazą danych...');
    const result = await pool.query('SELECT NOW()');
    console.log('Połączenie udane!');
    console.log('Czas serwera:', result.rows[0].now);
    
    // Sprawdź czy tabela users istnieje
    try {
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log('Tabela users istnieje, liczba rekordów:', usersResult.rows[0].count);
      
      // Sprawdź użytkownika admin
      const adminResult = await pool.query("SELECT * FROM users WHERE email = 'admin@example.com'");
      if (adminResult.rows.length > 0) {
        console.log('Użytkownik admin istnieje:', {
          id: adminResult.rows[0].id,
          email: adminResult.rows[0].email,
          is_active: adminResult.rows[0].is_active,
          role: adminResult.rows[0].role
        });
      } else {
        console.log('Użytkownik admin nie istnieje!');
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania tabeli users:', error.message);
    }
    
    await pool.end();
    console.log('Połączenie zamknięte.');
  } catch (error) {
    console.error('Błąd połączenia z bazą danych:', error);
  }
}

// Uruchom funkcję debugowania
debugPostgresConnection().catch(console.error);