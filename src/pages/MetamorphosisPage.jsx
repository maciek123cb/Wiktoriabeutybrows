import React, { useState, useEffect } from 'react';
import ReactCompareImage from 'react-compare-image';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { API_URL } from '../config';

const MetamorphosisPage = () => {
  const [metamorphoses, setMetamorphoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetamorphoses();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Przycisk powrotu */}
      <div className="fixed top-4 left-4 z-50">
        <a
          href="/"
          className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Powrót do menu głównego</span>
        </a>
      </div>
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Galeria Metamorfoz
            </h1>
            <p className="text-xl max-w-3xl mx-auto">
              Odkryj niesamowite przemiany naszych klientek. Każda metamorfoza to dowód na to, 
              że piękno może być jeszcze piękniejsze.
            </p>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 text-lg">Ładowanie metamorfoz...</p>
              </div>
            ) : metamorphoses.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Brak metamorfoz
                </h3>
                <p className="text-gray-600">
                  Metamorfozy będą dostępne wkrótce. Zapraszamy ponownie!
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <p className="text-lg text-gray-600">
                    Znaleziono {metamorphoses.length} {metamorphoses.length === 1 ? 'metamorfozę' : 'metamorfoz'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {metamorphoses.map((metamorphosis) => (
                    <div key={metamorphosis.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
                          <p className="text-sm text-gray-500 mb-2">
                            Przesuń suwak, aby zobaczyć różnicę
                          </p>
                          <p className="text-xs text-gray-400">
                            Dodano: {new Date(metamorphosis.created_at).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-pink-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Gotowa na swoją metamorfozę?
            </h2>
            <p className="text-xl mb-8">
              Umów się na konsultację i odkryj swój potencjał piękna
            </p>
            <a
              href="/booking"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-md text-pink-600 bg-white hover:bg-gray-100 transition-colors duration-200"
            >
              Umów wizytę
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MetamorphosisPage;