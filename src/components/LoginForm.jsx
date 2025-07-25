import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { API_URL } from '../config'

const LoginForm = ({ onLogin, onBack, onRegisterClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Walidacja email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Walidacja formularza
  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email jest wymagany'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email'
    }

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Hasło musi mieć minimum 6 znaków'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Obsługa wysyłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!validateForm()) return

    setIsLoading(true)
    console.log('Próba logowania do:', `${API_URL}/api/login`);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Odpowiedź serwera:', response.status);
      const data = await response.json()
      console.log('Dane z serwera:', data);

      if (data.success) {
        // Zapisz token w localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        // Zapisz informację o czasie ważności tokenu
        localStorage.setItem('tokenExpires', data.expiresIn || '24h')
        // Zapisz informację o opcji "Zapamiętaj mnie"
        localStorage.setItem('rememberMe', formData.rememberMe.toString())
        console.log('Zalogowano pomyślnie, przekierowuję...');
        onLogin(data.user);
      } else {
        setLoginError(data.message || 'Błąd logowania')
      }
    } catch (error) {
      console.error('Błąd logowania:', error);
      setLoginError('Błąd połączenia z serwerem')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Usuń błąd dla tego pola
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="w-full">
      <motion.div
        className="bg-white rounded-xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Panel Administratora
          </motion.h1>
          <p className="text-gray-600">Zaloguj się do systemu</p>
        </div>

        {loginError && (
          <motion.div
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {loginError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
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
                placeholder="admin@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Hasło */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Admin123!"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          
          {/* Zapamiętaj mnie */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Zapamiętaj mnie
            </label>
          </div>

          {/* Przyciski */}
          <div className="space-y-4">
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </motion.button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onBack || (() => window.location.href = '/')}
                className="flex-1 text-gray-600 hover:text-primary transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={onRegisterClick || (() => window.location.hash = 'register')}
                className="flex-1 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Nie masz konta? Zarejestruj się
              </button>
            </div>
          </div>
        </form>

        {/* Dane testowe */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Dane testowe:</p>
          <p className="text-xs text-gray-500">Email: admin@example.com</p>
          <p className="text-xs text-gray-500">Hasło: Admin123!</p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginForm