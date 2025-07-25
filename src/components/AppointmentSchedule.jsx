import { useState, useEffect } from 'react'
import { Calendar, Clock, Phone, Mail, Instagram } from 'lucide-react'
import { API_URL } from '../config'

const AppointmentSchedule = ({ selectedDate, selectedTime }) => {
  const [availableSlots, setAvailableSlots] = useState([])
  const [contactInfo, setContactInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlotsForDate(selectedDate)
      fetchContactInfo()
    }
  }, [selectedDate])

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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          Rezerwacja telefoniczna
        </h3>
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
              <Instagram className="w-5 h-5 text-pink-500" />
              <a href="https://www.instagram.com/wiktoriabeauty_brows/" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                Instagram
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentSchedule