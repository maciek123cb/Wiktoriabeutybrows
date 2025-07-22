import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { API_URL } from '../config'
import AppointmentSchedule from './AppointmentSchedule'
import Calendar from './Calendar'

const BookingModal = ({ isOpen, onClose, selectedDate, selectedTime, onSuccess }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate))
  const [currentTime, setCurrentTime] = useState(selectedTime)
  const [availableDates, setAvailableDates] = useState([])

  // Aktualizuj datę i czas, gdy zmienią się propsy
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate))
    }
    if (selectedTime) {
      setCurrentTime(selectedTime)
    }
  }, [selectedDate, selectedTime])
  
  // Pobierz dostępne daty przy pierwszym renderowaniu
  useEffect(() => {
    fetchAvailableDates()
    // Odświeżaj co 30 sekund
    const interval = setInterval(fetchAvailableDates, 30000)
    return () => clearInterval(interval)
  }, [])
  
  // Pobierz dostępne daty z API
  const fetchAvailableDates = async () => {
    try {
      // Używamy standardowego endpointu bez tokena autoryzacji
      const response = await fetch(`${API_URL}/api/available-dates`)
      
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
      
      const data = await response.json()
      
      // Sprawdzamy różne możliwe formaty odpowiedzi
      let dates = [];
      if (data.success && Array.isArray(data.dates)) {
        dates = data.dates;
      } else if (Array.isArray(data.dates)) {
        dates = data.dates;
      } else if (Array.isArray(data)) {
        dates = data;
      }
      
      console.log('BookingModal - pobrane dostępne daty:', dates);
      setAvailableDates(dates);
    } catch (error) {
      console.error('Błąd pobierania dostępnych dat:', error)
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
      console.log('Domyślne dostępne daty po błędzie:', dates);
      setAvailableDates(dates);
    }
  }
  
  // Funkcja obsługująca wybór daty z kalendarza
  const handleDateSelect = (date) => {
    setCurrentDate(date)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Terminarz wizyt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Kalendarz */}
            <div>
              <Calendar 
                onDateSelect={handleDateSelect}
                isAdmin={false}
                availableDates={availableDates.length > 0 ? availableDates : []}
              />
            </div>
            
            {/* Dostępne terminy i informacje */}
            <div>
              <AppointmentSchedule 
                selectedDate={currentDate} 
                selectedTime={currentTime} 
              />
            </div>
          </div>
          
          {/* Przycisk zamknięcia */}
          <div className="mt-6 flex space-x-3 sticky bottom-0 bg-white pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingModal