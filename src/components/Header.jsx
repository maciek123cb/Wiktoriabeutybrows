import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'

const Header = ({ isScrolled, user, onLoginClick, onRegisterClick, onLogout, onAdminClick, onClientPanelClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: '/#o-mnie', label: 'O mnie' },
    { href: '/#oferta', label: 'Oferta' },
    { href: '/#rezerwacja', label: 'Rezerwacja' },
    { href: '/#poradnik', label: 'Poradnik' },
    { href: '/metamorfozy', label: 'Galeria' },
    { href: '/#opinie', label: 'Opinie' },
    { href: '/#kontakt', label: 'Kontakt' }
  ]

  return (
    <motion.header
      className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container-custom mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.a
            href="/"
            className="text-2xl font-bold text-primary"
            whileHover={{ scale: 1.05 }}
          >
            Wiktoriabeauty_Brows
          </motion.a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.a>
            ))}
            
            {/* Menu użytkownika */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Witaj, {user.firstName}!
                </span>
                {user.role === 'admin' ? (
                  <motion.button
                    onClick={onAdminClick}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Panel Admin</span>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={onClientPanelClick}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-4 h-4" />
                    <span>Moje wizyty</span>
                  </motion.button>
                )}
                <motion.button
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Wyloguj</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={onRegisterClick}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Rejestracja
                </motion.button>
                <motion.button
                  onClick={onLoginClick}
                  className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logowanie
                </motion.button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            <div className="border-t pt-4 mt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-2">
                    Witaj, {user.firstName}!
                  </div>
                  {user.role === 'admin' ? (
                    <button
                      onClick={() => {
                        onAdminClick()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 w-full text-left py-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Panel administratora</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClientPanelClick()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 w-full text-left py-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Moje wizyty</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onRegisterClick()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left py-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    Rejestracja
                  </button>
                  <button
                    onClick={() => {
                      onLoginClick()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left py-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    Logowanie
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  )
}

export default Header