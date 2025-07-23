// Moduł do sprawdzania statusu dat
const getDateStatus = async (db, dbType, date) => {
  try {
    // Sprawdź dostępne sloty (wolne terminy)
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
    
    // Sprawdź zajęte wizyty
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
    
    // Określ status daty według nowych wymagań:
    // - Jeśli wolnych terminów > 0 i wizyt = 0 -> zielony
    // - Jeśli wolnych terminów > 0 i wizyt > 0 -> czerwono-zielony
    // - Jeśli wolnych terminów = 0 i wizyt > 0 -> czerwony
    // - Jeśli wolnych terminów = 0 i wizyt = 0 -> biały (brak koloru)
    
    let status = 'none'; // brak terminów i wizyt - biały
    
    if (availableCount > 0 && bookedCount === 0) {
      status = 'available'; // wolne terminy, brak wizyt - zielony
    } else if (availableCount > 0 && bookedCount > 0) {
      status = 'mixed'; // wolne terminy i wizyty - czerwono-zielony
    } else if (availableCount === 0 && bookedCount > 0) {
      status = 'booked'; // brak wolnych terminów, są wizyty - czerwony
    }
    
    console.log(`Status daty ${date}: ${status} (wolne: ${availableCount}, zajęte: ${bookedCount})`);
    
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