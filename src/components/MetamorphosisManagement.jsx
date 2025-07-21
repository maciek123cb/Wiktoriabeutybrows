import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const MetamorphosisManagement = () => {
  const [metamorphoses, setMetamorphoses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    treatmentName: '',
    beforeImageName: '',
    afterImageName: ''
  });
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState({
    before: [],
    after: []
  });

  useEffect(() => {
    fetchMetamorphoses();
    fetchAvailableImages();
  }, []);
  
  const fetchAvailableImages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/available-images`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableImages(data.images);
      }
    } catch (error) {
      console.error('Błąd pobierania dostępnych obrazów:', error);
    }
  };

  const fetchMetamorphoses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/metamorphoses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMetamorphoses(data.metamorphoses || []);
    } catch (error) {
      console.error('Błąd pobierania metamorfoz:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        treatmentName: formData.treatmentName,
        beforeImageName: formData.beforeImageName,
        afterImageName: formData.afterImageName
      };

      const url = editingId 
        ? `${API_URL}/api/admin/metamorphoses/${editingId}`
        : `${API_URL}/api/admin/metamorphoses`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        setShowForm(false);
        setEditingId(null);
        setFormData({ treatmentName: '', beforeImage: null, afterImage: null });
        fetchMetamorphoses();
      } else {
        alert(result.message || 'Wystąpił błąd');
      }
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (metamorphosis) => {
    setEditingId(metamorphosis.id);
    setFormData({
      treatmentName: metamorphosis.treatment_name,
      beforeImageName: metamorphosis.before_image_name || '',
      afterImageName: metamorphosis.after_image_name || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę metamorfozę?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/metamorphoses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchMetamorphoses();
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Wystąpił błąd podczas usuwania');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Metamorfozami</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ treatmentName: '', beforeImageName: '', afterImageName: '' });
          }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
        >
          {showForm ? 'Anuluj' : 'Dodaj Metamorfozę'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa zabiegu
              </label>
              <input
                type="text"
                value={formData.treatmentName}
                onChange={(e) => setFormData({ ...formData, treatmentName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zdjęcie przed
                </label>
                <select
                  value={formData.beforeImageName}
                  onChange={(e) => setFormData({ ...formData, beforeImageName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Wybierz zdjęcie</option>
                  {availableImages.before.map((image) => (
                    <option key={image.name} value={image.name}>
                      {image.name}
                    </option>
                  ))}
                </select>
                {formData.beforeImageName && (
                  <div className="mt-2">
                    <img 
                      src={availableImages.before.find(img => img.name === formData.beforeImageName)?.url} 
                      alt="Podgląd przed" 
                      className="h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zdjęcie po
                </label>
                <select
                  value={formData.afterImageName}
                  onChange={(e) => setFormData({ ...formData, afterImageName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Wybierz zdjęcie</option>
                  {availableImages.after.map((image) => (
                    <option key={image.name} value={image.name}>
                      {image.name}
                    </option>
                  ))}
                </select>
                {formData.afterImageName && (
                  <div className="mt-2">
                    <img 
                      src={availableImages.after.find(img => img.name === formData.afterImageName)?.url} 
                      alt="Podgląd po" 
                      className="h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : (editingId ? 'Aktualizuj' : 'Dodaj')}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metamorphoses.map((metamorphosis) => (
          <div key={metamorphosis.id} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">{metamorphosis.treatment_name}</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Przed:</p>
                <img
                  src={metamorphosis.before_image}
                  alt="Przed"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Po:</p>
                <img
                  src={metamorphosis.after_image}
                  alt="Po"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(metamorphosis)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 text-sm"
              >
                Edytuj
              </button>
              <button
                onClick={() => handleDelete(metamorphosis.id)}
                className="flex-1 bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 text-sm"
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {metamorphoses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Brak metamorfoz do wyświetlenia
        </div>
      )}
    </div>
  );
};

export default MetamorphosisManagement;