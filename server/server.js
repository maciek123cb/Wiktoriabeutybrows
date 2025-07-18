require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbAdapter = require('./db-adapter');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.onrender\.com$/, 'https://wiktoriabeutybrows.onrender.com'] 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tworzenie katalogu uploads jeśli nie istnieje
const uploadsDir = path.join(__dirname, 'uploads', 'metamorphoses');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Utworzono katalog uploads/metamorphoses');
}

// Dodatkowy endpoint dla health check
app.get('/', (req, res) => {
  res.json({ status: 'API działa poprawnie' });
});

// Konfiguracja multer dla uploadów
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'metamorphoses');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki obrazów są dozwolone!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Połączenie z bazą danych
let db;
async function connectDB() {
  try {
    // Inicjalizacja bazy danych za pomocą adaptera
    const success = await dbAdapter.initializeDatabase();
    if (!success) {
      throw new Error('Nie udało się zainicjalizować bazy danych');
    }
    
    db = dbAdapter.getDb();
    return true;
  } catch (error) {
    console.error('Błąd połączenia z bazą danych:', error.message);
    process.exit(1);
  }
}

// Inicjalizacja bazy danych
async function initializeDatabase() {
  try {
    // Uruchom skrypt inicjalizacyjny za pomocą adaptera
    const success = await dbAdapter.runInitScript();
    if (success) {
      console.log('Baza danych została zainicjalizowana pomyślnie');
    } else {
      console.error('Błąd inicjalizacji bazy danych');
    }
  } catch (error) {
    console.error('Błąd inicjalizacji bazy danych:', error);
  }
}

// Middleware weryfikacji tokenu
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};

// REJESTRACJA
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.execute(
      'INSERT INTO users (first_name, last_name, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, phone, email, passwordHash]
    );

    res.json({
      success: true,
      message: 'Konto zostało utworzone. Oczekuje na zatwierdzenie przez administratora.'
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas rejestracji'
    });
  }
});

// LOGOWANIE
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Konto oczekuje na zatwierdzenie przez administratora'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Logowanie pomyślne',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
});

// POBIERANIE WIZYT UŻYTKOWNIKA
app.get('/api/user/appointments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [appointments] = await db.execute(
      'SELECT id, date, time, notes, status, created_at FROM appointments WHERE user_id = ? ORDER BY date DESC, time DESC',
      [userId]
    );

    res.json({ appointments });
  } catch (error) {
    console.error('Błąd pobierania wizyt użytkownika:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania wizyt'
    });
  }
});

// UMAWIANIE WIZYTY
app.post('/api/book-appointment', verifyToken, async (req, res) => {
  try {
    const { date, time, notes } = req.body;
    const userId = req.user.id;

    const [availableSlot] = await db.execute(
      'SELECT id FROM available_slots WHERE date = ? AND time = ?',
      [date, time]
    );

    if (availableSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin nie jest dostępny'
      });
    }

    const [existingAppointment] = await db.execute(
      'SELECT id FROM appointments WHERE date = ? AND time = ? AND status != "cancelled"',
      [date, time]
    );

    if (existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ten termin został już zarezerwowany'
      });
    }

    await db.execute(
      'INSERT INTO appointments (user_id, date, time, notes) VALUES (?, ?, ?, ?)',
      [userId, date, time, notes || '']
    );

    res.json({
      success: true,
      message: 'Wizyta została zgłoszona i oczekuje na potwierdzenie'
    });
  } catch (error) {
    console.error('Błąd rezerwacji:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas rezerwacji'
    });
  }
});

// API dla dostępnych terminów
app.get('/api/available-dates', async (req, res) => {
  try {
    const [slots] = await db.execute(
      'SELECT DISTINCT date FROM available_slots WHERE date >= CURDATE() ORDER BY date'
    );
    
    console.log('Raw slots z bazy:', slots);
    const dates = slots.map(slot => {
      // Naprawiam problem z przesunięciem daty
      const date = new Date(slot.date)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    });
    console.log('Sformatowane daty:', dates);
    res.json({ dates });
  } catch (error) {
    console.error('Błąd pobierania dat:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Pobieranie slotów dla daty:', date);
    
    const [availableSlots] = await db.execute(
      'SELECT time FROM available_slots WHERE date = ? ORDER BY time',
      [date]
    );
    console.log('Dostępne sloty z bazy:', availableSlots);
    
    const [reservedSlots] = await db.execute(
      'SELECT time FROM appointments WHERE date = ? AND status != "cancelled"',
      [date]
    );
    console.log('Zarezerwowane sloty:', reservedSlots);
    
    const reservedTimes = reservedSlots.map(slot => slot.time);
    const freeSlots = availableSlots
      .map(slot => slot.time)
      .filter(time => !reservedTimes.includes(time));
    
    console.log('Wolne sloty:', freeSlots);
    res.json({ slots: freeSlots });
  } catch (error) {
    console.error('Błąd pobierania slotów:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ADMIN ENDPOINTS
app.get('/api/admin', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  res.json({
    message: 'Witaj w panelu administratora!',
    user: req.user
  });
});

// ENDPOINT DO WYSZUKIWANIA UŻYTKOWNIKÓW (PODPOWIEDZI)
app.get('/api/admin/users/search', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const [users] = await db.execute(
      `SELECT id, first_name, last_name, phone, email, is_active,
       CASE WHEN password_hash = 'manual_account' THEN 'manual' ELSE 'registered' END as account_type
       FROM users 
       WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?) 
       AND role != 'admin'
       ORDER BY first_name, last_name
       LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json({ users });
  } catch (error) {
    console.error('Błąd wyszukiwania użytkowników:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const [users] = await db.execute(
      `SELECT id, first_name, last_name, phone, email, is_active, role, created_at,
       CASE WHEN password_hash = 'manual_account' THEN 'manual' ELSE 'registered' END as account_type
       FROM users ORDER BY created_at DESC`
    );


    res.json({ users });
  } catch (error) {
    console.error('Błąd pobierania użytkowników:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.patch('/api/admin/users/:id/activate', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    await db.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    res.json({
      success: true,
      message: is_active ? 'Użytkownik został aktywowany' : 'Użytkownik został dezaktywowany'
    });
  } catch (error) {
    console.error('Błąd aktywacji użytkownika:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { id } = req.params;
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Użytkownik został usunięty'
    });
  } catch (error) {
    console.error('Błąd usuwania użytkownika:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/slots/:date', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { date } = req.params;
    
    const [allSlots] = await db.execute(
      'SELECT time FROM available_slots WHERE date = ? ORDER BY time',
      [date]
    );
    
    const [bookedAppointments] = await db.execute(
      `SELECT a.time, u.first_name, u.last_name 
       FROM appointments a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.date = ? AND a.status != 'cancelled' 
       ORDER BY a.time`,
      [date]
    );
    
    const bookedTimes = bookedAppointments.map(apt => apt.time);
    const availableSlots = allSlots
      .map(slot => slot.time)
      .filter(time => !bookedTimes.includes(time));
    
    res.json({ 
      available: availableSlots,
      booked: bookedAppointments
    });
  } catch (error) {
    console.error('Błąd pobierania slotów:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/admin/slots', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { date, time } = req.body;
    console.log('Dodawanie slotu - otrzymane dane:', { date, time });
    
    await db.execute(
      'INSERT IGNORE INTO available_slots (date, time) VALUES (?, ?)',
      [date, time]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Błąd dodawania slotu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/slots/:date/:time', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { date, time } = req.params;
    
    await db.execute(
      'DELETE FROM available_slots WHERE date = ? AND time = ?',
      [date, time]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Błąd usuwania slotu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/appointments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { date, search } = req.query;
    let query = `
      SELECT a.id, a.date, a.time, a.notes, a.status, a.created_at,
             u.first_name, u.last_name, u.email, u.phone,
             CASE WHEN u.password_hash = 'manual_account' THEN 'manual' ELSE 'registered' END as account_type
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY a.date, a.time';
    
    const [appointments] = await db.execute(query, params);
    
    res.json({ appointments });
  } catch (error) {
    console.error('Błąd pobierania wizyt:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.patch('/api/admin/appointments/:id/confirm', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { id } = req.params;
    
    await db.execute(
      'UPDATE appointments SET status = "confirmed" WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Wizyta została potwierdzona'
    });
  } catch (error) {
    console.error('Błąd potwierdzania wizyty:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/appointments/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { id } = req.params;
    
    await db.execute('DELETE FROM appointments WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Wizyta została usunięta'
    });
  } catch (error) {
    console.error('Błąd usuwania wizyty:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// DODAWANIE WIZYTY RĘCZNIE PRZEZ ADMINA
app.post('/api/admin/appointments/manual', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { firstName, lastName, phone, email, date, time, notes } = req.body;

    // Walidacja danych
    if (!firstName || !lastName || !phone || !email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    // Sprawdź czy termin jest dostępny
    const [availableSlot] = await db.execute(
      'SELECT id FROM available_slots WHERE date = ? AND time = ?',
      [date, time]
    );

    if (availableSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin nie jest dostępny w systemie'
      });
    }

    // Sprawdź czy termin nie jest już zarezerwowany
    const [existingAppointment] = await db.execute(
      'SELECT id FROM appointments WHERE date = ? AND time = ? AND status != "cancelled"',
      [date, time]
    );

    if (existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ten termin jest już zajęty'
      });
    }

    // Utwórz tymczasowego użytkownika lub znajdź istniejącego
    let userId;
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Utwórz użytkownika dodanego ręcznie
      const [result] = await db.execute(
        'INSERT INTO users (first_name, last_name, phone, email, password_hash, is_active, role) VALUES (?, ?, ?, ?, "manual_account", TRUE, "user")',
        [firstName, lastName, phone, email]
      );
      userId = result.insertId;
    }

    // Dodaj wizytę jako potwierdzoną
    await db.execute(
      'INSERT INTO appointments (user_id, date, time, notes, status) VALUES (?, ?, ?, ?, "confirmed")',
      [userId, date, time, notes || '']
    );

    res.json({
      success: true,
      message: 'Wizyta została dodana'
    });
  } catch (error) {
    console.error('Błąd dodawania wizyty ręcznie:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas dodawania wizyty'
    });
  }
});

