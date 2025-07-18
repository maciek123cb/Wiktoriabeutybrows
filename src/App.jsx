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
import AdminPanel from './pages/AdminPanel'
import BookingPage from './pages/BookingPage'
import BookingForm from './components/BookingForm'
import ClientPanel from './components/ClientPanel'

// Komponent strony głównej
const HomePage = ({ user, onBookingClick, showBookingForm, setShowBookingForm, handleBookingSuccess, showClientPanel, setShowClientPanel, handleCloseClientPanel }) => {
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
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onLogout={() => {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.href = '/'
        }}
        onAdminClick={() => navigate('/admin')}
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
      {showBookingForm && user && (
        <BookingForm 
          user={user}
          onClose={() => setShowBookingForm(false)}
          onSuccess={handleBookingSuccess}
        />
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
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showClientPanel, setShowClientPanel] = useState(false)
  const [message, setMessage] = useState('')

  // Sprawdź czy użytkownik jest zalogowany przy starcie
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleRegisterSuccess = (successMessage) => {
    setMessage(successMessage)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleBookingClick = () => {
    if (user && user.role === 'user') {
      setShowBookingForm(true)
    } else {
      window.location.href = '/booking'
    }
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

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/'
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
          <LoginForm 
            onLogin={(userData) => {
              handleLogin(userData)
              if (userData.role === 'admin') {
                window.location.href = '/admin'
              } else {
                window.location.href = '/'
              }
            }}
            onRegisterSuccess={handleRegisterSuccess}
          />
        } />
        <Route path="/register" element={
          <RegisterForm 
            onRegisterSuccess={handleRegisterSuccess}
          />
        } />
        <Route path="/admin" element={
          user && user.role === 'admin' ? (
            <AdminPanel user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  )
}

export default App