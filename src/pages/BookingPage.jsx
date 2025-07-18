import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Phone, UserPlus, LogIn } from 'lucide-react'

const BookingPage = ({ onBack }) => {
  const SALON_PHONE = '532-128-227'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container-custom mx-auto px-4 py-4">
          <a
            href="/"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Powrót do strony głównej</span>
          </a>
        </div>
      </header>

      <div className="container-custom mx-auto px-4 py-8">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Umów wizytę online
              </h1>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-amber-800 mb-4">
                Wymagane logowanie
              </h2>
              <p className="text-amber-700 leading-relaxed">
                Aby umówić wizytę online, musisz być zalogowany. 
                Jeśli nie masz jeszcze konta, zarejestruj się lub skontaktuj się z nami telefonicznie.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <motion.a
                href="/login"
                className="w-full flex items-center justify-center space-x-3 bg-primary text-white py-4 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="w-5 h-5" />
                <span>Zaloguj się lub zarejestruj</span>
              </motion.a>

              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-gray-500 text-sm">lub</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <motion.a
                href={`tel:${SALON_PHONE}`}
                className="w-full flex items-center justify-center space-x-3 bg-green-500 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="w-5 h-5" />
                <span>Zadzwoń: {SALON_PHONE}</span>
              </motion.a>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Dlaczego wymagamy rejestracji?</h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Bezpieczeństwo Twoich danych osobowych</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Możliwość zarządzania swoimi wizytami</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Potwierdzenie tożsamości przed wizytą</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Lepsze planowanie terminów</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BookingPage