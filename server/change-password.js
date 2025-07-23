// Endpoint do zmiany hasła użytkownika
const changePassword = async (req, res, db, dbType, bcrypt) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Obecne i nowe hasło są wymagane'
      });
    }
    
    // Sprawdzamy minimalne wymagania dla hasła
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nowe hasło musi mieć co najmniej 6 znaków'
      });
    }
    
    // Pobieramy dane użytkownika
    let user;
    if (dbType === 'postgres') {
      [user] = await db.execute(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [userId]
      );
    } else {
      [user] = await db.execute(
        'SELECT id, password_hash FROM users WHERE id = ?',
        [userId]
      );
    }
    
    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie istnieje'
      });
    }
    
    user = user[0];
    
    // Weryfikujemy obecne hasło
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Obecne hasło jest nieprawidłowe'
      });
    }
    
    // Hashujemy nowe hasło
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Pobieramy pełne dane użytkownika, aby zaktualizować hasło w panelu admina
    let fullUser;
    if (dbType === 'postgres') {
      [fullUser] = await db.execute(
        'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
        [userId]
      );
    } else {
      [fullUser] = await db.execute(
        'SELECT id, first_name, last_name, email FROM users WHERE id = ?',
        [userId]
      );
    }
    
    fullUser = fullUser[0];
    
    // Zapisujemy nowe hasło w zmiennej dla panelu admina
    const plainPassword = newPassword;
    
    console.log(`Aktualizacja hasła dla użytkownika ${userId}:`, {
      email: fullUser.email,
      first_name: fullUser.first_name,
      last_name: fullUser.last_name,
      newPassword: plainPassword
    });
    
    // Aktualizujemy hasło w bazie danych wraz z informacją o ręcznej zmianie hasła
    try {
      if (dbType === 'postgres') {
        await db.execute(
          'UPDATE users SET password_hash = $1, generated_password = $2 WHERE id = $3',
          [hashedPassword, plainPassword, userId]
        );
      } else {
        await db.execute(
          'UPDATE users SET password_hash = ?, generated_password = ? WHERE id = ?',
          [hashedPassword, plainPassword, userId]
        );
      }
      console.log(`Hasło dla użytkownika ${userId} zostało zaktualizowane pomyślnie`);
      
      // Sprawdzamy, czy hasło zostało poprawnie zapisane
      let updatedUser;
      if (dbType === 'postgres') {
        [updatedUser] = await db.execute(
          'SELECT id, email, generated_password FROM users WHERE id = $1',
          [userId]
        );
      } else {
        [updatedUser] = await db.execute(
          'SELECT id, email, generated_password FROM users WHERE id = ?',
          [userId]
        );
      }
      
      if (updatedUser && updatedUser.length > 0) {
        console.log(`Sprawdzenie aktualizacji hasła dla użytkownika ${userId}:`, {
          email: updatedUser[0].email,
          generated_password: updatedUser[0].generated_password
        });
      }
    } catch (dbError) {
      console.error(`Błąd aktualizacji hasła dla użytkownika ${userId}:`, dbError);
      throw dbError;
    }
    
    res.json({
      success: true,
      message: 'Hasło zostało zmienione'
    });
  } catch (error) {
    console.error('Błąd zmiany hasła:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas zmiany hasła'
    });
  }
};

module.exports = changePassword;