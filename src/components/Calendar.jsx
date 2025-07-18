import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { API_URL } from '../config'

const Calendar = ({ onDateSelect, isAdmin = false, datesWithSlots = [], availableDates: propAvailableDates = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableDates, setAvailableDates] = useState([])
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
    if (!isAdmin && !propAvailableDates?.length) {
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
      
      if (token && !isAdmin) {
        // Dla zalogowanych użytkowników pobieramy dostępne daty z autoryzacją
        response = await fetch(`${API_URL}/api/available-dates`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (!isAdmin) {
        // Dla niezalogowanych użytkowników pobieramy dostępne daty bez autoryzacji
        response = await fetch(`${API_URL}/api/available-dates-public`);
      } else {
        // Dla admina nie pobieramy dostępnych dat
        setIsLoading(false);
        return;
      }
      
      const data = await response.json().catch(e => ({ dates: [] }));
      
      // Zawsze używaj tablicy, nawet jeśli data.dates jest undefined lub null
      const safeDates = Array.isArray(data.dates) ? data.dates : [];
      
      console.log('Pobrane dostępne daty:', safeDates);
      setAvailableDates(safeDates);
      
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
    if (!date || !isAdmin) return false
    
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
    return datesWithSlots.includes(dateStr)
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
    if (!isAdmin) {
      setTimeout(() => fetchAvailableDates(), 100);
    }
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

          const isAvailable = isDateAvailable(date)
          const isPast = isDateInPast(date)
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
          const isToday = date.toDateString() === new Date().toDateString()
          const dateHasSlots = hasSlots(date)

          let buttonClass = "w-full h-10 rounded-lg text-sm font-medium transition-all duration-200 "
          
          if (isSelected) {
            buttonClass += "bg-primary text-white shadow-md "
          } else if (isToday) {
            buttonClass += "ring-2 ring-primary/30 "
            if (isAdmin) {
              if (dateHasSlots) {
                buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 "
              } else {
                buttonClass += "hover:bg-primary/10 text-gray-700 "
              }
            } else if (isAvailable && !isPast) {
              buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer "
            } else if (isPast) {
              buttonClass += "text-gray-300 cursor-not-allowed "
            } else {
              buttonClass += "text-gray-400 cursor-not-allowed "
            }
          } else if (isAdmin) {
            if (dateHasSlots) {
              buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 "
            } else {
              buttonClass += "hover:bg-primary/10 text-gray-700 "
            }
          } else if (isAvailable && !isPast) {
            buttonClass += "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer "
          } else if (isPast) {
            buttonClass += "text-gray-300 cursor-not-allowed "
          } else {
            buttonClass += "bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer "
          }

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
              <span className="text-gray-600">Z terminami</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span className="text-gray-600">Bez terminów</span>
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