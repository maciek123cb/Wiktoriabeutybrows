// Funkcje pomocnicze do zarządzania kontami użytkowników

/**
 * Usuwa polskie znaki z tekstu
 * @param {string} text - Tekst do przetworzenia
 * @returns {string} - Tekst bez polskich znaków
 */
const removePolishChars = (text) => {
  return text
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'a')
    .replace(/Ć/g, 'c')
    .replace(/Ę/g, 'e')
    .replace(/Ł/g, 'l')
    .replace(/Ń/g, 'n')
    .replace(/Ó/g, 'o')
    .replace(/Ś/g, 's')
    .replace(/Ź/g, 'z')
    .replace(/Ż/g, 'z');
};

/**
 * Generuje login na podstawie imienia i nazwiska
 * @param {string} firstName - Imię użytkownika
 * @param {string} lastName - Nazwisko użytkownika
 * @returns {string} - Login użytkownika
 */
const generateLogin = (firstName, lastName) => {
  // Usuwamy polskie znaki, spacje i zamieniamy na małe litery
  const normalizedFirstName = removePolishChars(firstName).toLowerCase().replace(/\s+/g, '');
  const normalizedLastName = removePolishChars(lastName).toLowerCase().replace(/\s+/g, '');
  
  // Łączymy imię i nazwisko
  return `${normalizedFirstName}${normalizedLastName}`;
};

/**
 * Generuje hasło na podstawie imienia i nazwiska
 * @param {string} firstName - Imię użytkownika
 * @param {string} lastName - Nazwisko użytkownika
 * @returns {string} - Hasło użytkownika
 */
const generatePassword = (firstName, lastName) => {
  // Usuwamy polskie znaki, spacje i zamieniamy na małe litery
  const normalizedFirstName = removePolishChars(firstName).toLowerCase().replace(/\s+/g, '');
  const normalizedLastName = removePolishChars(lastName).toLowerCase().replace(/\s+/g, '');
  
  // Łączymy imię i nazwisko + "123"
  return `${normalizedFirstName}${normalizedLastName}123`;
};

module.exports = {
  removePolishChars,
  generateLogin,
  generatePassword
};