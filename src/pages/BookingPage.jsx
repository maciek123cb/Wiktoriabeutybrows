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
  
  // Pobierz dostępne daty przy ładowaniu strony
  useEffect(() => {
    // Ustaw domyślną datę (dzisiaj)
    const today = new Date()
    setSelectedDate(today)
    fetchAvailableSlots(today)
  }, [])
  
  // Funkcja fetchAvailableDates nie jest już potrzebna, ponieważ wszystkie przyszłe daty są dostępne
  
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
                a następnie skontaktować się z nami telefonicznie w celu rezerwacji wizyty.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Kalendarz */}
              <div>
                <Calendar 
                  onDateSelect={handleDateSelect} 
                  isAdmin={false}
                />
              </div>
              
              {/* Dostępne terminy */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-3">Jak umówić wizytę?</h3>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal pl-4">
                    <li>Wybierz datę z kalendarza</li>
                    <li>Sprawdź dostępne godziny</li>
                    <li>Wybierz dogodną godzinę</li>
                    <li>Skontaktuj się telefonicznie w celu rezerwacji</li>
                  </ol>
                </div>
                
                {!localStorage.getItem('authToken') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <h3 className="font-semibold text-amber-800">Rezerwacja telefoniczna</h3>
                    </div>
                    <p className="text-amber-700 text-sm mb-3">
                      Rezerwacja wizyt odbywa się tylko telefonicznie.
                      Prosimy o kontakt pod numerem telefonu.
                    </p>
                    <div className="flex items-center space-x-3 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href="tel:532-128-227" className="text-amber-800 hover:underline">532-128-227</a>
                    </div>
                  </div>
                )}
                
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
                          {availableSlots.map((time) => {
                            const isLoggedIn = localStorage.getItem('authToken');
                            return (
                              <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={`p-2 border rounded-lg text-center ${isLoggedIn 
                                  ? 'border-gray-300 hover:bg-primary/10 hover:border-primary' 
                                  : 'border-gray-300 hover:bg-gray-100'}`}
                              >
                                {time}
                              </button>
                            );
                          })}
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