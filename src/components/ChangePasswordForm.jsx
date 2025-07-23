import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { API_URL } from '../config'

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Resetuj stany
    setError('')
    setSuccess(false)
    
    // Walidacja
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Wszystkie pola są wymagane')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Nowe hasło i potwierdzenie hasła nie są zgodne')
      return
    }
    
    setLoading(true)
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        // Wyczyść formularz
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.message || 'Wystąpił błąd podczas zmiany hasła')
      }
    } catch (error) {
      console.error('Błąd zmiany hasła:', error)
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Lock className="w-5 h-5 mr-2 text-primary" />
        Zmiana hasła
      </h3>
      
      {success && (
        <motion.div 
          className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Check className="w-5 h-5 mr-2 text-green-600" />
          Hasło zostało zmienione pomyślnie
        </motion.div>
      )}
      
      {error && (
        <motion.div 
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Obecne hasło
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Wprowadź obecne hasło"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nowe hasło
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Wprowadź nowe hasło"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Hasło musi mieć co najmniej 6 znaków
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Potwierdź nowe hasło
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Potwierdź nowe hasło"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Zmieniam hasło...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  )
}

export default ChangePasswordForm