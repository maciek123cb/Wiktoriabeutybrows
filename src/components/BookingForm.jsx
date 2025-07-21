import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MessageSquare, AlertCircle, X, Scissors, Check, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import Calendar from './Calendar'
import { API_URL } from '../config'

const BookingForm = ({ user, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})

  // Pobierz dostępne sloty dla wybranej daty
  const fetchAvailableSlots = async (date) => {
    if (!date) {
      console.warn('Próba pobrania slotów bez podania daty');
      setAvailableSlots([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Formatuj datę w formacie YYYY-MM-DD
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Nieprawidłowa data:', date);
        setError('Nieprawidłowa data');
        setAvailableSlots([]);
        return;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('Sformatowana data:', dateStr);
      
      console.log('Pobieranie slotów dla daty:', dateStr);
      console.log('URL zapytania:', `${API_URL}/api/available-slots/${dateStr}`);
      
      // Dodajemy timeout, aby uniknąć problemów z CORS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sekund timeout
      
      try {
        // Pobierz token autoryzacji, jeśli użytkownik jest zalogowany
        const token = localStorage.getItem('authToken');
        
        console.log('Wysyłam zapytanie o dostępne sloty dla daty:', dateStr);
        console.log('Token autoryzacji:', token ? 'Dostępny' : 'Brak');
        
        const response = await fetch(`${API_URL}/api/available-slots/${dateStr}`, {
          signal: controller.signal,
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log('Status odpowiedzi:', response.status);
        console.log('Headers odpowiedzi:', [...response.headers.entries()]);
        
        if (!response.ok) {
          console.error(`Błąd HTTP: ${response.status}`);
          setAvailableSlots([]);
          setError(`Błąd serwera: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        
        console.log('Odpowiedź z serwera dla slotów:', data);
        console.log('Dostępne sloty (typ):', typeof data.slots, 'czy tablica:', Array.isArray(data.slots));
        
        // Zawsze używaj tablicy, nawet jeśli data.slots jest undefined lub null
        const safeSlots = Array.isArray(data.slots) ? data.slots : [];
        console.log('Bezpieczne sloty:', safeSlots);
        
        setAvailableSlots(safeSlots);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Timeout przy pobieraniu slotów');
          setError('Przekroczono czas oczekiwania na odpowiedź serwera');
        } else {
          console.error('Błąd fetch:', fetchError);
          setError('Nie można połączyć się z serwerem');
        }
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Błąd pobierania slotów:', error);
      setError('Nie można pobrać dostępnych terminów. Spróbuj ponownie później.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }

  // Pobierz listę usług przy pierwszym renderowaniu
  useEffect(() => {
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
  
  // Obsługa wyboru daty
  const handleDateSelect = (date) => {
    console.log('Wybrano datę:', date);
    
    // Formatuj datę w formacie YYYY-MM-DD dla logowania
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('Sformatowana data:', dateStr);
    
    setSelectedDate(date);
    setSelectedTime('');
    fetchAvailableSlots(date);
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
  
  // Obsługa wysyłania formularza
  const handleSubmit = async () => {
    setError('')

    if (!selectedDate || !selectedTime) {
      setError('Wybierz datę i godzinę wizyty')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/book-appointment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
          time: selectedTime,
          notes,
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
        onSuccess(data.message)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Umów wizytę</h2>
              <p className="text-gray-600">
                Witaj {user.firstName}! Wybierz termin swojej wizyty.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Kalendarz */}
            <div>
              <Calendar onDateSelect={handleDateSelect} isAdmin={false} />
            </div>

            {/* Panel godzin i notatek */}
            <div className="space-y-6">
              {selectedDate && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Wybrana data: {selectedDate.toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
              )}

              {/* Wybór godziny */}
              {selectedDate && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <Clock className="inline w-4 h-4 mr-2" />
                      Dostępne godziny
                    </label>
                    <button 
                      type="button"
                      onClick={() => fetchAvailableSlots(selectedDate)}
                      className="text-primary hover:text-primary/80 p-1"
                      title="Odśwież dostępne terminy"
                    >
                      ↻
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : Array.isArray(availableSlots) && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((time, index) => (
                        <motion.button
                          key={time || index}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-lg border transition-colors ${
                            selectedTime === time
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-gray-300 hover:border-primary hover:bg-primary/5'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Brak dostępnych terminów w wybranym dniu
                      </p>
                      <button 
                        onClick={() => fetchAvailableSlots(selectedDate)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Odśwież terminy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notatki */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-2" />
                  Dodatkowe informacje (opcjonalne)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Opisz swoje potrzeby lub preferencje..."
                />
              </div>

              {/* Przyciski */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedDate || !selectedTime}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Rezerwuję...' : 'Umów wizytę'}
                </button>
              </div>

              {/* Sekcja z usługami */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center">
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
                                    {typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : service.price}
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
                              <span className="font-medium">{typeof service.price === 'number' ? `${service.price.toFixed(2)} zł` : service.price}</span>
                            </div>
                          ))}
                          <div className="border-t border-green-300 mt-2 pt-2 flex justify-between font-bold text-green-800">
                            <span>Razem:</span>
                            <span>{calculateTotalPrice().toFixed(2)} zł</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-green-700 py-1">Brak dostępnych usług</p>
                )}
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Informacja:</strong> Twoja wizyta zostanie zgłoszona i będzie oczekiwać na potwierdzenie przez salon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingForm