import { motion } from 'framer-motion'

const About = ({ onLearnMore }) => {
  return (
    <section id="o-mnie" className="section-padding bg-white">
      <div className="container-custom mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            O mnie
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Jestem dyplomowanym kosmetologiem z uprawnieniami po studiach. 
              Specjalizuję się w nowoczesnych zabiegach anti-aging, pielęgnacji 
              skóry problematycznej oraz terapii odmładzającej.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              W mojej ofercie znajdziesz także zabiegi manicure, pedicure oraz 
              podologiczne – profesjonalną pielęgnację stóp, również w przypadku 
              zmian problematycznych.
            </p>
            <motion.button
              className="btn-secondary"
              onClick={onLearnMore}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Poznaj moją historię
            </motion.button>
          </motion.div>
          
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl overflow-hidden h-80 shadow-lg">
              <img 
                src="/images/kosmetolog.jpeg" 
                alt="Kosmetolog Wiktoria" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About