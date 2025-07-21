import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock, User, Mail, Phone, Lock, LogIn, Scissors, Check, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { API_URL } from '../config'

const BookingModal = ({ isOpen, onClose, selectedDate, selectedTime, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})

  // Sprawdzamy, czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
    
    // Jeśli użytkownik nie jest zalogowany, pobieramy informacje kontaktowe
    if (!token) {
      fetchContactInfo()
    }
    
    // Zawsze pobieramy listę usług
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
          { id: 1, name: 'Manicure klasyczny', price: 80.00, category: 'Manicure' },
          { id: 2, name: 'Manicure hybrydowy', price: 120.00, category: 'Manicure' },
          { id: 3, name: 'Pedicure klasyczny', price: 100.00, category: 'Pedicure' },
          { id: 4, name: 'Oczyszczanie twarzy', price: 150.00, category: 'Pielęgnacja twarzy' },
          { id: 5, name: 'Peeling chemiczny', price: 200.00, category: 'Pielęgnacja twarzy' },
          { id: 6, name: 'Laminacja brwi', price: 80.00, category: 'Stylizacja brwi' },
          { id: 7, name: 'Mezoterapia igłowa', price: 300.00, category: 'Medycyna estetyczna' }
        ]
        setServices(defaultServices)
        
        // Grupujemy usługi według kategorii
        const uniqueCategories = [...new Set(defaultServices.map(service => service.category))]
        setCategories(uniqueCategories)
        
        // Inicjalizujemy stan rozwinięcia kategorii
        const initialExpandedState = {}
        uniqueCategories.forEach(category => {
          initialExpandedState[category] = false
        })
        setExpandedCategories(initialExpandedState)
        
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
      
      // Grupujemy usługi według kategorii
      const uniqueCategories = [...new Set(servicesList.map(service => service.category))]
      setCategories(uniqueCategories)
      
      // Inicjalizujemy stan rozwinięcia kategorii
      const initialExpandedState = {}
      uniqueCategories.forEach(category => {
        initialExpandedState[category] = false
      })
      setExpandedCategories(initialExpandedState)
      
    } catch (error) {
      console.error('Błąd pobierania usług:', error)
      // Ustawiamy domyślne usługi w przypadku błędu
      const defaultServices = [
        { id: 1, name: 'Manicure klasyczny', price: 80.00, category: 'Manicure' },
        { id: 2, name: 'Manicure hybrydowy', price: 120.00, category: 'Manicure' },
        { id: 3, name: 'Pedicure klasyczny', price: 100.00, category: 'Pedicure' },
        { id: 4, name: 'Oczyszczanie twarzy', price: 150.00, category: 'Pielęgnacja twarzy' },
        { id: 5, name: 'Peeling chemiczny', price: 200.00, category: 'Pielęgnacja twarzy' },
        { id: 6, name: 'Laminacja brwi', price: 80.00, category: 'Stylizacja brwi' },
        { id: 7, name: 'Mezoterapia igłowa', price: 300.00, category: 'Medycyna estetyczna' }
      ]
      setServices(defaultServices)
      
      // Grupujemy usługi według kategorii
      const uniqueCategories = [...new Set(defaultServices.map(service => service.category))]
      setCategories(uniqueCategories)
      
      // Inicjalizujemy stan rozwinięcia kategorii
      const initialExpandedState = {}
      uniqueCategories.forEach(category => {
        initialExpandedState[category] = false
      })
      setExpandedCategories(initialExpandedState)
      
    } finally {
      setLoadingServices(false)
    }
  }

  // Pobieramy informacje kontaktowe
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Imię i nazwisko jest wymagane'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Numer telefonu jest wymagany'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          services: selectedServices.map(service => ({
            id: service.id,
            name: service.name,
            price: service.price
          })),
          totalPrice: calculateTotalPrice()
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess(data.reservation)
        onClose()
        setFormData({ name: '', email: '', phone: '', notes: '' })
        setSelectedServices([])
      } else {
        setErrors({ general: data.message })
      }
    } catch (error) {
      setErrors({ general: 'Błąd połączenia z serwerem' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  // Funkcja do przełączania rozwinięcia kategorii
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Funkcja do dodawania/usuwania usługi z wybranych
  const toggleService = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id)
      if (isSelected) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }
  
  // Funkcja do obliczania łącznej ceny wybranych usług
  const calculateTotalPrice = () => {
    return selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0)
  }
  
  // Funkcja sprawdzająca czy usługa jest wybrana
  const isServiceSelected = (serviceId) => {
    return selectedServices.some(service => service.id === serviceId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Rezerwacja wizyty</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Podsumowanie terminu */}
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{new Date(selectedDate).toLocaleDateString('pl-PL')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{selectedTime}</span>
              </div>
            </div>
          </div>
          
          {/* Sekcja z usługami */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-h-[50vh] overflow-y-auto">
            <h3 className="font-semibold text-green-800 mb-4 flex items-center sticky top-0 bg-green-50 py-2 z-10">
              <Scissors className="w-4 h-4 mr-2" />
              Wybierz usługi
            </h3>
            
            {loadingServices ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-4">
                {/* Kategorie usług */}
                {categories.map((category) => (
                  <div key={category} className="border border-green-200 rounded-lg overflow-hidden">
                    {/* Nagłówek kategorii */}
                    <button 
                      onClick={() => toggleCategory(category)}
                      className="w-full flex justify-between items-center p-3 bg-green-100 hover:bg-green-200 transition-colors"
                    >
                      <span className="font-medium text-green-800">{category}</span>
                      {expandedCategories[category] ? 
                        <ChevronUp className="w-5 h-5 text-green-700" /> : 
                        <ChevronDown className="w-5 h-5 text-green-700" />}
                    </button>
                    
                    {/* Lista usług w kategorii */}
                    {expandedCategories[category] && (
                      <div className="p-3 space-y-2">
                        {services
                          .filter(service => service.category === category)
                          .map((service) => (
                            <div 
                              key={service.id} 
                              className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${isServiceSelected(service.id) ? 'bg-green-200' : 'hover:bg-green-100'}`}
                              onClick={() => toggleService(service)}
                            >
                              <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${isServiceSelected(service.id) ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                  {isServiceSelected(service.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-green-800">{service.name}</span>
                              </div>
                              <span className="text-sm font-semibold text-green-800">
                                {typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : (service.price && !isNaN(parseFloat(service.price)) ? `${parseFloat(service.price).toFixed(2)} zł` : service.price)}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Podsumowanie wybranych usług */}
                {selectedServices.length > 0 && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Wybrane usługi ({selectedServices.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span>{service.name}</span>
                          <span className="font-medium">{typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : (service.price && !isNaN(parseFloat(service.price)) ? `${parseFloat(service.price).toFixed(2)} zł` : service.price)}</span>
                        </div>
                      ))}
                      <div className="border-t border-green-300 mt-2 pt-2 flex justify-between font-bold text-green-800">
                        <span>Razem:</span>
                        <span>{parseFloat(calculateTotalPrice()).toFixed(2)} zł</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-700 py-1">Brak dostępnych usług</p>
            )}
          </div>

          {/* Błąd ogólny */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {errors.general}
            </div>
          )}

          {isLoggedIn ? (
            /* Formularz dla zalogowanych użytkowników */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Imię i nazwisko */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Jan Kowalski"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="jan@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numer telefonu *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+48 123 456 789"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Notatki */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dodatkowe informacje (opcjonalne)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
                  placeholder="Np. preferowany rodzaj zabiegu, uwagi specjalne..."
                />
              </div>

              {/* Przyciski */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Rezerwuję...' : 'Zarezerwuj'}
                </button>
              </div>
            </form>
          ) : (
            /* Informacje dla niezalogowanych użytkowników */
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Wymagane logowanie</h3>
                </div>
                <p className="text-amber-700 text-sm">
                  Aby zarezerwować wizytę online, musisz być zalogowany. 
                  Możesz również umówić się telefonicznie.
                </p>
              </div>
              
              {contactInfo && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Kontakt telefoniczny</h3>
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
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Zaloguj się</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default BookingModal