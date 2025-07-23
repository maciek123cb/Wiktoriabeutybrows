// Moduł do generowania danych logowania dla użytkowników
const { generatePassword } = require('./account-utils');

/**
 * Generuje dane logowania dla użytkownika
 * @param {Object} user - Obiekt użytkownika
 * @returns {Object} - Obiekt z danymi logowania
 */
const generateUserCredentials = (user) => {
  // Login to email użytkownika
  const login = user.email;
  
  // Generujemy hasło na podstawie imienia i nazwiska
  const password = generatePassword(user.first_name, user.last_name);
  
  return {
    login,
    password
  };
};

module.exports = generateUserCredentials;