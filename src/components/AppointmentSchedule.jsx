import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Clock, User, Mail, Phone, Check, X, MessageSquare } from 'lucide-react'

const AppointmentSchedule = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  useEffect(() => {
    loadAppointments()
  }, [searchTerm, dateFilter])

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (dateFilter) params.append('date', dateFilter)

      const response = await fetch(`http://localhost:3001/api/admin/appointments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Błąd ładowania harmonogramu:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmAppointment = async (id) => {
    setConfirmingId(id)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:3001/api/admin/appointments/${id}/confirm`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        loadAppointments()
      }
    } catch (error) {
      console.error('Błąd potwierdzania wizyty:', error)
    } finally {
      setConfirmingId(null)
    }
  }

  const deleteAppointment = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wizytę?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:3001/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        loadAppointments()
      }
    } catch (error) {
      console.error('Błąd usuwania wizyty:', error)
    }
  }

  const isAppointmentPast = (date, time) => {
    const appointmentDateTime = new Date(`${date}T${time}`)
    return appointmentDateTime < new Date()
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter(apt => !isAppointmentPast(apt.date, apt.time))
  const pastAppointments = appointments.filter(apt => isAppointmentPast(apt.date, apt.time))

  return (
    <div className="space-y-6">
      {/* Filtry */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj po imieniu/nazwisku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Nadchodzące wizyty */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Nadchodzące wizyty ({upcomingAppointments.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Data i godzina */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium text-gray-800">
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium text-gray-800">
                          {appointment.time}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Potwierdzona' : 
                         appointment.status === 'cancelled' ? 'Anulowana' : 'Oczekuje'}
                      </div>
                    </div>

                    {/* Dane klienta */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{appointment.first_name} {appointment.last_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{appointment.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{appointment.phone}</span>
                      </div>
                    </div>

                    {/* Notatki */}
                    {appointment.notes && (
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600 text-sm">{appointment.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Akcje */}
                  <div className="flex items-center space-x-2 ml-4">
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => confirmAppointment(appointment.id)}
                        disabled={confirmingId === appointment.id}
                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-sm">
                          {confirmingId === appointment.id ? 'Potwierdzam...' : 'Potwierdź'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Usuń</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              Brak nadchodzących wizyt
            </div>
          )}
        </div>
      </div>

      {/* Przeszłe wizyty */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-600">
              Przeszłe wizyty ({pastAppointments.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {appointment.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{appointment.first_name} {appointment.last_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAppointment(appointment.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentSchedule