import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Phone, Mail, Scissors } from 'lucide-react'
import { API_URL } from '../config'

const GuestAppointmentSchedule = ({ selectedDate, selectedTime }) => {
  const [availableSlots, setAvailableSlots] = useState([])
  const [contactInfo, setContactInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlotsForDate(selectedDate)
      fetchContactInfo()
    }
  }, [selectedDate])
  
  // Pobierz listę usług przy pierwszym renderowaniu
  useEffect(() => {
    fetchServices()
  }, [])
  
  // Funkcja do pobierania usług
  const fetchServices = async () => {
    setLoadingServices(true)
    try {
      const response = await fetch(`${API_URL}/api/services`)
      
      if (response.status === 401) {
        console.log('Endpoint wymaga autoryzacji lub nie istnieje, używamy domyślnych danych')
        // Ustawiamy domyślne usługi
        const defaultServices = [
          { name: 'Manicure klasyczny', price: 80.00 },
          { name: 'Manicure hybrydowy', price: 120.00 },
          { name: 'Pedicure klasyczny', price: 100.00 },
          { name: 'Oczyszczanie twarzy', price: 150.00 },
          { name: 'Peeling chemiczny', price: 200.00 },
          { name: 'Laminacja brwi', price: 80.00 },
          { name: 'Mezoterapia igłowa', price: 300.00 }
        ]
        setServices(defaultServices)
        return
      }
      
      const data = await response.json()
      
      // Sprawdzamy różne możliwe formaty odpowiedzi
      let servicesList = []
      if (data.success && Array.isArray(data.services)) {
        servicesList = data.services
      } else if (Array.isArray(data.services)) {
        servicesList = data.services
      } else if (Array.isArray(data)) {
        servicesList = data
      }
      
      setServices(servicesList)
    } catch (error) {
      console.error('Błąd pobierania usług:', error)
      // Ustawiamy domyślne usługi w przypadku błędu
      const defaultServices = [
        { name: 'Manicure klasyczny', price: 80.00 },
        { name: 'Manicure hybrydowy', price: 120.00 },
        { name: 'Pedicure klasyczny', price: 100.00 },
        { name: 'Oczyszczanie twarzy', price: 150.00 },
        { name: 'Peeling chemiczny', price: 200.00 },
        { name: 'Laminacja brwi', price: 80.00 },
        { name: 'Mezoterapia igłowa', price: 300.00 }
      ]
      setServices(defaultServices)
    } finally {
      setLoadingServices(false)
    }
  }

  const fetchAvailableSlotsForDate = async (date) => {
    setIsLoading(true)
    try {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // Używamy standardowego endpointu bez tokena autoryzacji
      const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`)
      
      // Jeśli odpowiedź jest 401 Unauthorized, to znaczy że endpoint wymaga autoryzacji
      if (response.status === 401) {
        console.log('Endpoint wymaga autoryzacji, używamy domyślnych danych');
        // Ustawiamy domyślne godziny
        const defaultSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        console.log(`Domyślne terminy dla ${dateStr}:`, defaultSlots);
        setAvailableSlots(defaultSlots);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json()
      
      // Sprawdzamy różne możliwe formaty odpowiedzi
      let slots = [];
      if (data.success && Array.isArray(data.slots)) {
        slots = data.slots;
      } else if (Array.isArray(data.slots)) {
        slots = data.slots;
      } else if (Array.isArray(data)) {
        slots = data;
      }
      
      console.log(`Dostępne terminy dla ${dateStr}:`, slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Błąd pobierania dostępnych terminów:', error)
      // Ustawiamy domyślne godziny
      const defaultSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      console.log(`Domyślne terminy po błędzie dla ${date.toISOString().split('T')[0]}:`, defaultSlots);
      setAvailableSlots(defaultSlots);
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contact-info`)
      const data = await response.json()
      if (data.success) {
        setContactInfo(data.contactInfo)
      }
    } catch (error) {
      console.error('Błąd pobierania informacji kontaktowych:', error)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Wybierz datę z kalendarza, aby zobaczyć dostępne terminy</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">
          {formatDate(selectedDate)}
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : availableSlots && availableSlots.length > 0 ? (
          <>
            <p className="text-gray-600 mb-2">
              Dostępne terminy:
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {availableSlots.map((slot) => (
                <div
                  key={slot}
                  className="bg-green-100 text-green-800 rounded-lg p-2 text-center"
                >
                  <Clock className="w-4 h-4 inline-block mr-1" />
                  {slot}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 py-2 text-center">
            Brak dostępnych terminów na wybrany dzień
          </p>
        )}
      </div>
      
      {/* Sekcja z usługami */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <h3 className="font-semibold text-green-800 mb-2 flex items-center">
          <Scissors className="w-4 h-4 mr-2" />
          Nasza oferta
        </h3>
        
        {loadingServices ? (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {services.map((service, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b border-green-100 last:border-0">
                <span className="text-sm text-green-800">{service.name}</span>
                <span className="text-sm font-semibold text-green-800">{typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : service.price}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-700 py-1">Brak dostępnych usług</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h3 className="font-semibold text-blue-800 mb-2">Rezerwacja telefoniczna</h3>
        <p className="text-blue-700 mb-2">
          Aby zarezerwować wizytę, prosimy o kontakt telefoniczny.
        </p>
        
        {contactInfo && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-primary" />
              <a href={`tel:${contactInfo.phone}`} className="text-primary hover:underline">
                {contactInfo.phone}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <a href={`mailto:${contactInfo.email}`} className="text-gray-700 hover:underline">
                {contactInfo.email}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            // Zamknij modal rezerwacji
            window.history.pushState({}, '', '/');
            // Przekieruj do strony głównej i otwórz modal logowania
            window.location.href = '/#login';
          }}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
        >
          Zaloguj się
        </button>
        <button
          onClick={() => {
            // Zamknij modal rezerwacji
            window.history.pushState({}, '', '/');
            // Przekieruj do strony głównej i otwórz modal rejestracji
            window.location.href = '/#register';
          }}
          className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Zarejestruj się
        </button>
      </div>
    </div>
  )
}

export default GuestAppointmentSchedule