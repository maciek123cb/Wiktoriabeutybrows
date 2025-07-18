import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, DollarSign, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/services`)
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Błąd pobierania usług:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(services.map(service => service.category))]
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="flex items-center text-gray-600 hover:text-primary mb-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Powrót do strony głównej
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Cennik usług</h1>
              <p className="text-gray-600 mt-2">Poznaj pełną ofertę naszego salonu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtry kategorii */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category === 'all' ? 'Wszystkie' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Lista usług pogrupowana po kategoriach */}
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <motion.div
              key={category}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{category}</h2>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {categoryServices.map(service => (
                    <motion.div
                      key={service.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center text-2xl font-bold text-primary">
                          <span>{service.price}</span>
                          <span className="text-lg ml-1">zł</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informacje dodatkowe */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Informacje dodatkowe</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Płatności</h4>
              <p>Akceptujemy płatności gotówką oraz kartą płatniczą.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Rezerwacje</h4>
              <p>Wizyty można umówić telefonicznie lub przez naszą stronę internetową.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Anulowanie</h4>
              <p>Prosimy o anulowanie wizyt minimum 24 godziny wcześniej.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Konsultacje</h4>
              <p>Oferujemy bezpłatne konsultacje przed każdym zabiegiem.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage