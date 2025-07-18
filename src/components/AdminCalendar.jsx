import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, Trash2, Calendar as CalendarIcon, UserPlus } from 'lucide-react'
import Calendar from './Calendar'
import ManualAppointmentForm from './ManualAppointmentForm'
import { API_URL } from '../config'

const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [newTime, setNewTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [datesWithSlots, setDatesWithSlots] = useState([])
  const [showManualForm, setShowManualForm] = useState(false)

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    fetchSlotsForDate(date)
  }

  const fetchDatesWithSlots = async () => {
    try {
      const response = await fetch(`${API_URL}/api/available-dates`)
      const data = await response.json()
      setDatesWithSlots(data.dates || [])
    } catch (error) {
      console.error('Błąd pobierania dat z terminami:', error)
    }
  }

  useEffect(() => {
    fetchDatesWithSlots()
  }, [])

  const fetchSlotsForDate = async (date) => {
    try {
      // Formatuj datę w formacie YYYY-MM-DD
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/slots/${dateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setAvailableSlots(data.available || [])
      setBookedSlots(data.booked || [])
    } catch (error) {
      console.error('Błąd pobierania slotów:', error)
    }
  }

  const addTimeSlot = async () => {
    if (!selectedDate || !newTime) return

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      // Formatuj datę w formacie YYYY-MM-DD
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      console.log('Dodaję slot:', { date: dateStr, time: newTime })
      
      const response = await fetch(`${API_URL}/api/admin/slots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: dateStr,
          time: newTime
        })
      })

      if (response.ok) {
        fetchSlotsForDate(selectedDate)
        setNewTime('')
        fetchDatesWithSlots()
      } else {
        console.error('Błąd HTTP:', response.status)
      }
    } catch (error) {
      console.error('Błąd dodawania slotu:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeTimeSlot = async (time) => {
    if (!selectedDate) return

    try {
      const token = localStorage.getItem('authToken')
      // Formatuj datę w formacie YYYY-MM-DD
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const response = await fetch(`${API_URL}/api/admin/slots/${dateStr}/${time}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchSlotsForDate(selectedDate)
        fetchDatesWithSlots()
      }
    } catch (error) {
      console.error('Błąd usuwania slotu:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Kalendarz */}
        <div>
          <Calendar 
            onDateSelect={handleDateSelect} 
            isAdmin={true} 
            datesWithSlots={datesWithSlots}
          />
        </div>

        {/* Panel zarządzania terminami */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Zarządzanie terminami
          </h3>

          {selectedDate ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">
                  Wybrana data: {selectedDate.toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>
              </div>

              {/* Dodawanie nowego terminu */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Dodaj nowy termin
                </label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={addTimeSlot}
                    disabled={loading || !newTime}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj</span>
                  </button>
                </div>
              </div>

              {/* Przycisk dodawania wizyty ręcznie */}
              {availableSlots.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Dodaj wizytę ręcznie</span>
                  </button>
                </div>
              )}

              {/* Lista dostępnych terminów */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-700 mb-3">
                    Dostępne terminy ({availableSlots.length})
                  </h5>
                  {availableSlots.length > 0 ? (
                    <div className="space-y-2">
                      {availableSlots.map(time => (
                        <motion.div
                          key={time}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span className="font-medium text-green-800">{time}</span>
                          <button
                            onClick={() => removeTimeSlot(time)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Brak dostępnych terminów
                    </p>
                  )}
                </div>
                
                <div>
                  <h5 className="font-medium text-red-700 mb-3">
                    Terminy zajęte ({bookedSlots.length})
                  </h5>
                  {bookedSlots.length > 0 ? (
                    <div className="space-y-2">
                      {bookedSlots.map(slot => (
                        <motion.div
                          key={slot.time}
                          className="p-3 bg-red-50 rounded-lg"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="font-medium text-red-800">{slot.time}</div>
                          <div className="text-sm text-red-600">
                            {slot.first_name} {slot.last_name}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Brak zajętych terminów
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Wybierz datę z kalendarza, aby zarządzać terminami
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal dodawania wizyty ręcznie */}
      {showManualForm && (
        <ManualAppointmentForm
          onClose={() => setShowManualForm(false)}
          onSuccess={(message) => {
            alert(message)
            setShowManualForm(false)
            fetchSlotsForDate(selectedDate)
          }}
          selectedDate={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : ''}
          availableSlots={availableSlots}
        />
      )}
    </div>
  )
}

export default AdminCalendar