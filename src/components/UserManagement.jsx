import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Check, X, Trash2, Search, UserCheck, UserX, Phone, Copy, CheckCircle } from 'lucide-react'
import { API_URL } from '../config'

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
  
  // Funkcja do pobierania wszystkich numerów telefonów
  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/admin/phone-numbers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPhoneNumbers(data.phoneNumbers)
        setFormattedPhoneNumbers(data.formattedPhoneNumbers)
        setPhoneCount(data.count)
      }
    } catch (error) {
      console.error('Błąd pobierania numerów telefonów:', error)
    } finally {
      setLoadingPhones(false)
    }
  }
  
  // Funkcja do kopiowania numerów telefonów do schowka
  const copyPhoneNumbers = () => {
    navigator.clipboard.writeText(formattedPhoneNumbers)
      .then(() => {
        setCopied(true)
        console.log('Numery telefonów skopiowane do schowka')
      })
      .catch(err => {
        console.error('Błąd kopiowania do schowka:', err)
      })
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
      {phoneNumbers.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <h4 className="font-medium text-blue-800 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Numery telefonów ({phoneCount})
            </h4>
            <button
              onClick={copyPhoneNumbers}
              className={`flex items-center space-x-2 ${copied ? 'bg-green-600' : 'bg-blue-600'} text-white px-3 py-1 rounded-lg hover:opacity-90 transition-colors text-sm`}
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
            {formattedPhoneNumbers}
          </div>
        </div>
      )}

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
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Brak konta
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
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