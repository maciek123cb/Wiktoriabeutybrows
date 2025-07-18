import React, { useState, useEffect } from 'react';
import ReactCompareImage from 'react-compare-image';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const MetamorphosisGallery = ({ limit = 3 }) => {
  const [metamorphoses, setMetamorphoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetamorphoses();
  }, []);

  const fetchMetamorphoses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/metamorphoses?limit=${limit}`);
      const data = await response.json();
      setMetamorphoses(data.metamorphoses || []);
    } catch (error) {
      console.error('Błąd pobierania metamorfoz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ładowanie metamorfoz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (metamorphoses.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Galeria Metamorfoz
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zobacz niesamowite przemiany naszych klientek. Każda metamorfoza to historia piękna i pewności siebie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {metamorphoses.map((metamorphosis) => (
            <div key={metamorphosis.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {metamorphosis.treatment_name}
                </h3>
                
                <div className="aspect-square mb-4">
                  <ReactCompareImage
                    leftImage={`${API_URL}${metamorphosis.before_image}`}
                    rightImage={`${API_URL}${metamorphosis.after_image}`}
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

        <div className="text-center mt-12">
          <a
            href="/#metamorfozy"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 transition-colors duration-200"
          >
            Zobacz wszystkie metamorfozy
          </a>
        </div>
      </div>
    </section>
  );
};

export default MetamorphosisGallery;