import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Phone, Mail } from 'lucide-react'
import { API_URL } from '../config'

const GuestAppointmentSchedule = ({ selectedDate, selectedTime }) => {
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
      
      const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`)
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Błąd pobierania dostępnych terminów:', error)
      setAvailableSlots([])
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">
          {formatDate(selectedDate)}
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : availableSlots.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Dostępne terminy na wybrany dzień:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
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
          <p className="text-gray-500 py-4 text-center">
            Brak dostępnych terminów na wybrany dzień
          </p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Rezerwacja telefoniczna</h3>
        <p className="text-blue-700 mb-4">
          Aby zarezerwować wizytę, prosimy o kontakt telefoniczny.
          Możesz również utworzyć konto, aby rezerwować wizyty online.
        </p>
        
        {contactInfo && (
          <div className="space-y-3">
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
          onClick={() => window.location.href = '/login'}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
        >
          Zaloguj się
        </button>
        <button
          onClick={() => window.location.href = '/register'}
          className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Zarejestruj się
        </button>
      </div>
    </div>
  )
}

export default GuestAppointmentSchedule