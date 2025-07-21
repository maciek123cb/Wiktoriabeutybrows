import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, Check, X, MessageSquare, Plus } from 'lucide-react'
import Calendar from './Calendar'
import { API_URL } from '../config'

const AppointmentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [datesWithAppointments, setDatesWithAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [availableSlots, setAvailableSlots] = useState([])
  const [newAppointment, setNewAppointment] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    time: '',
    notes: ''
  })
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchDatesWithAppointments()
  }, [])

  const fetchDatesWithAppointments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      // Wyciągnij unikalne daty z wizyt
      const dates = [...new Set(data.appointments?.map(apt => {
        const date = new Date(apt.date)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }) || [])]
      
      setDatesWithAppointments(dates)
    } catch (error) {
      console.error('Błąd pobierania dat z wizytami:', error)
    }
  }

  const fetchAppointmentsForDate = async (date) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const response = await fetch(`${API_URL}/api/admin/appointments?date=${dateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Błąd pobierania wizyt:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    fetchAppointmentsForDate(date)
    fetchAvailableSlotsForDate(date)
    setShowAddForm(false)
  }

  const fetchAvailableSlotsForDate = async (date) => {
    try {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`)
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Błąd pobierania dostępnych slotów:', error)
    }
  }

  const confirmAppointment = async (id) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/appointments/${id}/confirm`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchAppointmentsForDate(selectedDate)
        fetchDatesWithAppointments()
      }
    } catch (error) {
      console.error('Błąd potwierdzania wizyty:', error)
    }
  }

  const deleteAppointment = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wizytę?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchAppointmentsForDate(selectedDate)
        fetchDatesWithAppointments()
      }
    } catch (error) {
      console.error('Błąd usuwania wizyty:', error)
    }
  }

  const addManualAppointment = async () => {
    if (!selectedDate || !newAppointment.firstName || !newAppointment.lastName || 
        !newAppointment.phone || !newAppointment.email || !newAppointment.time) {
      alert('Wypełnij wszystkie wymagane pola')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const response = await fetch(`${API_URL}/api/admin/appointments/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAppointment,
          date: dateStr
        })
      })
      
      if (response.ok) {
        fetchAppointmentsForDate(selectedDate)
        fetchDatesWithAppointments()
        fetchAvailableSlotsForDate(selectedDate)
        setNewAppointment({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          time: '',
          notes: ''
        })
        setShowAddForm(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Błąd dodawania wizyty')
      }
    } catch (error) {
      console.error('Błąd dodawania wizyty:', error)
      alert('Błąd połączenia z serwerem')
    }
  }

  const searchClients = async (query) => {
    if (query.length < 2) {
      setClientSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/clients/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setClientSuggestions(data.clients || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Błąd wyszukiwania klientów:', error)
    }
  }

  const selectClient = (client) => {
    setNewAppointment(prev => ({
      ...prev,
      firstName: client.first_name,
      lastName: client.last_name,
      phone: client.phone,
      email: client.email
    }))
    setShowSuggestions(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Potwierdzona'
      case 'cancelled':
        return 'Anulowana'
      default:
        return 'Oczekuje'
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
            datesWithSlots={datesWithAppointments}
          />
        </div>

        {/* Panel wizyt */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Wizyty na wybrany dzień
          </h3>

          {selectedDate ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Wizyt: {appointments.length}
                </span>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center space-x-2 bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj wizytę</span>
                </button>
              </div>

              {/* Formularz dodawania wizyty */}
              {showAddForm && (
                <motion.div
                  className="bg-gray-50 rounded-lg p-4 mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <h5 className="font-medium text-gray-800 mb-3">Dodaj wizytę ręcznie</h5>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Wyszukaj klienta (imię, nazwisko, email)..."
                      onChange={(e) => searchClients(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {showSuggestions && clientSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {clientSuggestions.map(client => (
                          <div
                            key={client.id}
                            onClick={() => selectClient(client)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{client.first_name} {client.last_name}</div>
                            <div className="text-gray-500 text-xs">{client.email} • {client.phone}</div>
                            {client.account_type === 'manual' && (
                              <span className="inline-block px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded mt-1">
                                Brak konta
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Imię*"
                      value={newAppointment.firstName}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, firstName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Nazwisko*"
                      value={newAppointment.lastName}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, lastName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="tel"
                      placeholder="Telefon*"
                      value={newAppointment.phone}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email*"
                      value={newAppointment.email}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="mb-3">
                    <select
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Wybierz godzinę*</option>
                      {availableSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <textarea
                      placeholder="Notatki (opcjonalne)"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows="2"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={addManualAppointment}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Dodaj wizytę
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      Anuluj
                    </button>
                  </div>
                </motion.div>
              )}

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-lg">{appointment.time}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{appointment.first_name} {appointment.last_name}</span>
                          {appointment.account_type === 'manual' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Brak konta
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{appointment.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{appointment.phone}</span>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-gray-600 text-sm">{appointment.notes}</span>
                          </div>
                        )}
                        
                        {/* Wybrane usługi */}
                        {appointment.services && appointment.services.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Wybrane usługi:</h5>
                            <div className="space-y-1">
                              {appointment.services.map((service, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{service.service_name}</span>
                                  <span className="font-medium">{typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : (service.price && !isNaN(parseFloat(service.price)) ? `${parseFloat(service.price).toFixed(2)} zł` : service.price)}</span>
                                </div>
                              ))}
                              {appointment.total_price && parseFloat(appointment.total_price) > 0 && (
                                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                                  <span>Razem:</span>
                                  <span>{parseFloat(appointment.total_price).toFixed(2)} zł</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => confirmAppointment(appointment.id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Check className="w-4 h-4" />
                            <span>Potwierdź</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteAppointment(appointment.id)}
                          className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                          <span>Usuń</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Brak wizyt na wybrany dzień</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Wybierz datę z kalendarza, aby zobaczyć wizyty
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentCalendar