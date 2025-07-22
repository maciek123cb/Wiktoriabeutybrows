import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { API_URL } from '../config'

const Calendar = ({ onDateSelect, isAdmin = false, datesWithSlots = [], availableDates: propAvailableDates = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableDates, setAvailableDates] = useState([])
  const [dateStatuses, setDateStatuses] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Użyj dat przekazanych jako prop, jeśli są dostępne
  useEffect(() => {
    console.log('Calendar - propAvailableDates:', propAvailableDates);
    if (propAvailableDates && propAvailableDates.length > 0) {
      console.log('Calendar - ustawiam dostępne daty z props:', propAvailableDates);
      setAvailableDates(propAvailableDates);
    }
  }, [propAvailableDates]);

  useEffect(() => {
    // Pobieramy dostępne daty dla wszystkich użytkowników (zalogowanych i niezalogowanych)
    if (!propAvailableDates?.length) {
      fetchAvailableDates();
      // Odświeżaj co 30 sekund
      const interval = setInterval(fetchAvailableDates, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, propAvailableDates])

  const fetchAvailableDates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pobierz token autoryzacji
      const token = localStorage.getItem('authToken');
      
      // Jeśli mamy przekazane daty z props, używamy ich
      if (propAvailableDates && propAvailableDates.length > 0) {
        setAvailableDates(propAvailableDates);
        setIsLoading(false);
        return;
      }
      
      let response;
      
      if (token) {
        // Dla zalogowanych użytkowników pobieramy dostępne daty z autoryzacją
        response = await fetch(`${API_URL}/api/available-dates`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Dla niezalogowanych użytkowników pobieramy dostępne daty bez autoryzacji
        response = await fetch(`${API_URL}/api/available-dates`);
      }
      
      // Jeśli odpowiedź jest 401 Unauthorized, to znaczy że endpoint wymaga autoryzacji
      if (response.status === 401) {
        console.log('Endpoint wymaga autoryzacji, używamy domyślnych danych');
        // Ustawiamy domyślne daty (dzisiaj i kilka następnych dni)
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }
        console.log('Domyślne dostępne daty:', dates);
        setAvailableDates(dates);
        return;
      }
      
      const data = await response.json().catch(e => ({ dates: [], dateStatuses: {} }));
      
      // Zawsze używaj tablicy, nawet jeśli data.dates jest undefined lub null
      const safeDates = Array.isArray(data.dates) ? data.dates : [];
      const safeStatuses = data.dateStatuses || {};
      
      console.log('Pobrane dostępne daty:', safeDates);
      console.log('Pobrane statusy dat:', safeStatuses);
      setAvailableDates(safeDates);
      setDateStatuses(safeStatuses);
      
      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Błąd pobierania dostępnych dat:', error);
      setError(error.message);
      // Ustawienie pustej tablicy w przypadku błędu
      setAvailableDates([]);
    } finally {
      setIsLoading(false);
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Dodaj puste dni na początku miesiąca
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Dodaj dni miesiąca
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getDateStatus = (date) => {
    if (!date) return { available: false, status: 'none' }
    
    // Formatuj datę w formacie YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Pobierz status daty
    const status = dateStatuses[dateStr];
    
    // Sprawdzamy, czy data jest w tablicy dostępnych dat
    const isAvailable = Array.isArray(availableDates) && availableDates.length > 0 && availableDates.includes(dateStr);
    
    // Dla admina, sprawdzamy czy data ma sloty
    if (isAdmin) {
      const hasSlot = hasSlots(date);
      
      // Jeśli data ma sloty, ale nie ma statusu, ustawiamy status na 'available'
      if (hasSlot) {
        if (!status) {
          return { 
            available: true, 
            status: 'available',
            availableCount: 1,
            bookedCount: 0,
            totalCount: 1
          };
        }
        
        // Jeśli mamy status, zwracamy go
        return { 
          available: true, 
          status: status.status || 'available',
          availableCount: status.availableCount || 0,
          bookedCount: status.bookedCount || 0,
          totalCount: status.totalCount || 0
        };
      }
    }
    
    // Jeśli nie mamy statusu, zwracamy domyślny
    if (!status) {
      return { 
        available: isAvailable, 
        status: 'none',
        availableCount: 0,
        bookedCount: 0,
        totalCount: 0
      };
    }
    
    // Zwracamy status
    return { 
      available: isAvailable, 
      status: status.status || 'none',
      availableCount: status.availableCount || 0,
      bookedCount: status.bookedCount || 0,
      totalCount: status.totalCount || 0
    };
  }
  
  const isDateAvailable = (date) => {
    if (!date) return false
    
    // W trybie admina wszystkie daty są dostępne
    if (isAdmin) return true;
    
    // Formatuj datę w formacie YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Sprawdzamy, czy data jest w tablicy dostępnych dat
    if (Array.isArray(availableDates) && availableDates.length > 0) {
      return availableDates.includes(dateStr);
    } else {
      // Jeśli nie ma dostępnych dat, to pokazujemy tylko dzisiejszą datę jako dostępną
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date.toDateString() === today.toDateString();
    }
  }

  const hasSlots = (date) => {
    if (!date) return false
    
    // Zabezpieczenie przed błędem, jeśli datesWithSlots nie jest tablicą
    if (!Array.isArray(datesWithSlots)) {
      console.warn('datesWithSlots nie jest tablicą:', datesWithSlots);
      return false;
    }
    
    // Formatuj datę w formacie YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Dla admina sprawdzamy, czy data jest w tablicy datesWithSlots
    if (isAdmin) {
      return datesWithSlots.includes(dateStr);
    }
    
    // Dla zwykłych użytkowników sprawdzamy, czy data jest w tablicy availableDates
    return Array.isArray(availableDates) && availableDates.includes(dateStr);
  }

  const isDateInPast = (date) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateClick = (date) => {
    if (!date) return
    
    // Dla wszystkich użytkowników (admin, zalogowani i niezalogowani) pozwalamy kliknąć na wszystkie przyszłe dni
    if (!isDateInPast(date)) {
      setSelectedDate(date)
      onDateSelect?.(date)
    }
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
    
    // Odśwież dostępne daty po zmianie miesiąca dla wszystkich użytkowników
    setTimeout(() => fetchAvailableDates(), 100);
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ]
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Kalendarz
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-lg min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isAdmin && (
            <button
              onClick={fetchAvailableDates}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-primary text-lg"
              title="Odśwież dostępne terminy"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Nagłówki dni tygodnia */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Dni miesiąca */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2 h-10"></div>
          }

          const dateStatus = getDateStatus(date)
          const isAvailable = isDateAvailable(date)
          const isPast = isDateInPast(date)
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
          const isToday = date.toDateString() === new Date().toDateString()
          const dateHasSlots = hasSlots(date)
          
          // Formatuj datę w formacie YYYY-MM-DD dla logowania
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          
          // Logowanie dla debugowania (tylko dla wybranych dat)
          if (date.getDate() === 1 || date.getDate() === 15) {
            console.log(`Renderowanie daty ${dateStr}:`, { 
              dateStatus, 
              isAvailable, 
              isPast, 
              isSelected, 
              isToday, 
              dateHasSlots 
            });
          }

          // Uproszczona logika kolorowania dat
          let buttonClass = "w-full h-10 rounded-lg text-sm font-medium transition-all duration-200 "
          
          // Najpierw sprawdzamy, czy data jest wybrana
          if (isSelected) {
            buttonClass += "bg-primary text-white shadow-md ";
            return (
              <motion.button
                key={index}
                onClick={() => handleDateClick(date)}
                className={buttonClass}
                disabled={isPast}
                whileHover={{ scale: !isPast ? 1.05 : 1 }}
                whileTap={{ scale: !isPast ? 0.95 : 1 }}
              >
                {date.getDate()}
              </motion.button>
            );
          }
          
          // Dodajemy obramowanie dla dzisiejszej daty
          if (isToday) {
            buttonClass += "ring-2 ring-primary/30 ";
          }
          
          // Dla dat w przeszłości
          if (isPast) {
            buttonClass += "text-gray-300 cursor-not-allowed ";
            return (
              <motion.button
                key={index}
                onClick={() => handleDateClick(date)}
                className={buttonClass}
                disabled={true}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 1 }}
              >
                {date.getDate()}
              </motion.button>
            );
          }
          
          // Dla admina, kolorujemy daty według statusu
          if (isAdmin) {
            // Sprawdzamy, czy data ma sloty
            if (dateHasSlots) {
              // Sprawdzamy status daty
              if (dateStatus.status === 'available') {
                buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 ";
              } else if (dateStatus.status === 'mixed') {
                buttonClass += "bg-gradient-to-r from-green-100 to-red-100 text-gray-800 hover:from-green-200 hover:to-red-200 ";
              } else if (dateStatus.status === 'booked') {
                buttonClass += "bg-red-100 text-red-800 hover:bg-red-200 ";
              } else {
                // Jeśli data ma sloty, ale nie ma statusu, kolorujemy na zielono
                buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 ";
              }
            } else {
              // Jeśli data nie ma slotów, zostawiamy białe tło
              buttonClass += "bg-white text-gray-700 hover:bg-gray-50 ";
            }
          } 
          // Dla zwykłych użytkowników
          else {
            if (isAvailable) {
              buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer ";
            } else {
              buttonClass += "bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer ";
            }
          }

          // Zwracamy przycisk z odpowiednią klasą
          return (
            <motion.button
              key={index}
              onClick={() => handleDateClick(date)}
              className={buttonClass}
              disabled={isPast}
              whileHover={{ scale: !isPast ? 1.05 : 1 }}
              whileTap={{ scale: !isPast ? 0.95 : 1 }}
            >
              {date.getDate()}
            </motion.button>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded border-2 border-primary/30"></div>
          <span className="text-gray-600">Dzisiaj</span>
        </div>
        {isAdmin ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span className="text-gray-600">Wszystkie terminy dostępne</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-100 to-red-100 rounded"></div>
              <span className="text-gray-600">Część terminów zajęta</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span className="text-gray-600">Wszystkie terminy zajęte</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
              <span className="text-gray-600">Brak terminów</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span className="text-gray-600">Dostępne</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Brak terminów</span>
            </div>
          </>
        )}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span className="text-gray-600">Wybrane</span>
        </div>
      </div>
    </div>
  )
}

export default Calendar