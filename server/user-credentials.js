// Moduł do generowania danych logowania dla użytkowników
const { generatePassword, removePolishChars } = require('./account-utils');

/**
 * Generuje dane logowania dla użytkownika
 * @param {Object} user - Obiekt użytkownika
 * @returns {Object} - Obiekt z danymi logowania
 */
const generateUserCredentials = (user) => {
  // Login to email użytkownika
  const login = user.email;
  
  // Generujemy hasło na podstawie imienia i nazwiska
  // Usuwamy polskie znaki i zamieniamy na małe litery
  const firstName = removePolishChars(user.first_name).toLowerCase();
  const lastName = removePolishChars(user.last_name).toLowerCase();
  const password = `${firstName}${lastName}123`;
  
  console.log(`Wygenerowano hasło dla ${user.first_name} ${user.last_name}:`, password);
  
  return {
    login,
    password
  };
};

module.exports = generateUserCredentials;