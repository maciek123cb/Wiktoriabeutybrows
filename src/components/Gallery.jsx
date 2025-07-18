import { motion } from 'framer-motion'

const Gallery = () => {
  const galleryItems = [
    {
      title: 'Zabieg oczyszczający + mezoterapia',
      before: 'PRZED',
      after: 'PO'
    },
    {
      title: 'Peeling chemiczny + nawilżanie',
      before: 'PRZED',
      after: 'PO'
    },
    {
      title: 'Mikrodermabrazja + serum',
      before: 'PRZED',
      after: 'PO'
    }
  ]

  return (
    <section id="galeria" className="section-padding bg-white">
      <div className="container-custom mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Galeria metamorfoz
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {galleryItems.map((item, index) => (
            <motion.div
              key={index}
              className="group cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="grid grid-cols-2 h-64">
                  <div className="bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-red-600 mb-2">
                        {item.before}
                      </div>
                      <div className="w-16 h-16 bg-red-300/50 rounded-full mx-auto"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600 mb-2">
                        {item.after}
                      </div>
                      <div className="w-16 h-16 bg-green-300/50 rounded-full mx-auto"></div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 text-center">
                    {item.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Gallery