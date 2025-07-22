// Moduł do sprawdzania statusu dat
const getDateStatus = async (db, dbType, date) => {
  try {
    // Sprawdź dostępne sloty
    let availableSlots;
    if (dbType === 'postgres') {
      [availableSlots] = await db.execute(
        "SELECT time FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1",
        [date]
      );
    } else {
      [availableSlots] = await db.execute(
        'SELECT time FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ?',
        [date]
      );
    }
    
    // Sprawdź zajęte sloty
    let bookedSlots;
    if (dbType === 'postgres') {
      [bookedSlots] = await db.execute(
        "SELECT time FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND status != 'cancelled'",
        [date]
      );
    } else {
      [bookedSlots] = await db.execute(
        'SELECT time FROM appointments WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND status != "cancelled"',
        [date]
      );
    }
    
    const availableCount = availableSlots?.length || 0;
    const bookedCount = bookedSlots?.length || 0;
    
    // Określ status daty
    let status = 'none'; // brak terminów
    
    if (availableCount > 0 && bookedCount === 0) {
      status = 'available'; // wszystkie terminy dostępne
    } else if (availableCount > 0 && bookedCount > 0) {
      status = 'mixed'; // część terminów dostępna, część zajęta
    } else if (availableCount === 0 && bookedCount > 0) {
      status = 'booked'; // wszystkie terminy zajęte
    }
    
    return {
      status,
      availableCount,
      bookedCount,
      totalCount: availableCount + bookedCount
    };
  } catch (error) {
    console.error(`Błąd sprawdzania statusu daty ${date}:`, error);
    return { status: 'error', availableCount: 0, bookedCount: 0, totalCount: 0 };
  }
};

module.exports = getDateStatus;