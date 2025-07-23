import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Check, X, Trash2, Search, UserCheck, UserX, Phone, Copy, CheckCircle } from 'lucide-react'
import { API_URL } from '../config'

// Funkcja do usuwania polskich znaków
const removePolishChars = (text) => {
  return text
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'a')
    .replace(/Ć/g, 'c')
    .replace(/Ę/g, 'e')
    .replace(/Ł/g, 'l')
    .replace(/Ń/g, 'n')
    .replace(/Ó/g, 'o')
    .replace(/Ś/g, 's')
    .replace(/Ź/g, 'z')
    .replace(/Ż/g, 'z')
    .replace(/\s+/g, '');
};

// Funkcja do generowania hasła
const generatePassword = (firstName, lastName) => {
  // Usuwamy polskie znaki i spacje, ale zachowujemy wielkość pierwszej litery
  let normalizedFirstName = removePolishChars(firstName).replace(/\s+/g, '');
  let normalizedLastName = removePolishChars(lastName).replace(/\s+/g, '');
  
  // Zamieniamy wszystkie litery na małe, z wyjątkiem pierwszej
  if (normalizedFirstName.length > 0) {
    normalizedFirstName = normalizedFirstName[0] + normalizedFirstName.slice(1).toLowerCase();
  }
  
  if (normalizedLastName.length > 0) {
    normalizedLastName = normalizedLastName.toLowerCase();
  }
  
  // Łączymy imię i nazwisko + "123"
  return `${normalizedFirstName}${normalizedLastName}123`;
};
}

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [formattedPhoneNumbers, setFormattedPhoneNumbers] = useState('')
  const [phoneCount, setPhoneCount] = useState(0)
  const [loadingPhones, setLoadingPhones] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activationData, setActivationData] = useState(null)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])
  
  // Resetuj stan skopiowania po 2 sekundach
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Otrzymane dane użytkowników:', data.users)
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/activate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        fetchUsers() // Odśwież listę
      }
    } catch (error) {
      console.error('Błąd zmiany statusu użytkownika:', error)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchUsers() // Odśwież listę
      }
    } catch (error) {
      console.error('Błąd usuwania użytkownika:', error)
    }
  }
  
  // Funkcja do aktywacji konta użytkownika
  const activateUserAccount = async (userId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/activate-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          // Zapisz dane aktywacji i pokaż modal
          // Używamy email jako login, ponieważ nie ma kolumny username w bazie
          setActivationData({
            login: data.user.email, // Używamy email jako login
            password: data.password,
            user: data.user
          })
          setShowActivationModal(true)
          setCopiedLogin(false)
          setCopiedPassword(false)
          fetchUsers() // Odśwież listę użytkowników
        } else {
          alert(`Błąd: ${data.message || 'Nie udało się aktywować konta'}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Nieznany błąd' }))
        alert(`Błąd: ${errorData.message || 'Nie udało się aktywować konta'}`)
      }
    } catch (error) {
      console.error('Błąd aktywacji konta:', error)
      alert('Błąd połączenia z serwerem')
    }
  }
  
  // Funkcja do kopiowania tekstu do schowka
  const copyToClipboard = (text, setCopiedState) => {
    try {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedState(true)
          setTimeout(() => setCopiedState(false), 2000)
        })
        .catch(err => {
          console.error('Błąd kopiowania do schowka:', err)
          // Alternatywna metoda
          const textArea = document.createElement('textarea')
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          setCopiedState(true)
          setTimeout(() => setCopiedState(false), 2000)
        })
    } catch (error) {
      console.error('Błąd kopiowania:', error)
      alert('Nie udało się skopiować tekstu')
    }
  }
  
  // Funkcja do pobierania wszystkich numerów telefonów
  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true)
    try {
      const token = localStorage.getItem('authToken')
      console.log('Pobieranie numerów telefonów...')
      
      // Dodajemy timeout do fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 sekund timeout
      
      try {
        const response = await fetch(`${API_URL}/api/admin/phone-numbers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('Status odpowiedzi:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Otrzymane dane:', data)
          
          if (data.success) {
            // Upewniamy się, że phoneNumbers jest tablicą
            const phoneArray = Array.isArray(data.phoneNumbers) ? data.phoneNumbers : []
            setPhoneNumbers(phoneArray)
            setFormattedPhoneNumbers(data.formattedPhoneNumbers || '')
            setPhoneCount(phoneArray.length)
            
            if (phoneArray.length === 0) {
              alert('Nie znaleziono żadnych numerów telefonów')
            } else {
              // Pokaż komunikat o sukcesie
              console.log(`Pobrano ${phoneArray.length} numerów telefonów`)
            }
          } else {
            console.error('Błąd w odpowiedzi:', data.message)
            alert(`Błąd: ${data.message || 'Nie udało się pobrać numerów telefonów'}`)
          }
        } else {
          try {
            const errorData = await response.json()
            console.error('Błąd odpowiedzi (JSON):', response.status, errorData)
            alert(`Błąd serwera: ${errorData.message || response.status}`)
          } catch (jsonError) {
            const errorText = await response.text()
            console.error('Błąd odpowiedzi (tekst):', response.status, errorText)
            alert(`Błąd serwera: ${response.status}`)
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.error('Timeout przy pobieraniu numerów telefonów')
          alert('Przekroczono czas oczekiwania na odpowiedź serwera')
        } else {
          throw fetchError // Przekazujemy błąd do głównego bloku catch
        }
      }
    } catch (error) {
      console.error('Błąd pobierania numerów telefonów:', error)
      alert(`Błąd połączenia: ${error.message || 'Nieznany błąd'}`)
      
      // W przypadku błędu, resetujemy stan
      setPhoneNumbers([])
      setFormattedPhoneNumbers('')
      setPhoneCount(0)
    } finally {
      setLoadingPhones(false)
    }
  }
  
  // Funkcja do kopiowania numerów telefonów do schowka
  const copyPhoneNumbers = () => {
    // Sprawdzamy, czy mamy co kopiować
    if (!formattedPhoneNumbers || formattedPhoneNumbers.trim() === '') {
      alert('Brak numerów telefonów do skopiowania')
      return
    }
    
    try {
      // Próbujemy użyć nowoczesnego API schowka
      navigator.clipboard.writeText(formattedPhoneNumbers)
        .then(() => {
          setCopied(true)
          console.log('Numery telefonów skopiowane do schowka')
        })
        .catch(err => {
          console.error('Błąd kopiowania do schowka:', err)
          // Próbujemy alternatywnej metody
          fallbackCopyTextToClipboard(formattedPhoneNumbers)
        })
    } catch (error) {
      console.error('Błąd podczas kopiowania:', error)
      // Próbujemy alternatywnej metody
      fallbackCopyTextToClipboard(formattedPhoneNumbers)
    }
  }
  
  // Alternatywna metoda kopiowania do schowka
  const fallbackCopyTextToClipboard = (text) => {
    try {
      // Tworzymy tymczasowy element textarea
      const textArea = document.createElement('textarea')
      textArea.value = text
      
      // Ukrywamy element
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      
      // Zaznaczamy i kopiujemy tekst
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopied(true)
        console.log('Numery telefonów skopiowane do schowka (metoda alternatywna)')
      } else {
        alert('Nie udało się skopiować numerów telefonów')
      }
    } catch (err) {
      console.error('Błąd kopiowania do schowka (metoda alternatywna):', err)
      alert('Nie udało się skopiować numerów telefonów')
    }
  }

  // Filtrowanie użytkowników
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesFilter && user.role !== 'admin'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Modal aktywacji konta */}
      {showActivationModal && activationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <UserCheck className="w-5 h-5 text-green-600 mr-2" />
              Konto zostało aktywowane
            </h3>
            
            <p className="text-gray-600 mb-4">
              Konto dla użytkownika <span className="font-medium">{activationData.user?.first_name} {activationData.user?.last_name}</span> zostało pomyślnie aktywowane. Poniżej znajdują się dane logowania:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Login:</span>
                  <button 
                    onClick={() => copyToClipboard(activationData.login, setCopiedLogin)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    {copiedLogin ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Kopiuj
                      </>
                    )}
                  </button>
                </div>
                <div className="font-medium text-gray-800">{activationData.login}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Hasło:</span>
                  <button 
                    onClick={() => copyToClipboard(activationData.password, setCopiedPassword)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    {copiedPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Kopiuj
                      </>
                    )}
                  </button>
                </div>
                <div className="font-medium text-gray-800">{activationData.password}</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Zapisz te dane! Hasło nie będzie już dostępne po zamknięciu tego okna.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowActivationModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Zamknij
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-gray-800">Zarządzanie użytkownikami</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Łącznie: {filteredUsers.length} użytkowników
          </div>
          <button
            onClick={() => {
              fetchPhoneNumbers()
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            disabled={loadingPhones}
          >
            <Phone className="w-4 h-4" />
            <span>Pobierz numery telefonów</span>
          </button>
        </div>
      </div>
      
      {/* Sekcja z numerami telefonów */}
      {loadingPhones ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : phoneNumbers.length > 0 ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <h4 className="font-medium text-blue-800 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Numery telefonów ({phoneCount})
            </h4>
            <button
              onClick={copyPhoneNumbers}
              className={`flex items-center space-x-2 ${copied ? 'bg-green-600' : 'bg-blue-600'} text-white px-3 py-1 rounded-lg hover:opacity-90 transition-colors text-sm`}
              disabled={!formattedPhoneNumbers}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Skopiowano!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopiuj numery</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-white p-3 rounded border border-blue-100 text-sm text-gray-700 max-h-32 overflow-y-auto break-all">
            {formattedPhoneNumbers || <span className="text-gray-400 italic">Brak numerów telefonów</span>}
          </div>
        </div>
      ) : null}

      {/* Filtry i wyszukiwanie */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Szukaj użytkowników..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">Wszyscy</option>
          <option value="active">Aktywni</option>
          <option value="inactive">Nieaktywni</option>
        </select>
      </div>

      {/* Lista użytkowników */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Brak użytkowników do wyświetlenia</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Użytkownik</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Kontakt</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Data rejestracji</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </span>
                        {user.account_type === 'manual' && (
                          <button 
                            onClick={() => activateUserAccount(user.id)}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors cursor-pointer"
                            title="Kliknij, aby aktywować konto"
                          >
                            Brak konta
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                      
                      {/* Dane logowania */}
                      <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Login:</span>
                          <button 
                            onClick={() => copyToClipboard(user.email, () => {})}
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                            title="Kopiuj login"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-medium text-gray-800 mb-1">{user.email}</div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Hasło:</span>
                          <button 
                            onClick={() => copyToClipboard(user.generated_password || generatePassword(user.first_name, user.last_name), () => {})}
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                            title="Kopiuj hasło"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-medium text-gray-800">
                          {user.generated_password || generatePassword(user.first_name, user.last_name)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Aktywny
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Nieaktywny
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.is_active ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika'}
                      >
                        {user.is_active ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Usuń użytkownika"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManagement