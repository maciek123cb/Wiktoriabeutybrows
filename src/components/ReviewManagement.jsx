import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Star, Calendar, User } from 'lucide-react'

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:3001/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Błąd pobierania opinii:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę opinię?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:3001/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      
      if (data.success) {
        fetchReviews()
        alert(data.message)
      }
    } catch (error) {
      alert('Błąd połączenia z serwerem')
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Zarządzanie opiniami</h3>
        <div className="text-sm text-gray-600">
          Łącznie: {reviews.length} opinii
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Brak opinii do wyświetlenia</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ocena</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Komentarz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map(review => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.first_name} {review.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{review.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-gray-900 line-clamp-3">{review.comment}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(review.created_at).toLocaleDateString('pl-PL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Usuń opinię"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewManagement