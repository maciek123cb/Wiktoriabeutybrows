import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import Blog from './components/Blog'
import Testimonials from './components/Testimonials'
import Gallery from './components/Gallery'
import MetamorphosisGallery from './components/MetamorphosisGallery'
import CTA from './components/CTA'
import Footer from './components/Footer'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import BlogPage from './pages/BlogPage'
import ArticlePage from './pages/ArticlePage'
import ReviewsPage from './pages/ReviewsPage'
import MetamorphosisPage from './pages/MetamorphosisPage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import AdminPanelModal from './components/AdminPanelModal'
import BookingPage from './pages/BookingPage'
import BookingForm from './components/BookingForm'
import BookingModal from './components/BookingModal'
import GuestBookingModal from './components/GuestBookingModal'
import ClientPanel from './components/ClientPanel'
import MetamorphosisModal from './components/MetamorphosisModal'

// Komponent strony głównej
const HomePage = ({ user, onBookingClick, showBookingForm, setShowBookingForm, handleBookingSuccess, showClientPanel, setShowClientPanel, handleCloseClientPanel, showAdminPanel, handleCloseAdminPanel, showLoginForm, setShowLoginForm, showRegisterForm, setShowRegisterForm, showMetamorphosisModal, setShowMetamorphosisModal, handleLogin, handleRegisterSuccess }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header 
        isScrolled={isScrolled} 
        user={user}
        onLoginClick={() => {
          window.location.hash = 'login';
        }}
        onRegisterClick={() => {
          window.location.hash = 'register';
        }}
        onLogout={() => {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.replace('/')
        }}
        onAdminClick={() => {
          try {
            setShowAdminPanel(true);
          } catch (error) {
            console.error('Błąd przy próbie otwarcia panelu admina:', error);
            // Alternatywne rozwiązanie - odświeżenie strony
            window.location.href = '/';
          }
        }}
        onClientPanelClick={() => setShowClientPanel(true)}
      />
      
      <main>
        <Hero onBookAppointment={onBookingClick} />
        <About onLearnMore={() => navigate('/about')} />
        <Services onViewAllServices={() => navigate('/services')} />
        <MetamorphosisGallery />
        <Blog />
        <Testimonials user={user} />
        <CTA onBookAppointment={onBookingClick} />
      </main>
      <Footer />
      
      {/* Modal umawiania wizyty */}
      {showBookingForm && (
        user && user.role === 'user' ? (
          <BookingForm 
            user={user}
            onClose={() => setShowBookingForm(false)}
            onSuccess={handleBookingSuccess}
          />
        ) : user ? (
          <BookingModal 
            isOpen={true}
            onClose={() => setShowBookingForm(false)}
            selectedDate={new Date().toISOString().split('T')[0]}
            selectedTime="10:00"
            onSuccess={() => {}}
          />
        ) : (
          <GuestBookingModal 
            isOpen={true}
            onClose={() => setShowBookingForm(false)}
            selectedDate={new Date().toISOString().split('T')[0]}
            selectedTime="10:00"
          />
        )
      )}
      
      {/* Panel klienta */}
      {showClientPanel && user && user.role === 'user' && (
        <div className="fixed inset-0 bg-white z-50">
          <ClientPanel 
            user={user}
            onBookAppointment={() => {
              setShowClientPanel(false)
              setShowBookingForm(true)
            }}
          />
          <button
            onClick={handleCloseClientPanel}
            className="fixed top-4 right-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Zamknij
          </button>
        </div>
      )}
      
      {/* Panel admina */}
      {showAdminPanel && user && user.role === 'admin' && (
        <AdminPanelModal 
          user={user} 
          onClose={handleCloseAdminPanel} 
        />
      )}
      
      {/* Modal logowania */}
      {showLoginForm && !user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Logowanie</h2>
            <LoginForm 
              onLogin={(userData) => {
                handleLogin(userData);
                setShowLoginForm(false);
                window.history.pushState({}, '', '/');
              }}
              onBack={() => {
                setShowLoginForm(false);
                window.history.pushState({}, '', '/');
              }}
              onRegisterClick={() => {
                setShowLoginForm(false);
                setShowRegisterForm(true);
                window.history.pushState({}, '', '/#register');
              }}
            />
            <button
              onClick={() => {
                setShowLoginForm(false);
                window.history.pushState({}, '', '/');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Modal rejestracji */}
      {showRegisterForm && !user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rejestracja</h2>
            <RegisterForm 
              onRegisterSuccess={(message) => {
                handleRegisterSuccess(message);
                setShowRegisterForm(false);
                setShowLoginForm(true);
                window.history.pushState({}, '', '/#login');
              }}
              onBack={() => {
                setShowRegisterForm(false);
                window.history.pushState({}, '', '/');
              }}
              onLoginClick={() => {
                setShowRegisterForm(false);
                setShowLoginForm(true);
                window.history.pushState({}, '', '/#login');
              }}
            />
            <button
              onClick={() => {
                setShowRegisterForm(false);
                window.history.pushState({}, '', '/');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Modal metamorfoz */}
      {showMetamorphosisModal && (
        <MetamorphosisModal 
          isOpen={true}
          onClose={() => {
            setShowMetamorphosisModal(false);
            window.history.pushState({}, '', '/');
          }}
        />
      )}
    </div>
  )
}

// Globalne funkcje do otwierania paneli i formularzy
if (typeof window !== 'undefined') {
  window.globalSetShowAdminPanel = null;
  window.globalSetShowBookingForm = null;
}

function App() {
  const [user, setUser] = useState(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showClientPanel, setShowClientPanel] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showMetamorphosisModal, setShowMetamorphosisModal] = useState(false)
  const [message, setMessage] = useState('')
  
  // Zapisujemy referencje do funkcji w zmiennych globalnych
  if (typeof window !== 'undefined') {
    window.globalSetShowAdminPanel = setShowAdminPanel;
    window.globalSetShowBookingForm = setShowBookingForm;
  }

  // Sprawdź czy użytkownik jest zalogowany przy starcie i obsłuż fragmenty URL
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      
      // Nie pokazujemy automatycznie panelu admina przy starcie
      // aby uniknąć problemu z automatycznym zamykaniem
    }
    
    // Obsługa fragmentów URL
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'login') {
        setShowLoginForm(true);
        setShowRegisterForm(false);
        setShowBookingForm(false);
        setShowMetamorphosisModal(false);
      } else if (hash === 'register') {
        setShowRegisterForm(true);
        setShowLoginForm(false);
        setShowBookingForm(false);
        setShowMetamorphosisModal(false);
      } else if (hash === 'metamorfozy' || hash === 'galeria') {
        setShowMetamorphosisModal(true);
        setShowLoginForm(false);
        setShowRegisterForm(false);
        setShowBookingForm(false);
      } else {
        setShowLoginForm(false);
        setShowRegisterForm(false);
        setShowMetamorphosisModal(false);
      }
    };
    
    // Wywołaj przy starcie
    handleHashChange();
    
    // Nasłuchuj zmian fragmentu URL
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    if (userData.role === 'admin') {
      setShowAdminPanel(true)
    }
  }

  const handleRegisterSuccess = (successMessage) => {
    setMessage(successMessage)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleBookingClick = () => {
    // Zawsze pokazujemy formularz rezerwacji jako modal
    // Niezalogowani użytkownicy zobaczą informację o konieczności logowania w modalu
    setShowBookingForm(true);
  }

  const handleClientPanelClick = () => {
    if (user && user.role === 'user') {
      setShowClientPanel(true)
    }
  }

  const handleBookingSuccess = (successMessage) => {
    setShowBookingForm(false)
    setMessage(successMessage)
    setTimeout(() => setMessage(''), 5000)
    if (showClientPanel) {
      window.location.reload()
    }
  }

  const handleCloseClientPanel = () => {
    setShowClientPanel(false)
  }

  const handleCloseAdminPanel = () => {
    setShowAdminPanel(false)
    // Nie wylogowujemy użytkownika przy zamknięciu panelu
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    // Użyj window.location.replace zamiast window.location.href
    window.location.replace('/')
  }

  return (
    <Router>
      {/* Komunikat powodzenia */}
      {message && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
      
      <Routes>
        <Route path="/" element={
          <HomePage 
            user={user}
            onBookingClick={handleBookingClick}
            showBookingForm={showBookingForm}
            setShowBookingForm={setShowBookingForm}
            handleBookingSuccess={handleBookingSuccess}
            showClientPanel={showClientPanel}
            setShowClientPanel={setShowClientPanel}
            handleCloseClientPanel={handleCloseClientPanel}
            showAdminPanel={showAdminPanel}
            handleCloseAdminPanel={handleCloseAdminPanel}
            showLoginForm={showLoginForm}
            setShowLoginForm={setShowLoginForm}
            showRegisterForm={showRegisterForm}
            setShowRegisterForm={setShowRegisterForm}
            showMetamorphosisModal={showMetamorphosisModal}
            setShowMetamorphosisModal={setShowMetamorphosisModal}
            handleLogin={handleLogin}
            handleRegisterSuccess={handleRegisterSuccess}
          />
        } />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/metamorfozy" element={<MetamorphosisPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/login" element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm 
              onLogin={(userData) => {
                handleLogin(userData)
                // Używamy Navigate zamiast window.location.href, aby uniknąć przeładowania strony
                window.history.pushState({}, '', '/')
              }}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )
        } />
        <Route path="/register" element={
          <RegisterForm 
            onRegisterSuccess={handleRegisterSuccess}
          />
        } />
        {/* Przekierowanie dla wszystkich nieznanych ścieżek */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App