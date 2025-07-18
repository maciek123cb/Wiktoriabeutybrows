import { motion } from 'framer-motion'

const Services = ({ onViewAllServices }) => {
  const services = [
    {
      icon: '✨',
      title: 'Oczyszczanie twarzy',
      description: 'Głębokie oczyszczanie i detoksykacja skóry',
      image: '/images/oczyszczanietwarzy.png'
    },
    {
      icon: '💆',
      title: 'Mezoterapia',
      description: 'Odmładzanie i nawilżanie skóry',
      image: '/images/mezoterapia.png'
    },
    {
      icon: '🌟',
      title: 'Peeling chemiczny',
      description: 'Wygładzanie i rozjaśnianie skóry',
      image: '/images/peeling.png'
    },
    {
      icon: '🦶',
      title: 'Podologia',
      description: 'Profesjonalna pielęgnacja stóp',
      image: '/images/pedicure.png'
    }
  ]

  return (
    <section id="oferta" className="section-padding bg-gray-50">
      <div className="container-custom mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Najpopularniejsze zabiegi
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="relative bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              {service.image && (
                <>
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />
                  <div className="absolute inset-0 bg-white/85" />
                </>  
              )}
              <div className="relative z-10">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={onViewAllServices}
            className="btn-primary text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Zobacz całą ofertę
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default Services