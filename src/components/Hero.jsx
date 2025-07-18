import { motion } from 'framer-motion'

const Hero = ({ onBookAppointment }) => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/poczujsiepieknie.png)' }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 to-purple-50/30" />
      <div className="container-custom mx-auto px-4 text-center relative z-10">
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Poczuj się pięknie
          <span className="block text-primary drop-shadow-lg">w swojej skórze</span>
        </motion.h1>
        
        <motion.p
          className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Profesjonalne zabiegi kosmetyczne dostosowane do Twoich potrzeb
        </motion.p>
        
        <motion.button
          className="btn-primary text-lg"
          onClick={onBookAppointment}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Umów wizytę online
        </motion.button>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
    </section>
  )
}

export default Hero