// Inicjalizacja i uruchomienie serwera
async function startServer() {
  try {
    // Połącz z bazą danych
    await connectDB();
    
    // Inicjalizuj bazę danych
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`Serwer działa na porcie ${PORT}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} jest już zajęty. Zatrzymaj poprzedni serwer lub użyj innego portu.`);
        process.exit(1);
      } else {
        console.error('Błąd serwera:', err);
      }
    });
  } catch (error) {
    console.error('Błąd podczas uruchamiania serwera:', error);
    process.exit(1);
  }
}

// ENDPOINTY DLA USŁUG
app.get('/api/services', async (req, res) => {
  try {
    const [services] = await db.execute(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY category, name'
    );
    res.json({ services });
  } catch (error) {
    console.error('Błąd pobierania usług:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/services', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const [services] = await db.execute(
      'SELECT * FROM services ORDER BY category, name'
    );
    res.json({ services });
  } catch (error) {
    console.error('Błąd pobierania usług:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/admin/services', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { name, description, price, duration, category } = req.body;
    
    await db.execute(
      'INSERT INTO services (name, description, price, duration, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, duration, category]
    );
    
    res.json({ success: true, message: 'Usługa została dodana' });
  } catch (error) {
    console.error('Błąd dodawania usługi:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.put('/api/admin/services/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    const { name, description, price, duration, category, is_active } = req.body;
    
    await db.execute(
      'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, category = ?, is_active = ? WHERE id = ?',
      [name, description, price, duration, category, is_active, id]
    );
    
    res.json({ success: true, message: 'Usługa została zaktualizowana' });
  } catch (error) {
    console.error('Błąd aktualizacji usługi:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/services/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    await db.execute('DELETE FROM services WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Usługa została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania usługi:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINTY DLA ARTYKUŁÓW
app.get('/api/articles', async (req, res) => {
  try {
    console.log('Pobieranie artykułów, query:', req.query);
    const { category, limit } = req.query;
    let query = 'SELECT id, title, slug, excerpt, image_url, category, created_at FROM articles WHERE is_published = 1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      const limitNum = parseInt(limit);
      query += ` LIMIT ${limitNum}`;
    }
    
    console.log('Wykonuję zapytanie:', query, params);
    const [articles] = await db.execute(query, params);
    console.log('Znalezione artykuły:', articles.length);
    res.json({ articles });
  } catch (error) {
    console.error('Błąd pobierania artykułów:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [articles] = await db.execute(
      'SELECT * FROM articles WHERE slug = ? AND is_published = 1',
      [slug]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({ message: 'Artykuł nie znaleziony' });
    }
    
    res.json({ article: articles[0] });
  } catch (error) {
    console.error('Błąd pobierania artykułu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/articles', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const [articles] = await db.execute(
      'SELECT * FROM articles ORDER BY created_at DESC'
    );
    res.json({ articles });
  } catch (error) {
    console.error('Błąd pobierania artykułów:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/admin/articles', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { title, excerpt, content, image_url, category, is_published } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    await db.execute(
      'INSERT INTO articles (title, slug, excerpt, content, image_url, category, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, excerpt, content, image_url, category, is_published]
    );
    
    res.json({ success: true, message: 'Artykuł został dodany' });
  } catch (error) {
    console.error('Błąd dodawania artykułu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.put('/api/admin/articles/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    const { title, excerpt, content, image_url, category, is_published } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    await db.execute(
      'UPDATE articles SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?, category = ?, is_published = ? WHERE id = ?',
      [title, slug, excerpt, content, image_url, category, is_published, id]
    );
    
    res.json({ success: true, message: 'Artykuł został zaktualizowany' });
  } catch (error) {
    console.error('Błąd aktualizacji artykułu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/articles/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    await db.execute('DELETE FROM articles WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Artykuł został usunięty' });
  } catch (error) {
    console.error('Błąd usuwania artykułu:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINTY DLA OPINII
app.get('/api/reviews', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = `
      SELECT r.id, r.rating, r.comment, r.created_at,
             u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_approved = 1
      ORDER BY r.created_at DESC
    `;
    
    if (limit) {
      const limitNum = parseInt(limit);
      query += ` LIMIT ${limitNum}`;
    }
    
    const [reviews] = await db.execute(query);
    res.json({ reviews });
  } catch (error) {
    console.error('Błąd pobierania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!rating || !comment || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Nieprawidłowe dane' });
    }
    
    await db.execute(
      'INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)',
      [userId, rating, comment]
    );
    
    res.json({ success: true, message: 'Opinia została dodana' });
  } catch (error) {
    console.error('Błąd dodawania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/reviews', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const [reviews] = await db.execute(`
      SELECT r.id, r.rating, r.comment, r.is_approved, r.created_at,
             u.first_name, u.last_name, u.email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    
    res.json({ reviews });
  } catch (error) {
    console.error('Błąd pobierania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/reviews/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Opinia została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINTY DLA METAMORFOZ
app.get('/api/metamorphoses', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = 'SELECT * FROM metamorphoses ORDER BY created_at DESC';
    
    if (limit) {
      const limitNum = parseInt(limit);
      query += ` LIMIT ${limitNum}`;
    }
    
    const [metamorphoses] = await db.execute(query);
    res.json({ metamorphoses });
  } catch (error) {
    console.error('Błąd pobierania metamorfoz:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/admin/metamorphoses', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const [metamorphoses] = await db.execute(
      'SELECT * FROM metamorphoses ORDER BY created_at DESC'
    );
    res.json({ metamorphoses });
  } catch (error) {
    console.error('Błąd pobierania metamorfoz:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/admin/metamorphoses', verifyToken, upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { treatmentName } = req.body;
    
    if (!treatmentName || !req.files.beforeImage || !req.files.afterImage) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }
    
    const beforeImagePath = '/uploads/metamorphoses/' + req.files.beforeImage[0].filename;
    const afterImagePath = '/uploads/metamorphoses/' + req.files.afterImage[0].filename;
    
    await db.execute(
      'INSERT INTO metamorphoses (treatment_name, before_image, after_image) VALUES (?, ?, ?)',
      [treatmentName, beforeImagePath, afterImagePath]
    );
    
    res.json({ success: true, message: 'Metamorfoza została dodana' });
  } catch (error) {
    console.error('Błąd dodawania metamorfozy:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

app.put('/api/admin/metamorphoses/:id', verifyToken, upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    const { treatmentName } = req.body;
    
    // Pobierz obecne dane
    const [current] = await db.execute('SELECT * FROM metamorphoses WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Metamorfoza nie znaleziona' });
    }
    
    let beforeImagePath = current[0].before_image;
    let afterImagePath = current[0].after_image;
    
    // Aktualizuj zdjęcia jeśli zostały przesłane
    if (req.files.beforeImage) {
      // Usuń stare zdjęcie
      const oldPath = path.join(__dirname, current[0].before_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      beforeImagePath = '/uploads/metamorphoses/' + req.files.beforeImage[0].filename;
    }
    
    if (req.files.afterImage) {
      // Usuń stare zdjęcie
      const oldPath = path.join(__dirname, current[0].after_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      afterImagePath = '/uploads/metamorphoses/' + req.files.afterImage[0].filename;
    }
    
    await db.execute(
      'UPDATE metamorphoses SET treatment_name = ?, before_image = ?, after_image = ? WHERE id = ?',
      [treatmentName, beforeImagePath, afterImagePath, id]
    );
    
    res.json({ success: true, message: 'Metamorfoza została zaktualizowana' });
  } catch (error) {
    console.error('Błąd aktualizacji metamorfozy:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

app.delete('/api/admin/metamorphoses/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    
    // Pobierz dane przed usunięciem
    const [metamorphosis] = await db.execute('SELECT * FROM metamorphoses WHERE id = ?', [id]);
    if (metamorphosis.length === 0) {
      return res.status(404).json({ success: false, message: 'Metamorfoza nie znaleziona' });
    }
    
    // Usuń pliki
    const beforePath = path.join(__dirname, metamorphosis[0].before_image);
    const afterPath = path.join(__dirname, metamorphosis[0].after_image);
    
    if (fs.existsSync(beforePath)) {
      fs.unlinkSync(beforePath);
    }
    if (fs.existsSync(afterPath)) {
      fs.unlinkSync(afterPath);
    }
    
    await db.execute('DELETE FROM metamorphoses WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Metamorfoza została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania metamorfozy:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

startServer().catch(console.error);