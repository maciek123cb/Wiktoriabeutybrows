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
  // Używamy funkcji generatePassword z account-utils.js
  const password = generatePassword(user.first_name, user.last_name);
  
  console.log(`Wygenerowano hasło dla ${user.first_name} ${user.last_name}:`, password);
  
  return {
    login,
    password
  };
};

module.exports = generateUserCredentials;