import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const Blog = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestArticles()
  }, [])

  const fetchLatestArticles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/articles?limit=3')
      const data = await response.json()
      console.log('Pobrane artykuły:', data)
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Błąd pobierania artykułów:', error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section id="poradnik" className="section-padding bg-white">
      <div className="container-custom mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Najnowsze porady
          </h2>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Brak artykułów do wyświetlenia</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                {article.image_url && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-primary font-medium">{article.category}</span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                  <Link
                    to={`/blog/${article.slug}`}
                    className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Czytaj więcej
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link to="/blog">
            <motion.button
              className="btn-primary text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Zobacz wszystkie poradniki
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default Blog