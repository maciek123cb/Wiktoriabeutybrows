import React, { useState, useEffect } from 'react';

const MetamorphosisManagement = () => {
  const [metamorphoses, setMetamorphoses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    treatmentName: '',
    beforeImage: null,
    afterImage: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetamorphoses();
  }, []);

  const fetchMetamorphoses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/admin/metamorphoses', {
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
      const formDataToSend = new FormData();
      formDataToSend.append('treatmentName', formData.treatmentName);
      
      if (formData.beforeImage) {
        formDataToSend.append('beforeImage', formData.beforeImage);
      }
      if (formData.afterImage) {
        formDataToSend.append('afterImage', formData.afterImage);
      }

      const url = editingId 
        ? `http://localhost:3001/api/admin/metamorphoses/${editingId}`
        : 'http://localhost:3001/api/admin/metamorphoses';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
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
      beforeImage: null,
      afterImage: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę metamorfozę?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/admin/metamorphoses/${id}`, {
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
            setFormData({ treatmentName: '', beforeImage: null, afterImage: null });
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
                  Zdjęcie przed {editingId && '(zostaw puste, aby nie zmieniać)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, beforeImage: e.target.files[0] })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required={!editingId}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zdjęcie po {editingId && '(zostaw puste, aby nie zmieniać)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, afterImage: e.target.files[0] })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required={!editingId}
                />
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
                  src={`http://localhost:3001${metamorphosis.before_image}`}
                  alt="Przed"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Po:</p>
                <img
                  src={`http://localhost:3001${metamorphosis.after_image}`}
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