import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, MessageSquare, X, Search } from 'lucide-react'
import { API_URL } from '../config'

const ManualAppointmentForm = ({ onClose, onSuccess, selectedDate, availableSlots }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    date: selectedDate || '',
    time: '',
    notes: ''
  })
  
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const suggestionsRef = useRef(null)

  // Ukryj podpowiedzi po kliknięciu poza nimi
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.users || [])
        setShowSuggestions(data.users && data.users.length > 0)
      }
    } catch (error) {
      console.error('Błąd wyszukiwania użytkowników:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Wyszukiwanie podpowiedzi dla pól tekstowych
    if (field === 'firstName' || field === 'lastName' || field === 'email' || field === 'phone') {
      // Anuluj poprzednie wyszukiwanie
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      
      // Ustaw nowe wyszukiwanie z opóźnieniem
      const timeout = setTimeout(() => {
        if (value && value.length >= 2) {
          searchUsers(value)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      }, 500)
      
      setSearchTimeout(timeout)
    }
  }

  const selectUser = (user) => {
    setFormData(prev => ({
      ...prev,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      email: user.email
    }))
    setShowSuggestions(false)
    setSuggestions([])
    
    // Anuluj aktywne wyszukiwanie
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      setSearchTimeout(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.date || !formData.time) {
      alert('Wszystkie pola są wymagane')
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('authToken')
      
      // Próbujemy najpierw nowego endpointu
      let response = await fetch(`${API_URL}/api/admin/manual-appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      // Jeśli nowy endpoint nie zadziała, próbujemy starego
      if (response.status === 404) {
        console.log('Nowy endpoint niedostępny, próbuję starego...')
        response = await fetch(`${API_URL}/api/admin/appointments/manual`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            // Upewnij się, że przekazujemy liczby jako liczby
            totalPrice: 0,
            totalDuration: 0
          })
        })
      }

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Dodajemy informację o tym, jak użytkownik został znaleziony
          let message = data.message;
          if (data.userFoundBy === 'email') {
            message = `Wizyta została dodana dla istniejącego klienta znalezionego po emailu (ID: ${data.userId})`;
          } else if (data.userFoundBy === 'name') {
            message = `Wizyta została dodana dla istniejącego klienta znalezionego po imieniu i nazwisku (ID: ${data.userId})`;
          } else if (data.userFoundBy === 'created') {
            message = `Wizyta została dodana i utworzono nowy profil klienta (ID: ${data.userId})`;
          }
          onSuccess(message)
        } else {
          alert(data.message || 'Wystąpił błąd podczas dodawania wizyty')
        }
      } else {
        const errorText = await response.text()
        console.error('Błąd odpowiedzi serwera:', response.status, errorText)
        alert(`Błąd serwera: ${response.status}. Spróbuj ponownie później.`)
      }
    } catch (error) {
      console.error('Błąd połączenia z serwerem:', error)
      alert('Błąd połączenia z serwerem. Spróbuj ponownie później.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Dodaj wizytę ręcznie</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dane klienta z podpowiedziami */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Imię
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onFocus={() => {
                    if (formData.firstName.length >= 2) {
                      searchUsers(formData.firstName)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Imię klienta"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwisko
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onFocus={() => {
                    if (formData.lastName.length >= 2) {
                      searchUsers(formData.lastName)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nazwisko klienta"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => {
                    if (formData.email.length >= 2) {
                      searchUsers(formData.email)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onFocus={() => {
                    if (formData.phone.length >= 3) {
                      searchUsers(formData.phone)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123-456-789"
                  required
                />
              </div>
            </div>

            {/* Podpowiedzi użytkowników */}
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center mb-3">
                  <Search className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Znalezieni użytkownicy ({suggestions.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {suggestions.map(user => (
                    <motion.button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email} • {user.phone}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.account_type === 'manual' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Brak konta
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Data i godzina */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline w-4 h-4 mr-2" />
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-2" />
                  Godzina
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Wybierz godzinę</option>
                  {availableSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notatki */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline w-4 h-4 mr-2" />
                Notatki (opcjonalne)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows="3"
                placeholder="Dodatkowe informacje o wizycie..."
              />
            </div>

            {/* Przyciski */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {loading ? 'Dodaję...' : 'Dodaj wizytę'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default ManualAppointmentForm