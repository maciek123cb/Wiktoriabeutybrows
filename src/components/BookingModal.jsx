import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock, User, Mail, Phone, Lock, LogIn, Scissors, Check, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { API_URL } from '../config'

const BookingModal = ({ isOpen, onClose, selectedDate, selectedTime, onSuccess }) => {
  // Usunięto stany formularza, ponieważ rezerwacje są tylko telefoniczne
  const [errors, setErrors] = useState({})
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

  // Funkcja validateForm została usunięta, ponieważ rezerwacje są tylko telefoniczne

  // Funkcja handleSubmit została usunięta, ponieważ rezerwacje są tylko telefoniczne

  // Funkcja handleChange została usunięta, ponieważ rezerwacje są tylko telefoniczne
  
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
  
  // Funkcja do obliczania łącznego czasu trwania wybranych usług
  const calculateTotalDuration = () => {
    return selectedServices.reduce((sum, service) => sum + (parseInt(service.duration) || 0), 0)
  }
  
  // Funkcja sprawdzająca czy łączny czas przekracza 90 minut (1:30h)
  const isTotalDurationExceeded = () => {
    return calculateTotalDuration() > 90
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
                                <div>
                                  <span className="text-sm text-green-800">{service.name}</span>
                                  {service.duration && (
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {service.duration} min
                                    </div>
                                  )}
                                </div>
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
                          <div>
                            <span>{service.name}</span>
                            {service.duration && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({service.duration} min)
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : (service.price && !isNaN(parseFloat(service.price)) ? `${parseFloat(service.price).toFixed(2)} zł` : service.price)}</span>
                        </div>
                      ))}
                      <div className="border-t border-green-300 mt-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span>Czas trwania:</span>
                          <span className="font-medium">{calculateTotalDuration()} min</span>
                        </div>
                        <div className="flex justify-between font-bold text-green-800 mt-1">
                          <span>Razem:</span>
                          <span>{parseFloat(calculateTotalPrice()).toFixed(2)} zł</span>
                        </div>
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
            /* Komunikat o konieczności rezerwacji telefonicznej */
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Rezerwacja telefoniczna</h3>
              </div>
              <p className="text-sm">
                Aby zarezerwować wizytę, prosimy o kontakt telefoniczny.
                {contactInfo && (
                  <a href={`tel:${contactInfo.phone}`} className="text-primary hover:underline ml-1">
                    {contactInfo.phone}
                  </a>
                )}
              </p>
              {contactInfo && (
                <div className="mt-3 space-y-2">
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
              
              {/* Przycisk zamknięcia */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => { if (contactInfo) window.location.href = `tel:${contactInfo.phone}` }}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  <Phone className="w-5 h-5" />
                  <span>Zadzwoń</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          ) : (
            /* Informacje dla niezalogowanych użytkowników */
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Phone className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Rezerwacja telefoniczna</h3>
                </div>
                <p className="text-amber-700 text-sm">
                  Rezerwacja wizyt odbywa się tylko telefonicznie.
                  Prosimy o kontakt pod numerem telefonu.
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
                  onClick={() => { if (contactInfo) window.location.href = `tel:${contactInfo.phone}` }}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  <Phone className="w-5 h-5" />
                  <span>Zadzwoń</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zamknij
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