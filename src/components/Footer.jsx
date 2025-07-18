import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react'

const Footer = () => {
  return (
    <footer id="kontakt" className="bg-gray-900 text-white section-padding">
      <div className="container-custom mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-6 text-primary">Kontakt</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div>Limanowa ul. Bednarczyka 34/10</div>
                  <div>Barcice ul. Wiejska 33-342</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <span>+48 532 128 227</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <span>kontakt@WiktoriaBeauty.pl</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-6 text-primary">Godziny otwarcia</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div>Pon-Pt: 9:00 - 18:00</div>
                  <div>Sobota: 9:00 - 15:00</div>
                  <div>Niedziela: zamknięte</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-6 text-primary">Znajdź nas</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <motion.a
                  href="#"
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/wiktoriabeauty_brows/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </motion.a>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 h-48">
                <iframe 
                  src="https://www.google.com/maps?q=Limanowa+Bednarczyka+34/10+Beauty+skin&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokalizacja gabinetu"
                />
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          className="border-t border-gray-700 pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p>&copy; 2024 Wiktoriabeauty_Brows. Wszystkie prawa zastrzeżone.</p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer