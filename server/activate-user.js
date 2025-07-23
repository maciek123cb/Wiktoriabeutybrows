// Endpoint do aktywacji konta użytkownika (tylko dla admina)
const activateUser = async (req, res, db, dbType, bcrypt) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { userId } = req.params;
    
    // Sprawdzamy czy użytkownik istnieje i czy ma status 'manual_account'
    let user;
    if (dbType === 'postgres') {
      [user] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash FROM users WHERE id = $1',
        [userId]
      );
    } else {
      [user] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash FROM users WHERE id = ?',
        [userId]
      );
    }
    
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Użytkownik nie istnieje' });
    }
    
    user = user[0];
    
    if (user.password_hash !== 'manual_account') {
      return res.status(400).json({ success: false, message: 'To konto jest już aktywne' });
    }
    
    // Generujemy login i hasło
    const accountUtils = require('./account-utils');
    const login = accountUtils.generateLogin(user.first_name, user.last_name);
    const password = accountUtils.generatePassword(user.first_name, user.last_name);
    
    // Hashujemy hasło
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Aktualizujemy konto użytkownika
    if (dbType === 'postgres') {
      await db.execute(
        'UPDATE users SET password_hash = $1, username = $2 WHERE id = $3',
        [hashedPassword, login, userId]
      );
    } else {
      await db.execute(
        'UPDATE users SET password_hash = ?, username = ? WHERE id = ?',
        [hashedPassword, login, userId]
      );
    }
    
    res.json({
      success: true,
      message: 'Konto zostało aktywowane',
      login,
      password,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Błąd aktywacji konta:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
};

module.exports = activateUser;