import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'

const BlogPage = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchArticles()
  }, [selectedCategory])

  const fetchArticles = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? `${API_URL}/api/articles`
        : `${API_URL}/api/articles?category=${selectedCategory}`
      
      const response = await fetch(url)
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Błąd pobierania artykułów:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(articles.map(article => article.category))]

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Poradniki</h1>
              <p className="text-gray-600 mt-2">Poznaj najlepsze porady pielęgnacyjne</p>
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

        {/* Lista artykułów */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Brak artykułów w tej kategorii</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <motion.article
                key={article.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
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
                  <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {article.category}
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <Link
                    to={`/blog/${article.slug}`}
                    className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                  >
                    Czytaj więcej →
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPage