import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MessageSquare, CheckCircle, XCircle, AlertCircle, Plus, Lock } from 'lucide-react'
import ChangePasswordForm from './ChangePasswordForm'
import { API_URL } from '../config'

const ClientPanel = ({ user, onBookAppointment }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('appointments') // 'appointments' lub 'settings'

  useEffect(() => {
    fetchUserAppointments()
  }, [])

  const fetchUserAppointments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/user/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Błąd pobierania wizyt:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie wizyt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                Panel Klienta
              </h1>
            </div>
            <div className="text-gray-600">
              Witaj, {user.firstName} {user.lastName}!
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Panel klienta
            </h2>
            <p className="text-gray-600">
              Zarządzaj swoimi wizytami i ustawieniami konta.
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-6 py-3 font-medium text-sm flex items-center space-x-2 ${activeTab === 'appointments' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Moje wizyty</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium text-sm flex items-center space-x-2 ${activeTab === 'settings' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Lock className="w-5 h-5" />
              <span>Ustawienia konta</span>
            </button>
          </div>

          {activeTab === 'appointments' && (
            <>
              {/* Quick Action */}
              <div className="mb-8">
                <motion.button
                  onClick={onBookAppointment}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Umów nową wizytę</span>
                </motion.button>
              </div>

              {/* Appointments List */}
              <div className="bg-white rounded-lg shadow">
            </>
          )}
          
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ChangePasswordForm />
            </div>
          )}
          
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Moje wizyty ({appointments.length})
              </h3>
            </div>

            {appointments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('pl-PL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{appointment.time}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="flex items-start space-x-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <p className="text-gray-600 text-sm">{appointment.notes}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Zgłoszona: {new Date(appointment.created_at).toLocaleDateString('pl-PL')}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusIcon(appointment.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Brak wizyt
                </h3>
                <p className="text-gray-500 mb-6">
                  Nie masz jeszcze żadnych zarezerwowanych wizyt.
                </p>
                <button
                  onClick={onBookAppointment}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Umów pierwszą wizytę
                </button>
              </div>
            )}
          </div>
          )}

          {activeTab === 'appointments' && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Legenda statusów</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-gray-900">Oczekuje</div>
                  <div className="text-sm text-gray-500">Wizyta czeka na potwierdzenie</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Potwierdzona</div>
                  <div className="text-sm text-gray-500">Wizyta została zaakceptowana</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">Anulowana</div>
                  <div className="text-sm text-gray-500">Wizyta została odrzucona</div>
                </div>
              </div>
            </div>
          </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default ClientPanel