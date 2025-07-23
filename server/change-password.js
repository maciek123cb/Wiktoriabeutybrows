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
    
    // Aktualizujemy hasło w bazie danych
    if (dbType === 'postgres') {
      await db.execute(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
    } else {
      await db.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, userId]
      );
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