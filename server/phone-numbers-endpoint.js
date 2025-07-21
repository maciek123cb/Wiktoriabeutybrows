// Endpoint do pobierania wszystkich numerów telefonów
app.get('/api/admin/phone-numbers', verifyToken, async (req, res) => {
  try {
    // Sprawdzamy, czy użytkownik ma uprawnienia administratora
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Brak uprawnień' 
      });
    }

    // Pobieramy wszystkie numery telefonów z bazy danych
    let users;
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL');
        [users] = await db.execute('SELECT phone FROM users WHERE phone IS NOT NULL AND phone != $1', ['']);
      } else {
        console.log('Używam zapytania MySQL');
        [users] = await db.execute('SELECT phone FROM users WHERE phone IS NOT NULL AND phone != ""');
      }
      console.log('Zapytanie wykonane pomyślnie');
    } catch (dbError) {
      console.error('Błąd podczas wykonywania zapytania SQL:', dbError);
      // Awaryjnie pobieramy wszystkie rekordy i filtrujemy je w kodzie
      [users] = await db.execute('SELECT phone FROM users');
      console.log('Wykonano awaryjne zapytanie');
    }
    
    // Wyciągamy same numery telefonów
    console.log('Pobrano użytkowników z numerami telefonów:', users ? users.length : 0);
    
    // Upewniamy się, że users jest tablicą
    const safeUsers = Array.isArray(users) ? users : [];
    
    // Filtrujemy, aby upewnić się, że mamy tylko prawidłowe numery telefonów
    const phoneNumbers = safeUsers
      .filter(user => user && user.phone && user.phone.trim() !== '') // Upewniamy się, że user i user.phone istnieją i nie są puste
      .map(user => user.phone.trim()); // Usuwamy białe znaki
      
    console.log('Wyodrębnione numery telefonów:', phoneNumbers.length);
    
    // Formatujemy numery telefonów do wyświetlenia
    const formattedPhoneNumbers = phoneNumbers.join(', ');
    console.log('Sformatowane numery telefonów:', formattedPhoneNumbers.substring(0, 100) + (formattedPhoneNumbers.length > 100 ? '...' : ''));
    
    // Zwracamy odpowiedź
    res.json({
      success: true,
      phoneNumbers,
      formattedPhoneNumbers,
      count: phoneNumbers.length
    });
  } catch (error) {
    console.error('Błąd pobierania numerów telefonów:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania numerów telefonów'
    });
  }
});