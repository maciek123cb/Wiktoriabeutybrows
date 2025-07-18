-- Tworzenie tabel
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS available_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (date, time)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  notes TEXT,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_appointment (date, time)
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL COMMENT 'czas trwania w minutach',
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metamorphoses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  treatment_name VARCHAR(255) NOT NULL,
  before_image VARCHAR(500) NOT NULL,
  after_image VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dodanie administratora
INSERT IGNORE INTO users (first_name, last_name, phone, email, password_hash, is_active, role) 
VALUES ('Admin', 'System', '123456789', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, 'admin');

-- Dodanie przykładowych usług
INSERT IGNORE INTO services (name, description, price, duration, category) VALUES
('Manicure klasyczny', 'Profesjonalny manicure z lakierowaniem', 80.00, 60, 'Manicure'),
('Manicure hybrydowy', 'Trwały manicure hybrydowy', 120.00, 90, 'Manicure'),
('Pedicure klasyczny', 'Pielęgnacja stóp z lakierowaniem', 100.00, 75, 'Pedicure'),
('Oczyszczanie twarzy', 'Głębokie oczyszczanie skóry twarzy', 150.00, 60, 'Pielęgnacja twarzy'),
('Peeling chemiczny', 'Profesjonalny peeling kwasami', 200.00, 45, 'Pielęgnacja twarzy'),
('Laminacja brwi', 'Modelowanie i laminacja brwi', 80.00, 45, 'Stylizacja brwi'),
('Mezoterapia igłowa', 'Odmładzająca mezoterapia', 300.00, 60, 'Medycyna estetyczna');

-- Dodanie przykładowych artykułów
INSERT IGNORE INTO articles (id, title, slug, excerpt, content, category, is_published) VALUES
(1, 'Jak dbać o skórę po zabiegu oczyszczania', 'jak-dbac-o-skore-po-zabiegu', 'Poznaj najważniejsze zasady pielęgnacji skóry po profesjonalnym oczyszczaniu twarzy.', '<h2>Pielęgnacja po zabiegu</h2><p>Po zabiegu oczyszczania twarzy skóra wymaga szczególnej opieki.</p>', 'Pielęgnacja', 1),
(2, 'Trendy w stylizacji brwi 2024', 'trendy-stylizacja-brwi-2024', 'Odkryj najgorętsze trendy w stylizacji brwi na nadchodzący sezon.', '<h2>Naturalne brwi</h2><p>W 2024 roku brwi nadal pozostają w centrum uwagi.</p>', 'Stylizacja', 1),
(3, 'Przygotowanie do manicure hybrydowego', 'przygotowanie-manicure-hybrydowy', 'Dowiedz się jak przygotować paznokcie do trwałego manicure.', '<h2>Krok po kroku</h2><p>Manicure hybrydowy to doskonały sposób na piękne paznokcie.</p>', 'Manicure', 1);