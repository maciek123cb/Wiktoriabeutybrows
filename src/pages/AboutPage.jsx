import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const AboutPage = ({ onBack, onBookAppointment }) => {
  const navItems = [
    { href: '#początki', label: 'Początki' },
    { href: '#edukacja', label: 'Edukacja' },
    { href: '#specjalizacja', label: 'Specjalizacja' },
    { href: '#filozofia', label: 'Filozofia' },
    { href: '#dzisiaj', label: 'Dzisiaj' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header z nawigacją */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container-custom mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.a
              href="/"
              className="flex items-center space-x-2 text-primary hover:text-primary/80"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Powrót</span>
            </motion.a>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-primary transition-colors text-sm font-medium"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="container-custom mx-auto px-4 py-16">

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Moja droga do kosmetologii
            </motion.h1>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
          </div>

          <div className="space-y-16">
            <motion.section
              id="początki"
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">✨</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Początki pasji</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Moja przygoda z kosmetologią rozpoczęła się już w młodości, kiedy fascynowała mnie 
                pielęgnacja skóry i możliwość pomagania innym w poczuciu się pięknie. To co zaczęło 
                się jako hobby, szybko przekształciło się w prawdziwą pasję życiową.
              </p>
            </motion.section>

            <motion.section
              id="edukacja"
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🎓</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Edukacja i rozwój</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Ukończyłam studia kosmetologiczne, zdobywając pełne uprawnienia do wykonywania zawodu. 
                Nie poprzestałam jednak na podstawowej wiedzy - stale poszerzam swoje kompetencje, 
                uczestnicząc w szkoleniach z najnowszych technik i technologii w branży beauty.
              </p>
            </motion.section>

            <motion.section
              id="specjalizacja"
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">💎</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Specjalizacja</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Specjalizuję się w nowoczesnych zabiegach anti-aging, pielęgnacji skóry problematycznej 
                oraz terapii odmładzającej. Szczególnie bliska jest mi praca z klientkami, które 
                potrzebują indywidualnego podejścia i kompleksowej pielęgnacji.
              </p>
            </motion.section>

            <motion.section
              id="filozofia"
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">💝</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Filozofia pracy</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Wierzę, że każda kobieta zasługuje na to, by czuć się pięknie w swojej skórze. 
                Moje podejście to połączenie profesjonalizmu z empatią - każdy zabieg dostosowuję 
                do indywidualnych potrzeb klientki, dbając o jej komfort i bezpieczeństwo.
              </p>
            </motion.section>

            <motion.section
              id="dzisiaj"
              className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-8 shadow-lg border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🌟</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Dzisiaj</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Dziś prowadzę swój gabinet w Limanowej, gdzie każdego dnia pomagam kobietom 
                odkrywać swoją naturalną urodę. Moja oferta obejmuje nie tylko zabiegi na twarz, 
                ale także profesjonalną pielęgnację dłoni, stóp oraz zabiegi podologiczne.
              </p>
            </motion.section>
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Gotowa na spotkanie?</h3>
              <p className="text-gray-600 mb-6">Zapraszam do mojego gabinetu na profesjonalną konsultację</p>
              <a
                href="/booking"
                className="btn-primary text-lg px-8 py-4 inline-block"
              >
                Umów się na wizytę
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage