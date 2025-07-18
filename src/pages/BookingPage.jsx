import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookingModal from '../components/BookingModal'
import Calendar from '../components/Calendar'
import { API_URL } from '../config'

const BookingPage = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Pobierz dostępne sloty dla wybranej daty
  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Formatuj datę w formacie YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`);
      
      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (error) {
      console.error('Błąd pobierania slotów:', error);
      setError('Nie można pobrać dostępnych terminów');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };
  
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowModal(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container-custom mx-auto px-4 py-4">
          <a
            href="/"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Powrót do strony głównej</span>
          </a>
        </div>
      </header>

      <div className="container-custom mx-auto px-4 py-8">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Umów wizytę online
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Wybierz dogodny termin z kalendarza poniżej. Możesz sprawdzić dostępne terminy, 
                a następnie zarezerwować wizytę online lub skontaktować się z nami telefonicznie.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Kalendarz */}
              <div>
                <Calendar onDateSelect={handleDateSelect} isAdmin={false} />
              </div>
              
              {/* Dostępne terminy */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-3">Jak umówić wizytę?</h3>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal pl-4">
                    <li>Wybierz datę z kalendarza</li>
                    <li>Sprawdź dostępne godziny</li>
                    <li>Wybierz dogodną godzinę</li>
                    <li>Zaloguj się lub skontaktuj telefonicznie</li>
                  </ol>
                </div>
                
                {selectedDate && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                      {selectedDate.toLocaleDateString('pl-PL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <button 
                          onClick={() => fetchAvailableSlots(selectedDate)}
                          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          Dostępne godziny:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                          {availableSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => handleTimeSelect(time)}
                              className="p-2 border border-gray-300 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Brak dostępnych terminów w wybranym dniu</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Modal rezerwacji */}
      {showModal && selectedDate && (
        <BookingModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          selectedDate={selectedDate.toISOString().split('T')[0]}
          selectedTime={selectedTime}
          onSuccess={() => navigate('/')}
        />
      )}
    </div>
  )
}

export default BookingPage

export default BookingPage