import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import { API_URL } from '../config';

const MetamorphosisModal = ({ isOpen, onClose }) => {
  const [metamorphoses, setMetamorphoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMetamorphoses();
    }
  }, [isOpen]);

  const fetchMetamorphoses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/metamorphoses`);
      const data = await response.json();
      setMetamorphoses(data.metamorphoses || []);
    } catch (error) {
      console.error('Błąd pobierania metamorfoz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Galeria Metamorfoz</h2>
          <button
            onClick={() => {
              onClose();
              window.history.pushState({}, '', '/');
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : metamorphoses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {metamorphoses.map((metamorphosis) => (
                <div key={metamorphosis.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                      {metamorphosis.treatment_name}
                    </h3>
                    
                    <div className="aspect-square mb-4">
                      <ReactCompareImage
                        leftImage={metamorphosis.before_image}
                        rightImage={metamorphosis.after_image}
                        leftImageLabel="Przed"
                        rightImageLabel="Po"
                        sliderLineColor="#ec4899"
                        sliderButtonColor="#ec4899"
                        hover={true}
                      />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Przesuń suwak, aby zobaczyć różnicę
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak dostępnych metamorfoz</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={() => {
              onClose();
              window.history.pushState({}, '', '/');
            }}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MetamorphosisModal;