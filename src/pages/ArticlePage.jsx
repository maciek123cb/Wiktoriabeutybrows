import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { API_URL } from '../config'

const ArticlePage = () => {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`${API_URL}/api/articles/${slug}`)
      const data = await response.json()
      
      if (response.ok) {
        setArticle(data.article)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Błąd pobierania artykułu')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Artykuł nie znaleziony</h1>
          <Link to="/blog" className="text-primary hover:text-primary/80">
            Powrót do poradników
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nawigacja */}
        <div className="mb-8">
          <Link to="/blog" className="flex items-center text-gray-600 hover:text-primary mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Powrót do poradników
          </Link>
        </div>

        {/* Artykuł */}
        <motion.article
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Zdjęcie główne */}
          {article.image_url && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Meta informacje */}
            <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(article.created_at)}
              </div>
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {article.category}
                </span>
              </div>
            </div>

            {/* Tytuł */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {article.title}
            </h1>

            {/* Excerpt */}
            <div className="text-lg text-gray-600 mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
              {article.excerpt}
            </div>

            {/* Treść */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </motion.article>

        {/* Powrót */}
        <div className="mt-8 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Powrót do poradników
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ArticlePage