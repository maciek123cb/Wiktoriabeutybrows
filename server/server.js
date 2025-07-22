require('dotenv').config();

// Log environment variables for debugging (without sensitive info)
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_TYPE: process.env.DB_TYPE,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
});

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
// Dodajemy obsługę statycznych plików z folderu images
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

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
    // Tworzymy katalog uploads/metamorphoses w katalogu głównym projektu
    // Dla Render i podobnych platform, używamy katalogu /tmp, który jest dostępny dla zapisów
    const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
    const uploadPath = path.join(baseDir, 'uploads', 'metamorphoses');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Utworzono katalog ${uploadPath}`);
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

// Funkcja pomocnicza do generowania ścieżki URL dla plików
const getFileUrl = (filePath) => {
  // Jeśli ścieżka zaczyna się od http, zakładamy że to pełny URL (np. z GitHub)
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Jeśli jesteśmy w środowisku produkcyjnym, używamy pełnego URL
  if (process.env.NODE_ENV === 'production') {
    const baseUrl = process.env.BASE_URL || 'https://wiktoriabeutybrows-backend.onrender.com';
    return `${baseUrl}${filePath}`;
  }
  // W środowisku lokalnym zwracamy ścieżkę względną
  return filePath;
};

// Baza zdjęć dostępnych w repozytorium GitHub
const GITHUB_IMAGES = {
  before: [
    {
      name: 'przed_1.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/przed_1.jpg'
    },
    {
      name: 'przed_2.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/przed_2.jpg'
    },
    {
      name: 'przed_3.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/przed_3.jpg'
    }
  ],
  after: [
    {
      name: 'po_1.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/po_1.jpg'
    },
    {
      name: 'po_2.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/po_2.jpg'
    },
    {
      name: 'po_3.jpg',
      url: 'https://raw.githubusercontent.com/wiktoriabeutybrows/images/main/metamorphoses/po_3.jpg'
    }
  ]
};

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
    // Pobierz typ bazy danych z adaptera
    dbType = dbAdapter.getDbType();
    console.log('Typ bazy danych:', dbType);
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
      
      // Sprawdzamy czy kolumna duration istnieje w tabeli services
      try {
        if (dbType === 'postgres') {
          const [columnCheck] = await db.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration'"
          );
          
          if (columnCheck.length === 0) {
            await db.execute(
              "ALTER TABLE services ADD COLUMN duration INTEGER NOT NULL DEFAULT 0"
            );
            console.log('Dodano kolumnę duration do tabeli services');
          }
        } else {
          const [columnCheck] = await db.execute(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'services' AND column_name = 'duration'"
          );
          
          if (columnCheck[0].count === 0) {
            await db.execute(
              "ALTER TABLE services ADD COLUMN duration INT NOT NULL DEFAULT 0"
            );
            console.log('Dodano kolumnę duration do tabeli services');
          }
        }
      } catch (alterError) {
        console.error('Błąd sprawdzania/dodawania kolumny duration w tabeli services:', alterError);
      }
      
      // Dodajemy kolumnę total_price do tabeli appointments, jeśli nie istnieje
      try {
        if (dbType === 'postgres') {
          // Sprawdzamy czy kolumna total_price istnieje
          const [columnCheck] = await db.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'total_price'"
          );
          
          if (columnCheck.length === 0) {
            await db.execute(
              "ALTER TABLE appointments ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0"
            );
            console.log('Dodano kolumnę total_price do tabeli appointments');
          }
          
          // Sprawdzamy czy kolumna total_duration istnieje
          const [durationColumnCheck] = await db.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'total_duration'"
          );
          
          if (durationColumnCheck.length === 0) {
            await db.execute(
              "ALTER TABLE appointments ADD COLUMN total_duration INTEGER DEFAULT 0"
            );
            console.log('Dodano kolumnę total_duration do tabeli appointments');
          }
        } else {
          // MySQL
          // Sprawdzamy czy kolumna total_price istnieje
          const [columnCheck] = await db.execute(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'total_price'"
          );
          
          if (columnCheck[0].count === 0) {
            await db.execute(
              "ALTER TABLE appointments ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0"
            );
            console.log('Dodano kolumnę total_price do tabeli appointments');
          }
          
          // Sprawdzamy czy kolumna total_duration istnieje
          const [durationColumnCheck] = await db.execute(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'total_duration'"
          );
          
          if (durationColumnCheck[0].count === 0) {
            await db.execute(
              "ALTER TABLE appointments ADD COLUMN total_duration INT DEFAULT 0"
            );
            console.log('Dodano kolumnę total_duration do tabeli appointments');
          }
        }
      } catch (alterError) {
        console.error('Błąd dodawania kolumny total_price:', alterError);
      }
      
      // Tworzymy tabelę appointment_services, jeśli nie istnieje
      try {
        if (dbType === 'postgres') {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS appointment_services (
              id SERIAL PRIMARY KEY,
              appointment_id INTEGER NOT NULL,
              service_id INTEGER,
              service_name VARCHAR(255) NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              duration INTEGER NOT NULL DEFAULT 0,
              FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            )
          `);
          
          // Check if duration column exists, if not add it
          const [columnCheck] = await db.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'appointment_services' AND column_name = 'duration'"
          );
          
          if (columnCheck.length === 0) {
            await db.execute(
              "ALTER TABLE appointment_services ADD COLUMN duration INTEGER NOT NULL DEFAULT 0"
            );
            console.log('Dodano kolumnę duration do tabeli appointment_services');
          }
        } else {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS appointment_services (
              id INT AUTO_INCREMENT PRIMARY KEY,
              appointment_id INT NOT NULL,
              service_id INT,
              service_name VARCHAR(255) NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              duration INT NOT NULL DEFAULT 0,
              FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            )
          `);
          
          // Check if duration column exists, if not add it
          const [columnCheck] = await db.execute(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'appointment_services' AND column_name = 'duration'"
          );
          
          if (columnCheck[0].count === 0) {
            await db.execute(
              "ALTER TABLE appointment_services ADD COLUMN duration INT NOT NULL DEFAULT 0"
            );
            console.log('Dodano kolumnę duration do tabeli appointment_services');
          }
        }
        console.log('Tabela appointment_services została utworzona lub już istnieje');
      } catch (tableError) {
        console.error('Błąd tworzenia tabeli appointment_services:', tableError);
      }
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
    
    // Jeśli nie ma numerów, zwróć pustą listę
    if (phoneNumbers.length === 0) {
      console.log('Nie znaleziono żadnych numerów telefonów');
      return res.json({
        success: true,
        phoneNumbers: [],
        formattedPhoneNumbers: '',
        count: 0
      });
    }
    
    res.json({
      success: true,
      phoneNumbers,
      formattedPhoneNumbers: phoneNumbers.join(', '),
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
    const { email, password, rememberMe } = req.body;
    console.log('Próba logowania:', email, 'Zapamiętaj mnie:', rememberMe);

    try {
      let users;
      if (dbType === 'postgres') {
        [users] = await db.execute(
          'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = $1',
          [email]
        );
      } else {
        [users] = await db.execute(
          'SELECT id, first_name, last_name, email, password_hash, is_active, role FROM users WHERE email = ?',
          [email]
        );
      }

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

        // Ustawiamy czas ważności tokenu w zależności od opcji "Zapamiętaj mnie"
        const expiresIn = rememberMe ? '30d' : '24h';
        console.log('Czas ważności tokenu:', expiresIn);

        const token = jwt.sign(
          { 
            id: user.id,
            email: user.email, 
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name
          },
          JWT_SECRET,
          { expiresIn }
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
          },
          expiresIn
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

        // Ustawiamy czas ważności tokenu w zależności od opcji "Zapamiętaj mnie"
        const expiresIn = rememberMe ? '30d' : '24h';
        console.log('Czas ważności tokenu:', expiresIn);

        const token = jwt.sign(
          { 
            id: user.id,
            email: user.email, 
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name
          },
          JWT_SECRET,
          { expiresIn }
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
          },
          expiresIn
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

    let query;
    if (dbType === 'postgres') {
      query = `
        SELECT a.id, a.date, a.time, a.notes, a.status, a.created_at, a.total_price,
               (SELECT COALESCE(SUM(duration), 0) FROM appointment_services WHERE appointment_id = a.id) as total_duration
        FROM appointments a
        WHERE a.user_id = $1
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      query = `
        SELECT a.id, a.date, a.time, a.notes, a.status, a.created_at, a.total_price,
               (SELECT IFNULL(SUM(duration), 0) FROM appointment_services WHERE appointment_id = a.id) as total_duration
        FROM appointments a
        WHERE a.user_id = ?
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    const [appointments] = await db.execute(query, [userId]);
    
    // Pobierz usługi dla każdej wizyty
    for (const appointment of appointments) {
      try {
        // Używamy funkcji do pobierania usług
        const fixAppointmentServices = require('./fix-appointment-services');
        await fixAppointmentServices(appointment, dbType, db);
      } catch (servicesError) {
        console.error(`Błąd pobierania usług dla wizyty ID ${appointment.id}:`, servicesError);
        appointment.services = [];
      }
    }

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
    const { date, time, notes, services, totalPrice } = req.body;
    const userId = req.user.id;
    
    console.log('Próba rezerwacji terminu:', { date, time, userId, services });
    
    // Obliczamy łączny czas trwania usług
    let totalDuration = 0;
    if (services && Array.isArray(services) && services.length > 0) {
      totalDuration = services.reduce((sum, service) => sum + (service.duration || 0), 0);
      console.log('Całkowity czas trwania usług:', totalDuration, 'minut');
      
      // Maksymalny czas to 90 minut (1:30h)
      if (totalDuration > 90) {
        return res.status(400).json({
          success: false,
          message: 'Czas trwania wybranych usług przekracza 1:30h. Na dłuższe wizyty prosimy umawiać się telefonicznie.'
        });
      }
    }
    
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
    let appointmentId;
    try {
      if (dbType === 'postgres') {
        console.log('Używam zapytania PostgreSQL dla dodania rezerwacji');
        const [result] = await db.execute(
          "INSERT INTO appointments (user_id, date, time, notes, total_price, total_duration) VALUES ($1, TO_DATE($2, 'YYYY-MM-DD'), $3, $4, $5, $6) RETURNING id",
          [userId, formattedDate, time, notes || '', totalPrice || 0, totalDuration]
        );
        appointmentId = result[0].id;
      } else {
        console.log('Używam zapytania MySQL dla dodania rezerwacji');
        const [result] = await db.execute(
          'INSERT INTO appointments (user_id, date, time, notes, total_price, total_duration) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, formattedDate, time, notes || '', totalPrice || 0, totalDuration]
        );
        appointmentId = result.insertId;
      }
      console.log('Rezerwacja dodana pomyślnie, ID:', appointmentId);
      
      // Dodajemy wybrane usługi do rezerwacji
      if (services && Array.isArray(services) && services.length > 0) {
        console.log('Dodawanie wybranych usług do rezerwacji:', services);
        
        // Sprawdzamy czy tabela appointment_services istnieje, jeśli nie, tworzymy ją
        try {
          if (dbType === 'postgres') {
            await db.execute(`
              CREATE TABLE IF NOT EXISTS appointment_services (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER NOT NULL,
                service_id INTEGER,
                service_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
              )
            `);
          } else {
            await db.execute(`
              CREATE TABLE IF NOT EXISTS appointment_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                service_id INT,
                service_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration INT NOT NULL DEFAULT 0,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
              )
            `);
          }
        } catch (tableError) {
          console.error('Błąd tworzenia tabeli appointment_services:', tableError);
          // Kontynuujemy mimo błędu, może tabela już istnieje
        }
        
        // Dodajemy każdą usługę do tabeli appointment_services
        for (const service of services) {
          try {
            if (dbType === 'postgres') {
              await db.execute(
                'INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES ($1, $2, $3, $4, $5)',
                [appointmentId, service.id || null, service.name || service.service_name, service.price || 0, service.duration || 0]
              );
            } else {
              await db.execute(
                'INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES (?, ?, ?, ?, ?)',
                [appointmentId, service.id || null, service.name || service.service_name, service.price || 0, service.duration || 0]
              );
            }
          } catch (serviceError) {
            console.error('Błąd dodawania usługi do rezerwacji:', serviceError);
            // Kontynuujemy mimo błędu, aby dodać pozostałe usługi
          }
        }
      }
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
    
    // Jeśli nie ma slotów w bazie, zwróć pustą tablicę
    if (!slotsCheck[0] || slotsCheck[0].count === 0) {
      console.log('Brak slotów w bazie, zwracam pustą tablicę');
      return res.json({ dates: [] });
    }
    
    let query;
    if (dbType === 'postgres') {
      query = 'SELECT DISTINCT date FROM available_slots WHERE date >= CURRENT_DATE ORDER BY date';
    } else {
      query = 'SELECT DISTINCT date FROM available_slots WHERE date >= CURDATE() ORDER BY date';
    }
    
    console.log('Wykonuję zapytanie:', query);
    
    const [slots] = await db.execute(query);
    console.log('Raw slots z bazy (typ):', typeof slots, 'czy tablica:', Array.isArray(slots));
    
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
  } catch (error) {
    console.error('Błąd pobierania dat:', error);
    return res.json({ dates: [] }); // Zwracamy pustą tablicę w przypadku błędu
  }
});

// Endpoint dla dostępnych slotów - dostępny dla wszystkich użytkowników
app.get('/api/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Pobieranie slotów dla daty:', date);
    
    // Sprawdzamy format daty
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.warn('Nieprawidłowy format daty:', date);
      return res.json({ slots: [] }); // Zwracamy pustą tablicę w przypadku nieprawidłowego formatu
    }
    
    console.log('Format daty poprawny:', date);
    
    try {
      // Pobieramy wszystkie dostępne sloty dla danej daty
      console.log('Sprawdzam sloty dla daty:', date);
      
      // Najpierw sprawdź, czy data istnieje w tabeli available_slots
      console.log('Sprawdzam datę w bazie:', date, 'typ bazy:', dbType);
      
      let dateCheck;
      try {
        if (dbType === 'postgres') {
          console.log('Używam zapytania PostgreSQL dla sprawdzenia daty');
          const [result] = await db.execute(
            "SELECT COUNT(*) as count FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1",
            [date]
          );
          dateCheck = result;
        } else {
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
        return res.json({ slots: [] }); // Zwracamy pustą tablicę w przypadku błędu
      }
      
      // Jeśli nie ma slotów dla danej daty, zwróć pustą tablicę
      if (!dateCheck || !dateCheck[0] || dateCheck[0].count === 0) {
        console.log('Brak slotów dla daty:', date, 'zwracam pustą tablicę');
        return res.json({ slots: [] });
      }
      
      // Jeśli data istnieje, pobierz dostępne sloty
      let availableSlots;
      try {
        if (dbType === 'postgres') {
          console.log('Używam zapytania PostgreSQL dla daty:', date);
          const [result] = await db.execute(
            "SELECT time FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 ORDER BY time",
            [date]
          );
          availableSlots = result;
        } else {
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
        return res.json({ slots: [] }); // Zwracamy pustą tablicę w przypadku błędu
      }
      
      // Jeśli nie ma dostępnych slotów, zwróć pustą tablicę
      if (!availableSlots || !Array.isArray(availableSlots) || availableSlots.length === 0) {
        console.log('Brak dostępnych slotów, zwracam pustą tablicę');
        return res.json({ slots: [] });
      }
      
      // Pobieramy wszystkie zarezerwowane sloty dla danej daty
      let reservedSlots;
      try {
        if (dbType === 'postgres') {
          console.log('Używam zapytania PostgreSQL dla zarezerwowanych slotów, data:', date);
          const [result] = await db.execute(
            "SELECT time FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND status != 'cancelled'",
            [date]
          );
          reservedSlots = result;
        } else {
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
      return res.json({ slots: [] }); // Zwracamy pustą tablicę w przypadku błędu
    }
  } catch (error) {
    console.error('Błąd pobierania slotów:', error);
    return res.json({ slots: [] }); // Zwracamy pustą tablicę w przypadku błędu
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
    
    let allSlots, bookedAppointments;
    
    if (dbType === 'postgres') {
      [allSlots] = await db.execute(
        "SELECT time FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 ORDER BY time",
        [date]
      );
      
      [bookedAppointments] = await db.execute(
        `SELECT a.time, u.first_name, u.last_name 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE TO_CHAR(a.date, 'YYYY-MM-DD') = $1 AND a.status != 'cancelled' 
         ORDER BY a.time`,
        [date]
      );
    } else {
      [allSlots] = await db.execute(
        'SELECT time FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? ORDER BY time',
        [date]
      );
      
      [bookedAppointments] = await db.execute(
        `SELECT a.time, u.first_name, u.last_name 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE DATE_FORMAT(a.date, "%Y-%m-%d") = ? AND a.status != 'cancelled' 
         ORDER BY a.time`,
        [date]
      );
    }
    
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
    
    if (dbType === 'postgres') {
      await db.execute(
        "DELETE FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND time = $2",
        [date, time]
      );
    } else {
      await db.execute(
        'DELETE FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND time = ?',
        [date, time]
      );
    }
    
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
    let query, params = [];
    
    if (dbType === 'postgres') {
      query = `
        SELECT a.id, a.date, a.time, a.notes, a.status, a.created_at, a.total_price,
               u.first_name, u.last_name, u.email, u.phone,
               CASE WHEN u.password_hash = 'manual_account' THEN 'manual' ELSE 'registered' END as account_type,
               (SELECT COALESCE(SUM(duration), 0) FROM appointment_services WHERE appointment_id = a.id) as total_duration
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      
      if (date) {
        query += " AND TO_CHAR(a.date, 'YYYY-MM-DD') = $" + (params.length + 1);
        params.push(date);
      }
      
      if (search) {
        query += " AND (u.first_name ILIKE $" + (params.length + 1) + " OR u.last_name ILIKE $" + (params.length + 2) + ")";
        params.push(`%${search}%`, `%${search}%`);
      }
    } else {
      query = `
        SELECT a.id, a.date, a.time, a.notes, a.status, a.created_at, a.total_price,
               u.first_name, u.last_name, u.email, u.phone,
               CASE WHEN u.password_hash = 'manual_account' THEN 'manual' ELSE 'registered' END as account_type,
               (SELECT IFNULL(SUM(duration), 0) FROM appointment_services WHERE appointment_id = a.id) as total_duration
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      
      if (date) {
        query += ' AND DATE_FORMAT(a.date, "%Y-%m-%d") = ?';
        params.push(date);
      }
      
      if (search) {
        query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
    }
    
    query += ' ORDER BY a.date, a.time';
    
    const [appointments] = await db.execute(query, params);
    
    // Pobierz usługi dla każdej wizyty
    for (const appointment of appointments) {
      try {
        // Używamy funkcji do pobierania usług
        const fixAppointmentServices = require('./fix-appointment-services');
        const services = await fixAppointmentServices(appointment, dbType, db);
        
        // Oblicz łączny czas trwania usług
        appointment.total_duration = services.reduce((sum, service) => sum + (parseInt(service.duration) || 0), 0);
      } catch (servicesError) {
        console.error(`Błąd pobierania usług dla wizyty ID ${appointment.id}:`, servicesError);
        appointment.services = [];
        appointment.total_duration = 0;
      }
    }
    
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

    const { firstName, lastName, phone, email, date, time, notes, services, totalPrice } = req.body;

    // Walidacja danych
    if (!firstName || !lastName || !phone || !email || !date || !time) {
      console.error('Brakujące dane:', { firstName, lastName, phone, email, date, time });
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }
    
    console.log('Dane wizyty:', { firstName, lastName, phone, email, date, time, notes });

    // Sprawdź czy termin jest dostępny
    let availableSlot;
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

    if (availableSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin nie jest dostępny w systemie'
      });
    }

    // Sprawdź czy termin nie jest już zarezerwowany
    let existingAppointment;
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

    if (existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ten termin jest już zajęty'
      });
    }

    // Utwórz tymczasowego użytkownika lub znajdź istniejącego
    let userId;
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

    if (existingUser.length > 0) {
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

    // Obliczamy łączny czas trwania usług
    let totalDuration = 0;
    if (services && Array.isArray(services) && services.length > 0) {
      totalDuration = services.reduce((sum, service) => sum + (service.duration || 0), 0);
      console.log('Całkowity czas trwania usług:', totalDuration, 'minut');
      
      // Maksymalny czas to 90 minut (1:30h)
      if (totalDuration > 90) {
        return res.status(400).json({
          success: false,
          message: 'Czas trwania wybranych usług przekracza 1:30h. Na dłuższe wizyty prosimy umawiać się telefonicznie.'
        });
      }
    }
    
    // Dodaj wizytę jako potwierdzoną
    let appointmentId;
    
    // Upewnij się, że totalPrice i totalDuration są liczbami
    // Konwertujemy na liczby i upewniamy się, że nie są NaN
    const numericTotalPrice = Number(parseFloat(totalPrice || 0));
    const numericTotalDuration = Number(parseInt(totalDuration || 0));
    
    console.log('Wartości przed zapisem:', { 
      userId, 
      date, 
      time, 
      notes: notes || '', 
      totalPrice: numericTotalPrice, 
      totalDuration: numericTotalDuration 
    });
    
    try {
      if (dbType === 'postgres') {
        const [result] = await db.execute(
          "INSERT INTO appointments (user_id, date, time, notes, status, total_price, total_duration) VALUES ($1, TO_DATE($2, 'YYYY-MM-DD'), $3, $4, 'confirmed', $5, $6) RETURNING id",
          [userId, date, time, notes || '', numericTotalPrice, numericTotalDuration]
        );
        appointmentId = result[0].id;
      } else {
        const [result] = await db.execute(
          'INSERT INTO appointments (user_id, date, time, notes, status, total_price, total_duration) VALUES (?, ?, ?, ?, "confirmed", ?, ?)',
          [userId, date, time, notes || '', numericTotalPrice, numericTotalDuration]
        );
        appointmentId = result.insertId;
      }
      console.log('Wizyta dodana pomyślnie, ID:', appointmentId);
    } catch (insertError) {
      console.error('Błąd dodawania wizyty:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Błąd dodawania wizyty: ' + insertError.message
      });
    }
    
    // Dodajemy wybrane usługi do rezerwacji
    if (services && Array.isArray(services) && services.length > 0) {
      console.log('Dodawanie wybranych usług do rezerwacji:', services);
      
      // Sprawdzamy czy tabela appointment_services istnieje, jeśli nie, tworzymy ją
      try {
        if (dbType === 'postgres') {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS appointment_services (
              id SERIAL PRIMARY KEY,
              appointment_id INTEGER NOT NULL,
              service_id INTEGER,
              service_name VARCHAR(255) NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              duration INTEGER NOT NULL DEFAULT 0,
              FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            )
          `);
        } else {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS appointment_services (
              id INT AUTO_INCREMENT PRIMARY KEY,
              appointment_id INT NOT NULL,
              service_id INT,
              service_name VARCHAR(255) NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              duration INT NOT NULL DEFAULT 0,
              FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            )
          `);
        }
        console.log('Tabela appointment_services została utworzona lub już istnieje');
      } catch (tableError) {
        console.error('Błąd tworzenia tabeli appointment_services:', tableError);
        // Kontynuujemy mimo błędu, może tabela już istnieje
      }
      
      // Dodajemy każdą usługę do tabeli appointment_services
      for (const service of services) {
        try {
          if (dbType === 'postgres') {
            await db.execute(
              'INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES ($1, $2, $3, $4, $5)',
              [appointmentId, service.id || null, service.name, service.price || 0, service.duration || 0]
            );
          } else {
            await db.execute(
              'INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES (?, ?, ?, ?, ?)',
              [appointmentId, service.id || null, service.name, service.price || 0, service.duration || 0]
            );
          }
        } catch (serviceError) {
          console.error('Błąd dodawania usługi do rezerwacji:', serviceError);
          // Kontynuujemy mimo błędu, aby dodać pozostałe usługi
        }
      }
    }

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
    try {
      // Jawnie wymieniamy wszystkie kolumny, w tym duration
      const [services] = await db.execute(
        'SELECT id, name, description, price, duration, category, is_active FROM services WHERE is_active = TRUE ORDER BY category, name'
      );
      
      // Zawsze zwracamy tablicę, nawet jeśli jest pusta
      const safeServices = Array.isArray(services) ? services : [];
      
      // Logujemy dla debugowania
      console.log('Pobrano usługi z czasem trwania:', safeServices.map(s => ({ id: s.id, name: s.name, duration: s.duration })));
      
      res.json({ services: safeServices });
    } catch (dbError) {
      console.error('Błąd zapytania do bazy danych:', dbError);
      // W przypadku błędu zwracamy pustą tablicę
      res.json({ services: [] });
    }
  } catch (error) {
    console.error('Błąd pobierania usług:', error);
    // W przypadku błędu zwracamy pustą tablicę
    res.json({ services: [] });
  }
});

app.get('/api/admin/services', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const [services] = await db.execute(
      'SELECT id, name, description, price, duration, category, is_active, created_at, updated_at FROM services ORDER BY category, name'
    );
    
    // Logujemy dla debugowania
    console.log('Admin - pobrano usługi z czasem trwania:', services.map(s => ({ id: s.id, name: s.name, duration: s.duration })));
    
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
    
    // Upewniamy się, że duration jest liczbą
    const parsedDuration = parseInt(duration) || 0;
    console.log('Dodawanie usługi z czasem trwania:', parsedDuration, 'minut');
    
    if (dbType === 'postgres') {
      await db.execute(
        'INSERT INTO services (name, description, price, duration, category) VALUES ($1, $2, $3, $4, $5)',
        [name, description, price, parsedDuration, category]
      );
    } else {
      await db.execute(
        'INSERT INTO services (name, description, price, duration, category) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, parsedDuration, category]
      );
    }
    
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
    
    // Upewniamy się, że duration jest liczbą
    const parsedDuration = parseInt(duration) || 0;
    console.log('Aktualizacja usługi z ID:', id, 'czas trwania:', parsedDuration, 'minut');
    
    if (dbType === 'postgres') {
      await db.execute(
        'UPDATE services SET name = $1, description = $2, price = $3, duration = $4, category = $5, is_active = $6 WHERE id = $7',
        [name, description, price, parsedDuration, category, is_active, id]
      );
    } else {
      await db.execute(
        'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, category = ?, is_active = ? WHERE id = ?',
        [name, description, price, parsedDuration, category, is_active, id]
      );
    }
    
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
    // Zawsze zwracamy informacje kontaktowe salonu
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
    // Nawet w przypadku błędu zwracamy domyślne dane kontaktowe
    res.json({
      success: true,
      contactInfo: {
        phone: "532-128-227",
        email: "kontakt@wiktoriabeutybrows.pl",
        address: "ul. Przykładowa 123, 00-000 Warszawa"
      }
    });
  }
});

// ENDPOINTY DLA OPINII
app.get('/api/reviews', async (req, res) => {
  try {
    // Sprawdź czy tabela reviews istnieje
    let tableExists = false;
    try {
      if (dbType === 'postgres') {
        const [result] = await db.execute(
          "SELECT to_regclass('public.reviews') IS NOT NULL as exists"
        );
        tableExists = result[0].exists;
      } else {
        const [result] = await db.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reviews'"
        );
        tableExists = result[0].count > 0;
      }
    } catch (tableError) {
      console.error('Błąd sprawdzania istnienia tabeli reviews:', tableError);
      tableExists = false;
    }
    
    // Jeśli tabela nie istnieje, zwróć pustą tablicę
    if (!tableExists) {
      console.log('Tabela reviews nie istnieje, zwracam pustą tablicę');
      return res.json({ reviews: [] });
    }
    
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
    // W przypadku błędu zwróć pustą tablicę
    res.json({ reviews: [] });
  }
});

app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!rating || !comment || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Nieprawidłowe dane' });
    }
    
    // Sprawdź czy tabela reviews istnieje, jeśli nie - utwórz ją
    try {
      if (dbType === 'postgres') {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
      } else {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
      }
      console.log('Tabela reviews została utworzona lub już istnieje');
    } catch (tableError) {
      console.error('Błąd tworzenia tabeli reviews:', tableError);
      return res.status(500).json({ 
        success: false,
        message: 'Błąd tworzenia tabeli opinii' 
      });
    }
    
    // Dodaj opinię
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
    
    // Sprawdź czy tabela reviews istnieje
    let tableExists = false;
    try {
      if (dbType === 'postgres') {
        const [result] = await db.execute(
          "SELECT to_regclass('public.reviews') IS NOT NULL as exists"
        );
        tableExists = result[0].exists;
      } else {
        const [result] = await db.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reviews'"
        );
        tableExists = result[0].count > 0;
      }
    } catch (tableError) {
      console.error('Błąd sprawdzania istnienia tabeli reviews:', tableError);
      tableExists = false;
    }
    
    // Jeśli tabela nie istnieje, utwórz ją
    if (!tableExists) {
      try {
        if (dbType === 'postgres') {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
              comment TEXT NOT NULL,
              is_approved BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
        } else {
          await db.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
              comment TEXT NOT NULL,
              is_approved BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
        }
        console.log('Tabela reviews została utworzona');
      } catch (createError) {
        console.error('Błąd tworzenia tabeli reviews:', createError);
        return res.json({ reviews: [] });
      }
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
    res.json({ reviews: [] });
  }
});

app.delete('/api/admin/reviews/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    // Sprawdź czy tabela reviews istnieje
    let tableExists = false;
    try {
      if (dbType === 'postgres') {
        const [result] = await db.execute(
          "SELECT to_regclass('public.reviews') IS NOT NULL as exists"
        );
        tableExists = result[0].exists;
      } else {
        const [result] = await db.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reviews'"
        );
        tableExists = result[0].count > 0;
      }
    } catch (tableError) {
      console.error('Błąd sprawdzania istnienia tabeli reviews:', tableError);
      tableExists = false;
    }
    
    // Jeśli tabela nie istnieje, zwróć sukces (nie ma co usuwać)
    if (!tableExists) {
      return res.json({ success: true, message: 'Tabela opinii nie istnieje' });
    }
    
    const { id } = req.params;
    await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Opinia została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Endpoint do zatwierdzania opinii
app.patch('/api/admin/reviews/:id/approve', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    // Sprawdź czy tabela reviews istnieje
    let tableExists = false;
    try {
      if (dbType === 'postgres') {
        const [result] = await db.execute(
          "SELECT to_regclass('public.reviews') IS NOT NULL as exists"
        );
        tableExists = result[0].exists;
      } else {
        const [result] = await db.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reviews'"
        );
        tableExists = result[0].count > 0;
      }
    } catch (tableError) {
      console.error('Błąd sprawdzania istnienia tabeli reviews:', tableError);
      tableExists = false;
    }
    
    // Jeśli tabela nie istnieje, zwróć błąd
    if (!tableExists) {
      return res.status(404).json({ success: false, message: 'Tabela opinii nie istnieje' });
    }
    
    const { id } = req.params;
    const { is_approved } = req.body;
    
    await db.execute('UPDATE reviews SET is_approved = ? WHERE id = ?', [is_approved, id]);
    
    res.json({
      success: true,
      message: is_approved ? 'Opinia została zatwierdzona' : 'Opinia została odrzucona'
    });
  } catch (error) {
    console.error('Błąd zatwierdzania opinii:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Endpoint do pobierania listy dostępnych zdjęć z lokalnych folderów
app.get('/api/available-images', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    // Ścieżki do folderów z obrazami
    const beforeDir = path.join(__dirname, '..', 'images', 'metamorphoses', 'before');
    const afterDir = path.join(__dirname, '..', 'images', 'metamorphoses', 'after');
    
    // Odczytaj pliki z folderów
    let beforeImages = [];
    let afterImages = [];
    
    try {
      // Sprawdź czy foldery istnieją
      if (fs.existsSync(beforeDir)) {
        const beforeFiles = fs.readdirSync(beforeDir);
        beforeImages = beforeFiles
          .filter(file => file !== '.gitkeep' && /\.(jpg|jpeg|png|gif)$/i.test(file))
          .map(file => ({
            name: file,
            url: `/images/metamorphoses/before/${file}`
          }));
      }
      
      if (fs.existsSync(afterDir)) {
        const afterFiles = fs.readdirSync(afterDir);
        afterImages = afterFiles
          .filter(file => file !== '.gitkeep' && /\.(jpg|jpeg|png|gif)$/i.test(file))
          .map(file => ({
            name: file,
            url: `/images/metamorphoses/after/${file}`
          }));
      }
    } catch (fsError) {
      console.error('Błąd odczytu plików:', fsError);
    }
    
    res.json({
      success: true,
      images: {
        before: beforeImages,
        after: afterImages
      }
    });
  } catch (error) {
    console.error('Błąd pobierania listy zdjęć:', error);
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
    
    // Tworzymy pełny URL dla odpowiedzi
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (process.env.BASE_URL || 'https://wiktoriabeutybrows-backend.onrender.com') : 
      'http://localhost:3001';
    
    // Upewniamy się, że ścieżki do zdjęć są pełnymi URL
    const processedMetamorphoses = metamorphoses.map(item => {
      // Jeśli ścieżka nie zaczyna się od http, dodajemy pełny URL
      const beforeImage = item.before_image.startsWith('http') ? 
        item.before_image : `${baseUrl}${item.before_image}`;
      
      const afterImage = item.after_image.startsWith('http') ? 
        item.after_image : `${baseUrl}${item.after_image}`;
      
      return {
        ...item,
        before_image: beforeImage,
        after_image: afterImage
      };
    });
    
    res.json({ metamorphoses: processedMetamorphoses });
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
    
    // Tworzymy pełny URL dla odpowiedzi
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (process.env.BASE_URL || 'https://wiktoriabeutybrows-backend.onrender.com') : 
      'http://localhost:3001';
    
    // Upewniamy się, że ścieżki do zdjęć są pełnymi URL
    const processedMetamorphoses = metamorphoses.map(item => {
      // Jeśli ścieżka nie zaczyna się od http, dodajemy pełny URL
      const beforeImage = item.before_image.startsWith('http') ? 
        item.before_image : `${baseUrl}${item.before_image}`;
      
      const afterImage = item.after_image.startsWith('http') ? 
        item.after_image : `${baseUrl}${item.after_image}`;
      
      // Wyciągnij nazwy plików z pełnych URL
      const getImageNameFromUrl = (url) => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      };
      
      const beforeImageName = getImageNameFromUrl(item.before_image);
      const afterImageName = getImageNameFromUrl(item.after_image);
      
      return {
        ...item,
        before_image: beforeImage,
        after_image: afterImage,
        before_image_name: beforeImageName,
        after_image_name: afterImageName
      };
    });
    
    res.json({ metamorphoses: processedMetamorphoses });
  } catch (error) {
    console.error('Błąd pobierania metamorfoz:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/admin/metamorphoses', verifyToken, express.json(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { treatmentName, beforeImageName, afterImageName } = req.body;
    
    if (!treatmentName || !beforeImageName || !afterImageName) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }
    
    // Tworzymy ścieżki do plików
    const beforeImagePath = `/images/metamorphoses/before/${beforeImageName}`;
    const afterImagePath = `/images/metamorphoses/after/${afterImageName}`;
    
    // Sprawdzamy czy pliki istnieją
    const beforeFilePath = path.join(__dirname, '..', 'images', 'metamorphoses', 'before', beforeImageName);
    const afterFilePath = path.join(__dirname, '..', 'images', 'metamorphoses', 'after', afterImageName);
    
    if (!fs.existsSync(beforeFilePath) || !fs.existsSync(afterFilePath)) {
      return res.status(400).json({
        success: false,
        message: 'Wybrane zdjęcia nie istnieją'
      });
    }
    
    console.log('Zapisuję ścieżki do bazy danych:', { beforeImagePath, afterImagePath });
    
    await db.execute(
      'INSERT INTO metamorphoses (treatment_name, before_image, after_image) VALUES (?, ?, ?)',
      [treatmentName, beforeImagePath, afterImagePath]
    );
    
    // Tworzymy pełne URL dla odpowiedzi
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (process.env.BASE_URL || 'https://wiktoriabeutybrows-backend.onrender.com') : 
      'http://localhost:3001';
    
    const fullBeforeUrl = `${baseUrl}${beforeImagePath}`;
    const fullAfterUrl = `${baseUrl}${afterImagePath}`;
    
    res.json({ 
      success: true, 
      message: 'Metamorfoza została dodana',
      metamorphosis: {
        treatmentName,
        beforeImage: fullBeforeUrl,
        afterImage: fullAfterUrl
      }
    });
  } catch (error) {
    console.error('Błąd dodawania metamorfozy:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

app.put('/api/admin/metamorphoses/:id', verifyToken, express.json(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    
    const { id } = req.params;
    const { treatmentName, beforeImageName, afterImageName } = req.body;
    
    // Pobierz obecne dane
    const [current] = await db.execute('SELECT * FROM metamorphoses WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Metamorfoza nie znaleziona' });
    }
    
    let beforeImagePath = current[0].before_image;
    let afterImagePath = current[0].after_image;
    
    // Aktualizuj zdjęcia jeśli podano nowe nazwy
    if (beforeImageName) {
      const newBeforePath = `/images/metamorphoses/before/${beforeImageName}`;
      const beforeFilePath = path.join(__dirname, '..', 'images', 'metamorphoses', 'before', beforeImageName);
      
      if (!fs.existsSync(beforeFilePath)) {
        return res.status(400).json({
          success: false,
          message: 'Wybrane zdjęcie "przed" nie istnieje'
        });
      }
      beforeImagePath = newBeforePath;
    }
    
    if (afterImageName) {
      const newAfterPath = `/images/metamorphoses/after/${afterImageName}`;
      const afterFilePath = path.join(__dirname, '..', 'images', 'metamorphoses', 'after', afterImageName);
      
      if (!fs.existsSync(afterFilePath)) {
        return res.status(400).json({
          success: false,
          message: 'Wybrane zdjęcie "po" nie istnieje'
        });
      }
      afterImagePath = newAfterPath;
    }
    
    console.log('Aktualizuję ścieżki w bazie danych:', { beforeImagePath, afterImagePath });
    
    await db.execute(
      'UPDATE metamorphoses SET treatment_name = ?, before_image = ?, after_image = ? WHERE id = ?',
      [treatmentName, beforeImagePath, afterImagePath, id]
    );
    
    // Tworzymy pełne URL dla odpowiedzi
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (process.env.BASE_URL || 'https://wiktoriabeutybrows-backend.onrender.com') : 
      'http://localhost:3001';
    
    const fullBeforeUrl = beforeImagePath.startsWith('http') ? 
      beforeImagePath : `${baseUrl}${beforeImagePath}`;
    const fullAfterUrl = afterImagePath.startsWith('http') ? 
      afterImagePath : `${baseUrl}${afterImagePath}`;
    
    res.json({ 
      success: true, 
      message: 'Metamorfoza została zaktualizowana',
      metamorphosis: {
        id,
        treatmentName,
        beforeImage: fullBeforeUrl,
        afterImage: fullAfterUrl
      }
    });
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
    
    // Usuwamy tylko wpis z bazy danych, nie próbujemy usuwać plików
    // ponieważ mogą być przechowywane w różnych miejscach
    await db.execute('DELETE FROM metamorphoses WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Metamorfoza została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania metamorfozy:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

startServer().catch(console.error);