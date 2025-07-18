import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const Testimonials = ({ user }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/reviews?limit=3')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Błąd pobierania opinii:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'fill-primary text-primary' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <section id="opinie" className="section-padding bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container-custom mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Opinie klientów
          </h2>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Brak opinii do wyświetlenia</p>
            {user && (
              <Link to="/reviews">
                <button className="btn-primary flex items-center space-x-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  <span>Dodaj pierwszą opinię</span>
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  className="bg-white rounded-2xl p-8 shadow-lg"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex mb-4">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                  <div className="font-semibold text-gray-800">
                    - {review.first_name} {review.last_name}
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
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/reviews">
                  <motion.button
                    className="btn-primary text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Zobacz więcej opinii
                  </motion.button>
                </Link>
                {user && (
                  <Link to="/reviews">
                    <motion.button
                      className="btn-secondary text-lg flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dodaj opinię</span>
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}

export default Testimonials