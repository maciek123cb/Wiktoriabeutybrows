import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, User, Settings, BarChart3, CalendarDays, Users } from 'lucide-react'
import AdminCalendar from '../components/AdminCalendar'
import AppointmentCalendar from '../components/AppointmentCalendar'
import UserManagement from '../components/UserManagement'
import ServiceManagement from '../components/ServiceManagement'
import ArticleManagement from '../components/ArticleManagement'
import ReviewManagement from '../components/ReviewManagement'
import MetamorphosisManagement from '../components/MetamorphosisManagement'

const AdminPanel = ({ user, onLogout, isModal = false }) => {
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Pobierz dane z chronionego endpointu
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/admin`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAdminData(data)
        } else {
          // Token wygasł lub nieprawidłowy
          onLogout()
        }
      } catch (error) {
        console.error('Błąd pobierania danych:', error)
        onLogout()
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [onLogout])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie panelu...</p>
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
                Wiktoriabeauty_Brows Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Wyloguj</span>
              </button>
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
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {adminData?.message || 'Witaj w panelu administratora!'}
            </h2>
            <p className="text-gray-600">
              Zarządzaj swoim gabinetem kosmetycznym z tego miejsca.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Statystyki</h3>
                  <p className="text-gray-600">Przegląd wizyt i zabiegów</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Klienci</h3>
                  <p className="text-gray-600">Zarządzanie bazą klientów</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Ustawienia</h3>
                  <p className="text-gray-600">Konfiguracja systemu</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Nawigacja zakładek */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Użytkownicy
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Terminy
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Harmonogram
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Usługi
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'articles'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Artykuły
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Opinie
              </button>
              <button
                onClick={() => setActiveTab('metamorphoses')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'metamorphoses'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Metamorfozy
              </button>
            </div>
          </div>

          {/* Treść zakładek */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800">Statystyki</h3>
                      <p className="text-gray-600">Przegląd wizyt i zabiegów</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800">Klienci</h3>
                      <p className="text-gray-600">Zarządzanie bazą klientów</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <CalendarDays className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800">Harmonogram</h3>
                      <p className="text-gray-600">Zarezerwowane wizyty</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Szybkie akcje</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="btn-primary text-center py-3"
                  >
                    Zarządzaj użytkownikami
                  </button>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="btn-secondary text-center py-3"
                  >
                    Zobacz wizyty
                  </button>
                  <button 
                    onClick={() => setActiveTab('calendar')}
                    className="btn-secondary text-center py-3"
                  >
                    Dodaj terminy
                  </button>
                  <button className="btn-secondary text-center py-3">
                    Raporty
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <UserManagement />
          )}

          {activeTab === 'calendar' && (
            <AdminCalendar />
          )}

          {activeTab === 'schedule' && (
            <AppointmentCalendar />
          )}

          {activeTab === 'services' && (
            <ServiceManagement />
          )}

          {activeTab === 'articles' && (
            <ArticleManagement />
          )}

          {activeTab === 'reviews' && (
            <ReviewManagement />
          )}

          {activeTab === 'metamorphoses' && (
            <MetamorphosisManagement />
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default AdminPanel