import { motion } from 'framer-motion'

const CTA = ({ onBookAppointment }) => {
  return (
    <section id="rezerwacja" className="section-padding bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container-custom mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Gotowa na zmianę?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Zarezerwuj wizytę już dziś i poczuj różnicę
          </p>
          <motion.button
            className="btn-primary text-xl py-4 px-8"
            onClick={onBookAppointment}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Zarezerwuj wizytę
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA