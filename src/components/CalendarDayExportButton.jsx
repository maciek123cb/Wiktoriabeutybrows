import { Calendar } from 'lucide-react'
import { API_URL } from '../config'

/**
 * Przycisk do eksportu wszystkich wizyt z danego dnia do kalendarza
 * @param {Object} props - Właściwości komponentu
 * @param {string} props.date - Data w formacie YYYY-MM-DD
 * @param {string} props.className - Dodatkowe klasy CSS
 * @returns {JSX.Element} - Komponent przycisku
 */
const CalendarDayExportButton = ({ date, className = '' }) => {
  const handleExport = () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Musisz być zalogowany jako administrator, aby eksportować wizyty do kalendarza')
      return
    }

    // Tworzymy URL do eksportu
    const endpoint = `${API_URL}/api/admin/calendar/day/${date}`
    
    // Otwieramy URL w nowym oknie
    const exportWindow = window.open(endpoint + `?token=${token}`, '_blank')
    
    // Jeśli okno zostało zablokowane, informujemy użytkownika
    if (!exportWindow) {
      alert('Eksport został zablokowany przez przeglądarkę. Sprawdź ustawienia blokowania wyskakujących okienek.')
    }
  }

  return (
    <button
      onClick={handleExport}
      className={`flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      title={`Eksportuj wszystkie wizyty z dnia ${date} do kalendarza`}
    >
      <Calendar className="w-4 h-4" />
      <span>Eksportuj dzień do kalendarza</span>
    </button>
  )
}

export default CalendarDayExportButton