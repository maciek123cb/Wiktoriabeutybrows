import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MessageSquare, AlertCircle, X } from 'lucide-react'
import Calendar from './Calendar'
import { API_URL } from '../config'

const BookingForm = ({ user, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pobierz dostępne sloty dla wybranej daty
  const fetchAvailableSlots = async (date) => {
    if (!date) {
      console.warn('Próba pobrania slotów bez podania daty');
      setAvailableSlots([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Formatuj datę w formacie YYYY-MM-DD
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Nieprawidłowa data:', date);
        setError('Nieprawidłowa data');
        setAvailableSlots([]);
        return;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('Sformatowana data:', dateStr);
      
      console.log('Pobieranie slotów dla daty:', dateStr);
      console.log('URL zapytania:', `${API_URL}/api/available-slots/${dateStr}`);
      
      // Dodajemy timeout, aby uniknąć problemów z CORS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sekund timeout
      
      try {
        // Pobierz token autoryzacji, jeśli użytkownik jest zalogowany
        const token = localStorage.getItem('authToken');
        
        console.log('Wysyłam zapytanie o dostępne sloty dla daty:', dateStr);
        console.log('Token autoryzacji:', token ? 'Dostępny' : 'Brak');
        
        const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`, {
          signal: controller.signal,
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log('Status odpowiedzi:', response.status);
        console.log('Headers odpowiedzi:', [...response.headers.entries()]);
        
        if (!response.ok) {
          console.error(`Błąd HTTP: ${response.status}`);
          setAvailableSlots([]);
          setError(`Błąd serwera: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        
        console.log('Odpowiedź z serwera dla slotów:', data);
        console.log('Dostępne sloty (typ):', typeof data.slots, 'czy tablica:', Array.isArray(data.slots));
        
        // Zawsze używaj tablicy, nawet jeśli data.slots jest undefined lub null
        const safeSlots = Array.isArray(data.slots) ? data.slots : [];
        console.log('Bezpieczne sloty:', safeSlots);
        
        setAvailableSlots(safeSlots);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Timeout przy pobieraniu slotów');
          setError('Przekroczono czas oczekiwania na odpowiedź serwera');
        } else {
          console.error('Błąd fetch:', fetchError);
          setError('Nie można połączyć się z serwerem');
        }
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Błąd pobierania slotów:', error);
      setError('Nie można pobrać dostępnych terminów. Spróbuj ponownie później.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }

  // Obsługa wyboru daty
  const handleDateSelect = (date) => {
    console.log('Wybrano datę:', date);
    
    // Formatuj datę w formacie YYYY-MM-DD dla logowania
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('Sformatowana data:', dateStr);
    
    setSelectedDate(date);
    setSelectedTime('');
    fetchAvailableSlots(date);
  }

  // Obsługa wysyłania formularza
  const handleSubmit = async () => {
    setError('')

    if (!selectedDate || !selectedTime) {
      setError('Wybierz datę i godzinę wizyty')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/book-appointment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
          time: selectedTime,
          notes
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess(data.message)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Umów wizytę</h2>
              <p className="text-gray-600">
                Witaj {user.firstName}! Wybierz termin swojej wizyty.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Kalendarz */}
            <div>
              <Calendar onDateSelect={handleDateSelect} isAdmin={false} />
            </div>

            {/* Panel godzin i notatek */}
            <div className="space-y-6">
              {selectedDate && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Wybrana data: {selectedDate.toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
              )}

              {/* Wybór godziny */}
              {selectedDate && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <Clock className="inline w-4 h-4 mr-2" />
                      Dostępne godziny
                    </label>
                    <button 
                      type="button"
                      onClick={() => fetchAvailableSlots(selectedDate)}
                      className="text-primary hover:text-primary/80 p-1"
                      title="Odśwież dostępne terminy"
                    >
                      ↻
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : Array.isArray(availableSlots) && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((time, index) => (
                        <motion.button
                          key={time || index}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-lg border transition-colors ${
                            selectedTime === time
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-gray-300 hover:border-primary hover:bg-primary/5'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Brak dostępnych terminów w wybranym dniu
                      </p>
                      <button 
                        onClick={() => fetchAvailableSlots(selectedDate)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Odśwież terminy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notatki */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-2" />
                  Dodatkowe informacje (opcjonalne)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Opisz swoje potrzeby lub preferencje..."
                />
              </div>

              {/* Przyciski */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedDate || !selectedTime}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Rezerwuję...' : 'Umów wizytę'}
                </button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Informacja:</strong> Twoja wizyta zostanie zgłoszona i będzie oczekiwać na potwierdzenie przez salon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingForm