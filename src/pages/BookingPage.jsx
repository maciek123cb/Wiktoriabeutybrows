import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookingModal from '../components/BookingModal'
import Calendar from '../components/Calendar'

const BookingPage = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }
  
  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setShowModal(true)
  }
  
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
              
              {/* Informacje */}
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
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Wybrana data: {selectedDate.toLocaleDateString('pl-PL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <button 
                      onClick={() => handleTimeSelect("10:00")}
                      className="mt-4 w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Sprawdź dostępne terminy
                    </button>
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
          selectedTime={selectedTime || "10:00"}
          onSuccess={() => navigate('/')}
        />
      )}
    </div>
  )
}

export default BookingPage