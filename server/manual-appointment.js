// Moduł do dodawania ręcznych wizyt
const addManualAppointment = async (req, res, db, dbType) => {
  try {
    const { firstName, lastName, phone, email, date, time, notes } = req.body;

    // Walidacja danych
    if (!firstName || !lastName || !phone || !email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }
    
    console.log('Dane wizyty:', { firstName, lastName, phone, email, date, time, notes });

    // Sprawdź czy termin jest dostępny
    let availableSlot;
    try {
      if (dbType === 'postgres') {
        [availableSlot] = await db.execute(
          "SELECT id FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND time = $2",
          [date, time]
        );
      } else {
        [availableSlot] = await db.execute(
          'SELECT id FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND time = ?',
          [date, time]
        );
      }
    } catch (error) {
      console.error('Błąd sprawdzania dostępności terminu:', error);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania dostępności terminu'
      });
    }

    if (!availableSlot || availableSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin nie jest dostępny w systemie'
      });
    }

    // Sprawdź czy termin nie jest już zarezerwowany
    let existingAppointment;
    try {
      if (dbType === 'postgres') {
        [existingAppointment] = await db.execute(
          "SELECT id FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND time = $2 AND status != 'cancelled'",
          [date, time]
        );
      } else {
        [existingAppointment] = await db.execute(
          'SELECT id FROM appointments WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND time = ? AND status != "cancelled"',
          [date, time]
        );
      }
    } catch (error) {
      console.error('Błąd sprawdzania istniejących rezerwacji:', error);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania istniejących rezerwacji'
      });
    }

    if (existingAppointment && existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ten termin jest już zajęty'
      });
    }

    // Utwórz tymczasowego użytkownika lub znajdź istniejącego
    let userId;
    let userCreated = false;
    let userFoundBy = null; // 'email', 'name', 'created'
    try {
      let existingUser;
      
      // Sprawdzamy czy użytkownik istnieje po emailu lub po imieniu i nazwisku
      if (dbType === 'postgres') {
        [existingUser] = await db.execute(
          'SELECT id, first_name, last_name, email FROM users WHERE email = $1 OR (first_name = $2 AND last_name = $3)',
          [email, firstName, lastName]
        );
      } else {
        [existingUser] = await db.execute(
          'SELECT id, first_name, last_name, email FROM users WHERE email = ? OR (first_name = ? AND last_name = ?)',
          [email, firstName, lastName]
        );
      }

      if (existingUser && existingUser.length > 0) {
        // Sprawdzamy, czy znaleziony użytkownik pasuje do podanych danych
        const foundUser = existingUser[0];
        userId = foundUser.id;
        
        // Sprawdzamy, czy znaleziony użytkownik ma takie samo imię i nazwisko lub email
        const matchesEmail = foundUser.email.toLowerCase() === email.toLowerCase();
        const matchesName = foundUser.first_name.toLowerCase() === firstName.toLowerCase() && 
                           foundUser.last_name.toLowerCase() === lastName.toLowerCase();
        
        if (matchesEmail) {
          console.log(`Znaleziono istniejącego użytkownika po emailu, ID: ${userId}`);
          userFoundBy = 'email';
        } else if (matchesName) {
          console.log(`Znaleziono istniejącego użytkownika po imieniu i nazwisku, ID: ${userId}`);
          userFoundBy = 'name';
        }
        
        // Jeśli znaleziony użytkownik ma inny email, ale takie samo imię i nazwisko, aktualizujemy jego dane
        if (matchesName && !matchesEmail) {
          // Aktualizujemy dane użytkownika
          if (dbType === 'postgres') {
            await db.execute(
              'UPDATE users SET phone = $1, email = $2 WHERE id = $3',
              [phone, email, userId]
            );
          } else {
            await db.execute(
              'UPDATE users SET phone = ?, email = ? WHERE id = ?',
              [phone, email, userId]
            );
          }
          console.log(`Zaktualizowano dane użytkownika o ID: ${userId}`);
        }
      } else {
        // Utwórz użytkownika dodanego ręcznie
        let result;
        if (dbType === 'postgres') {
          [result] = await db.execute(
            "INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES ($1, $2, $3, $4, 'manual_account', TRUE, 'user') RETURNING id",
            [firstName, lastName, phone, email]
          );
          userId = result[0].id;
        } else {
          [result] = await db.execute(
            'INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES (?, ?, ?, ?, "manual_account", TRUE, "user")',
            [firstName, lastName, phone, email]
          );
          userId = result.insertId;
        }
        userCreated = true;
        userFoundBy = 'created';
        console.log(`Utworzono nowego użytkownika o ID: ${userId}`);
      }
    } catch (error) {
      console.error('Błąd tworzenia/znajdowania użytkownika:', error);
      return res.status(500).json({
        success: false,
        message: 'Błąd tworzenia/znajdowania użytkownika'
      });
    }

    // Dodaj wizytę jako potwierdzoną - używamy stałych wartości liczbowych
    let appointmentId;
    try {
      if (dbType === 'postgres') {
        const query = "INSERT INTO appointments (user_id, date, time, notes, status, total_price, total_duration) VALUES ($1, TO_DATE($2, 'YYYY-MM-DD'), $3, $4, 'confirmed', 0, 0) RETURNING id";
        console.log('Wykonuję zapytanie:', query, [userId, date, time, notes || '']);
        
        const [result] = await db.execute(query, [userId, date, time, notes || '']);
        appointmentId = result[0].id;
      } else {
        const [result] = await db.execute(
          'INSERT INTO appointments (user_id, date, time, notes, status, total_price, total_duration) VALUES (?, ?, ?, ?, "confirmed", 0, 0)',
          [userId, date, time, notes || '']
        );
        appointmentId = result.insertId;
      }
      console.log('Wizyta dodana pomyślnie, ID:', appointmentId);
    } catch (error) {
      console.error('Błąd dodawania wizyty:', error);
      return res.status(500).json({
        success: false,
        message: 'Błąd dodawania wizyty: ' + error.message
      });
    }

    // Przygotuj odpowiedni komunikat w zależności od tego, jak użytkownik został znaleziony
    let message = 'Wizyta została dodana';
    if (userFoundBy === 'email') {
      message = 'Wizyta została dodana dla istniejącego klienta (znalezionego po emailu)';
    } else if (userFoundBy === 'name') {
      message = 'Wizyta została dodana dla istniejącego klienta (znalezionego po imieniu i nazwisku)';
    } else if (userFoundBy === 'created') {
      message = 'Wizyta została dodana i utworzono nowy profil klienta';
    }
    
    res.json({
      success: true,
      message,
      appointmentId,
      userCreated,
      userFoundBy,
      userId
    });
  } catch (error) {
    console.error('Błąd dodawania wizyty ręcznie:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas dodawania wizyty'
    });
  }
};

module.exports = addManualAppointment;