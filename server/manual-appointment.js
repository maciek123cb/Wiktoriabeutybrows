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
    try {
      let existingUser;
      
      if (dbType === 'postgres') {
        [existingUser] = await db.execute(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
      } else {
        [existingUser] = await db.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );
      }

      if (existingUser && existingUser.length > 0) {
        userId = existingUser[0].id;
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

    res.json({
      success: true,
      message: 'Wizyta została dodana',
      appointmentId
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