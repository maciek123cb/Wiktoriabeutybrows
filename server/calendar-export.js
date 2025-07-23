// Moduł do eksportu wizyt do kalendarza
const ical = require('ical-generator');

/**
 * Generuje plik iCalendar dla wizyty
 * @param {Object} appointment - Dane wizyty
 * @param {Object} user - Dane użytkownika
 * @param {Object} options - Opcje dodatkowe
 * @returns {String} - Zawartość pliku iCalendar
 */
const generateCalendarEvent = (appointment, user, options = {}) => {
  const calendar = ical({ name: 'Wiktoria Beauty Brows - Wizyty' });
  
  // Parsowanie daty i czasu
  const [hours, minutes] = appointment.time.split(':').map(Number);
  const startDate = new Date(appointment.date);
  startDate.setHours(hours, minutes, 0, 0);
  
  // Obliczanie daty końcowej na podstawie czasu trwania
  const endDate = new Date(startDate);
  const durationMinutes = appointment.total_duration || 60; // Domyślnie 60 minut, jeśli nie podano
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  
  // Tworzenie tytułu i opisu
  const title = `Wizyta w Wiktoria Beauty Brows`;
  
  // Przygotowanie opisu z listą usług
  let description = `Wizyta w Wiktoria Beauty Brows\n\n`;
  
  if (appointment.services && appointment.services.length > 0) {
    description += 'Usługi:\n';
    appointment.services.forEach(service => {
      description += `- ${service.service_name}\n`;
    });
  }
  
  if (appointment.notes) {
    description += `\nUwagi: ${appointment.notes}\n`;
  }
  
  description += `\nStatus: ${getStatusText(appointment.status)}`;
  
  // Dodawanie wydarzenia do kalendarza
  calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: title,
    description: description,
    location: options.location || 'Wiktoria Beauty Brows',
    url: options.url || 'https://wiktoriabeutybrows.pl',
    organizer: {
      name: 'Wiktoria Beauty Brows',
      email: 'kontakt@wiktoriabeutybrows.pl'
    },
    status: appointment.status === 'confirmed' ? 'confirmed' : 'tentative'
  });
  
  return calendar.toString();
};

/**
 * Konwertuje status wizyty na tekst
 * @param {String} status - Status wizyty
 * @returns {String} - Tekst statusu
 */
const getStatusText = (status) => {
  switch (status) {
    case 'confirmed':
      return 'Potwierdzona';
    case 'cancelled':
      return 'Anulowana';
    default:
      return 'Oczekuje na potwierdzenie';
  }
};

module.exports = {
  generateCalendarEvent
};