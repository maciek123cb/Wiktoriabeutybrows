// Funkcja do poprawy pobierania usług dla wizyt
function fixAppointmentServices(appointment, dbType, db) {
  return new Promise(async (resolve, reject) => {
    try {
      // Sprawdzamy czy tabela appointment_services istnieje
      let tableExists = false;
      try {
        if (dbType === 'postgres') {
          const [result] = await db.execute(
            "SELECT to_regclass('public.appointment_services') IS NOT NULL as exists"
          );
          tableExists = result[0].exists;
        } else {
          const [result] = await db.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_services'"
          );
          tableExists = result[0].count > 0;
        }
      } catch (tableError) {
        console.error('Błąd sprawdzania istnienia tabeli appointment_services:', tableError);
        tableExists = false;
      }
      
      if (tableExists) {
        try {
          let services;
          if (dbType === 'postgres') {
            // Poprawka: Konwertujemy ID na liczbę i używamy jej bezpośrednio
            const appointmentId = parseInt(appointment.id);
            console.log(`Pobieranie usług dla wizyty ID ${appointmentId}`);
            const [result] = await db.execute(
              'SELECT service_id, service_name, price, duration FROM appointment_services WHERE appointment_id = $1',
              [appointmentId]
            );
            services = result;
          } else {
            const [result] = await db.execute(
              'SELECT service_id, service_name, price, duration FROM appointment_services WHERE appointment_id = ?',
              [appointment.id]
            );
            services = result;
          }
          appointment.services = services;
          resolve(services);
        } catch (servicesError) {
          console.error(`Błąd pobierania usług dla wizyty ID ${appointment.id}:`, servicesError);
          appointment.services = [];
          resolve([]);
        }
      } else {
        appointment.services = [];
        resolve([]);
      }
    } catch (error) {
      console.error(`Błąd pobierania usług dla wizyty ID ${appointment.id}:`, error);
      appointment.services = [];
      resolve([]);
    }
  });
}

module.exports = fixAppointmentServices;