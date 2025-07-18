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
    ? ['https://wiktoriabeutybrows-frontend.onrender.com', 'https://wiktoriabeutybrows.onrender.com', /\.onrender\.com$/] 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

app.get('./', (req, res) => {
  res.json({ status: 'API działa poprawnie' });
});

// Dodatkowy endpoint dla sprawdzenia CORS
app.options('/api/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
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
let dbType = process.env.DB_TYPE || 'mysql';
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
    console.log('Próba logowania:', email);

    try {
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = $1',
        [email]
      );

      console.log('Znaleziono użytkowników:', users ? users.length : 0);

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Nieprawidłowy email lub hasło'
        });
      }

      const user = users[0];
      console.log('Dane użytkownika:', { 
        id: user.id, 
        email: user.email, 
        is_active: user.is_active, 
        role: user.role 
      });

      // Specjalna obsługa dla admina z hasłem testowym
      if (email === 'admin@example.com' && password === 'Admin123!') {
        console.log('Logowanie admina z hasłem testowym');
        
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

        return res.json({
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
      }

      try {
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Walidacja hasła:', isPasswordValid);
        
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
      } catch (bcryptError) {
        console.error('Błąd bcrypt:', bcryptError);
        res.status(500).json({
          success: false,
          message: 'Błąd weryfikacji hasła'
        });
      }
    } catch (dbError) {
      console.error('Błąd bazy danych:', dbError);
      res.status(500).json({
        success: false,
        message: 'Błąd bazy danych podczas logowania'
      });
    }
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
    
    console.log('Próba rezerwacji terminu:', { date, time, userId });
    
    // Walidacja formatu daty
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Data i godzina są wymagane'
      });
    }
    
    // Normalizacja formatu daty
    let formattedDate;
    try {
      // Obsługa różnych formatów daty
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Nieprawidłowy format daty'
        });
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      console.log('Znormalizowana data:', formattedDate);
    } catch (dateError) {
      console.error('Błąd przetwarzania daty:', dateError);
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy format daty'
      });
    }
    
    // Sprawdzamy, czy termin jest dostępny
    let availableSlot;
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL dla sprawdzenia dostępności terminu');
        const [result] = await db.execute(
          "SELECT id FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND time = $2",
          [formattedDate, time]
        );
        availableSlot = result;
      } else {
        console.log('Używam zapytania MySQL dla sprawdzenia dostępności terminu');
        const [result] = await db.execute(
          'SELECT id FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND time = ?',
          [formattedDate, time]
        );
        availableSlot = result;
      }
      console.log('Wynik sprawdzenia dostępności terminu:', availableSlot);
    } catch (dbError) {
      console.error('Błąd zapytania o dostępność terminu:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania dostępności terminu'
      });
    }

    if (!availableSlot || availableSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin nie jest dostępny'
      });
    }

    // Sprawdzamy, czy termin nie jest już zarezerwowany
    let existingAppointment;
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL dla sprawdzenia rezerwacji');
        const [result] = await db.execute(
          "SELECT id FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND time = $2 AND status != 'cancelled'",
          [formattedDate, time]
        );
        existingAppointment = result;
      } else {
        console.log('Używam zapytania MySQL dla sprawdzenia rezerwacji');
        const [result] = await db.execute(
          'SELECT id FROM appointments WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND time = ? AND status != "cancelled"',
          [formattedDate, time]
        );
        existingAppointment = result;
      }
      console.log('Wynik sprawdzenia istniejącej rezerwacji:', existingAppointment);
    } catch (dbError) {
      console.error('Błąd zapytania o istniejącą rezerwację:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania istniejących rezerwacji'
      });
    }

    if (existingAppointment && existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ten termin został już zarezerwowany'
      });
    }

    // Dodajemy nową rezerwację
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL dla dodania rezerwacji');
        await db.execute(
          "INSERT INTO appointments (user_id, date, time, notes) VALUES ($1, TO_DATE($2, 'YYYY-MM-DD'), $3, $4)",
          [userId, formattedDate, time, notes || '']
        );
      } else {
        console.log('Używam zapytania MySQL dla dodania rezerwacji');
        await db.execute(
          'INSERT INTO appointments (user_id, date, time, notes) VALUES (?, ?, ?, ?)',
          [userId, formattedDate, time, notes || '']
        );
      }
      console.log('Rezerwacja dodana pomyślnie');
    } catch (dbError) {
      console.error('Błąd dodawania rezerwacji:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Błąd dodawania rezerwacji'
      });
    }

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
    // Dodajemy szczegółowe logowanie
    console.log('Rozpoczynam pobieranie dostępnych dat');
    console.log('Typ bazy danych:', dbType);
    
    // Sprawdź, czy w ogóle istnieją jakieś sloty w bazie
    const [slotsCheck] = await db.execute('SELECT COUNT(*) as count FROM available_slots');
    console.log('Liczba slotów w bazie:', slotsCheck[0]?.count || 0);
    
    let query;
    if (dbType === 'postgres') {
      query = 'SELECT DISTINCT date FROM available_slots WHERE date >= CURRENT_DATE ORDER BY date';
    } else {
      query = 'SELECT DISTINCT date FROM available_slots WHERE date >= CURDATE() ORDER BY date';
    }
    
    console.log('Wykonuję zapytanie:', query);
    
    try {
      const [slots] = await db.execute(query);
      console.log('Raw slots z bazy (typ):', typeof slots, 'czy tablica:', Array.isArray(slots));
      console.log('Raw slots z bazy (zawartość):', JSON.stringify(slots));
      
      // Zawsze zwróć tablicę, nawet jeśli slots jest undefined
      const safeSlots = Array.isArray(slots) ? slots : [];
      
      const dates = safeSlots.map(slot => {
        if (!slot || !slot.date) {
          console.warn('Nieprawidłowy format slotu:', slot);
          return null;
        }
        try {
          // Naprawiam problem z przesunięciem daty
          const date = new Date(slot.date);
          // Nie dodajemy dodatkowego dnia, aby uniknąć przesunięcia
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (err) {
          console.error('Błąd przetwarzania daty:', err, 'dla slotu:', slot);
          return null;
        }
      }).filter(date => date !== null); // Filtruj nieprawidłowe daty
      
      console.log('Sformatowane daty:', dates);
      return res.json({ dates });
    } catch (dbError) {
      console.error('Błąd zapytania do bazy danych:', dbError);
      return res.json({ dates: [] });
    }
  } catch (error) {
    console.error('Błąd pobierania dat:', error);
    return res.json({ dates: [] }); // Zawsze zwracaj tablicę dates, nawet w przypadku błędu
  }
});

// Endpoint dla dostępnych slotów - dostępny dla wszystkich użytkowników
app.get('/api/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Pobieranie slotów dla daty:', date);
    console.log('Headers zapytania:', req.headers);
    
    // Sprawdzamy format daty
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.warn('Nieprawidłowy format daty:', date);
      return res.json({ slots: [] }); // Zwracamy pustą tablicę zamiast błędu
    }
    
    console.log('Format daty poprawny:', date);
    
    try {
      // Pobieramy wszystkie dostępne sloty dla danej daty
      // Sprawdzamy, czy istnieją sloty dla danej daty
      console.log('Sprawdzam sloty dla daty:', date);
      
      // Najpierw sprawdź, czy data istnieje w tabeli available_slots
      // Dodajemy szczegółowe logowanie
      console.log('Sprawdzam datę w bazie:', date, 'typ bazy:', dbType);
      
      let dateCheck;
      try {
        if (dbType === 'postgres') {
          // W PostgreSQL może być potrzebna konwersja formatu daty
          console.log('Używam zapytania PostgreSQL dla sprawdzenia daty');
          const [result] = await db.execute(
            "SELECT COUNT(*) as count FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1",
            [date]
          );
          dateCheck = result;
        } else {
          // MySQL
          console.log('Używam zapytania MySQL dla sprawdzenia daty');
          const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ?',
            [date]
          );
          dateCheck = result;
        }
        console.log('Wynik sprawdzenia daty (raw):', dateCheck);
      } catch (dbError) {
        console.error('Błąd zapytania o sprawdzenie daty:', dbError);
        dateCheck = [{ count: 0 }];
      }
      
      console.log('Wynik sprawdzenia daty:', dateCheck);
      
      if (!dateCheck || !dateCheck[0] || dateCheck[0].count === 0) {
        console.log('Brak slotów dla daty:', date);
        return res.json({ slots: [] });
      }
      
      // Jeśli data istnieje, pobierz dostępne sloty
      let availableSlots;
      try {
        if (dbType === 'postgres') {
          // W PostgreSQL może być potrzebna konwersja formatu daty
          console.log('Używam zapytania PostgreSQL dla daty:', date);
          const [result] = await db.execute(
            "SELECT time FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 ORDER BY time",
            [date]
          );
          availableSlots = result;
        } else {
          // MySQL
          console.log('Używam zapytania MySQL dla daty:', date);
          const [result] = await db.execute(
            'SELECT time FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? ORDER BY time',
            [date]
          );
          availableSlots = result;
        }
        console.log('Pobrano dostępne sloty:', availableSlots);
      } catch (dbError) {
        console.error('Błąd zapytania o dostępne sloty:', dbError);
        availableSlots = [];
      }
      
      console.log('Dostępne sloty z bazy (typ):', typeof availableSlots, 'czy tablica:', Array.isArray(availableSlots));
      console.log('Dostępne sloty z bazy (zawartość):', JSON.stringify(availableSlots));
      
      // Pobieramy wszystkie zarezerwowane sloty dla danej daty
      let reservedSlots;
      try {
        if (dbType === 'postgres') {
          // W PostgreSQL może być potrzebna konwersja formatu daty
          console.log('Używam zapytania PostgreSQL dla zarezerwowanych slotów, data:', date);
          const [result] = await db.execute(
            "SELECT time FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND status != 'cancelled'",
            [date]
          );
          reservedSlots = result;
        } else {
          // MySQL
          console.log('Używam zapytania MySQL dla zarezerwowanych slotów, data:', date);
          const [result] = await db.execute(
            'SELECT time FROM appointments WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND status != "cancelled"',
            [date]
          );
          reservedSlots = result;
        }
        console.log('Pobrano zarezerwowane sloty:', reservedSlots);
      } catch (dbError) {
        console.error('Błąd zapytania o zarezerwowane sloty:', dbError);
        reservedSlots = [];
      }
      console.log('Zarezerwowane sloty (typ):', typeof reservedSlots, 'czy tablica:', Array.isArray(reservedSlots));
      console.log('Zarezerwowane sloty (zawartość):', JSON.stringify(reservedSlots));
      
      // Zabezpieczenie przed błędami - używamy pustych tablic, jeśli dane są nieprawidłowe
      const safeAvailableSlots = Array.isArray(availableSlots) ? availableSlots : [];
      const safeReservedSlots = Array.isArray(reservedSlots) ? reservedSlots : [];
      
      // Filtrujemy zarezerwowane sloty
      const reservedTimes = safeReservedSlots.map(slot => slot?.time).filter(Boolean);
      
      // Filtrujemy dostępne sloty, usuwając te, które są już zarezerwowane
      const freeSlots = safeAvailableSlots
        .map(slot => slot?.time)
        .filter(Boolean)
        .filter(time => !reservedTimes.includes(time));
      
      console.log('Wolne sloty:', freeSlots);
      return res.json({ slots: freeSlots });
    } catch (dbError) {
      console.error('Błąd zapytania do bazy danych:', dbError);
      return res.json({ slots: [] }); // Zwracamy pustą tablicę zamiast błędu
    }
  } catch (error) {
    console.error('Błąd pobierania slotów:', error);
    return res.json({ slots: [] }); // Zawsze zwracaj tablicę slots, nawet w przypadku błędu
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
    
    // Sprawdzamy, czy slot już istnieje
    let slotExists;
    if (dbType === 'postgres') {
      const [result] = await db.execute(
        "SELECT COUNT(*) as count FROM available_slots WHERE date::text = $1 AND time = $2",
        [date, time]
      );
      slotExists = result[0]?.count > 0;
    } else {
      const [result] = await db.execute(
        'SELECT COUNT(*) as count FROM available_slots WHERE date = ? AND time = ?',
        [date, time]
      );
      slotExists = result[0]?.count > 0;
    }
    
    if (slotExists) {
      console.log('Slot już istnieje:', { date, time });
      return res.json({ success: true, message: 'Slot już istnieje' });
    }
    
    // Dodajemy nowy slot
    try {
      if (dbType === 'postgres') {
        console.log('Dodaję slot w PostgreSQL:', { date, time });
        // W PostgreSQL możemy potrzebować konwersji formatu daty
        await db.execute(
          "INSERT INTO available_slots (date, time) VALUES (TO_DATE($1, 'YYYY-MM-DD'), $2)",
          [date, time]
        );
      } else {
        console.log('Dodaję slot w MySQL:', { date, time });
        await db.execute(
          'INSERT IGNORE INTO available_slots (date, time) VALUES (?, ?)',
          [date, time]
        );
      }
      console.log('Slot dodany pomyślnie');
    } catch (dbError) {
      console.error('Błąd dodawania slotu do bazy:', dbError);
      throw dbError; // Przekazujemy błąd dalej, aby został obsłużony przez główny blok try-catch
    }
    
    console.log('Slot dodany pomyślnie:', { date, time });
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
    console.log('Próba potwierdzenia wizyty o ID:', id);
    
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL dla potwierdzenia wizyty');
        await db.execute(
          "UPDATE appointments SET status = 'confirmed' WHERE id = $1",
          [id]
        );
      } else {
        console.log('Używam zapytania MySQL dla potwierdzenia wizyty');
        await db.execute(
          'UPDATE appointments SET status = "confirmed" WHERE id = ?',
          [id]
        );
      }
      console.log('Wizyta potwierdzona pomyślnie');
    } catch (dbError) {
      console.error('Błąd zapytania do bazy danych:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Błąd potwierdzania wizyty w bazie danych'
      });
    }
    
    res.json({
      success: true,
      message: 'Wizyta została potwierdzona'
    });
  } catch (error) {
    console.error('Błąd potwierdzania wizyty:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas potwierdzania wizyty'
    });
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
    let query = 'SELECT id, title, slug, excerpt, image_url, category, created_at FROM articles WHERE is_published = TRUE';
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
      'SELECT * FROM articles WHERE slug = ? AND is_published = TRUE',
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

// ENDPOINT DLA INFORMACJI KONTAKTOWYCH
app.get('/api/contact-info', async (req, res) => {
  try {
    // Zwracamy informacje kontaktowe salonu
    res.json({
      success: true,
      contactInfo: {
        phone: "532-128-227",
        email: "kontakt@wiktoriabeutybrows.pl",
        address: "ul. Przykładowa 123, 00-000 Warszawa"
      }
    });
  } catch (error) {
    console.error('Błąd pobierania informacji kontaktowych:', error);
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
      WHERE r.is_approved = TRUE
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