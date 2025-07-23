// Moduł do sprawdzania statusu dat
const getDateStatus = async (db, dbType, date) => {
  try {
    // Sprawdź wszystkie dostępne sloty (terminy w tabeli available_slots)
    let allSlots;
    if (dbType === 'postgres') {
      [allSlots] = await db.execute(
        "SELECT time FROM available_slots WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1",
        [date]
      );
    } else {
      [allSlots] = await db.execute(
        'SELECT time FROM available_slots WHERE DATE_FORMAT(date, "%Y-%m-%d") = ?',
        [date]
      );
    }
    
    // Sprawdź zajęte wizyty
    let bookedAppointments;
    if (dbType === 'postgres') {
      [bookedAppointments] = await db.execute(
        "SELECT time FROM appointments WHERE TO_CHAR(date, 'YYYY-MM-DD') = $1 AND status != 'cancelled'",
        [date]
      );
    } else {
      [bookedAppointments] = await db.execute(
        'SELECT time FROM appointments WHERE DATE_FORMAT(date, "%Y-%m-%d") = ? AND status != "cancelled"',
        [date]
      );
    }
    
    // Tworzymy tablice czasów
    const allTimes = allSlots.map(slot => slot.time);
    const bookedTimes = bookedAppointments.map(apt => apt.time);
    
    // Obliczamy wolne terminy (te, które są w allTimes, ale nie ma ich w bookedTimes)
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));
    
    // Liczba wolnych terminów i zajętych wizyt
    const availableCount = availableTimes.length;
    const bookedCount = bookedTimes.length;
    
    console.log(`Data ${date}: wszystkie terminy=${allTimes.length}, wolne=${availableCount}, zajęte=${bookedCount}`);
    console.log(`Wolne terminy:`, availableTimes);
    console.log(`Zajęte terminy:`, bookedTimes);
    
    // Określ status daty według nowych wymagań:
    // - Jeśli wolnych terminów > 0 i wizyt = 0 -> zielony
    // - Jeśli wolnych terminów > 0 i wizyt > 0 -> czerwono-zielony
    // - Jeśli wolnych terminów = 0 i wizyt > 0 -> czerwony
    // - Jeśli wolnych terminów = 0 i wizyt = 0 -> biały (brak koloru)
    
    let status = 'none'; // brak terminów i wizyt - biały
    
    if (allTimes.length === 0) {
      // Brak terminów w ogóle
      status = 'none';
    } else if (availableCount > 0 && bookedCount === 0) {
      // Są wolne terminy, brak wizyt
      status = 'available';
    } else if (availableCount > 0 && bookedCount > 0) {
      // Są wolne terminy i wizyty
      status = 'mixed';
    } else if (availableCount === 0 && bookedCount > 0) {
      // Brak wolnych terminów, są wizyty (wszystkie terminy zajęte)
      status = 'booked';
    }
    
    console.log(`Status daty ${date}: ${status} (wszystkie: ${allTimes.length}, wolne: ${availableCount}, zajęte: ${bookedCount})`);
    
    return {
      status,
      availableCount,
      bookedCount,
      totalCount: allTimes.length,
      allTimes,
      availableTimes,
      bookedTimes
    };
  } catch (error) {
    console.error(`Błąd sprawdzania statusu daty ${date}:`, error);
    return { status: 'error', availableCount: 0, bookedCount: 0, totalCount: 0 };
  }
};

module.exports = getDateStatus;