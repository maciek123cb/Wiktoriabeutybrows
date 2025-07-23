import { Calendar } from 'lucide-react'
import { API_URL } from '../config'

/**
 * Przycisk do eksportu wizyty do kalendarza
 * @param {Object} props - Właściwości komponentu
 * @param {number} props.appointmentId - ID wizyty do eksportu
 * @param {boolean} props.isAdmin - Czy użytkownik jest administratorem
 * @param {string} props.className - Dodatkowe klasy CSS
 * @returns {JSX.Element} - Komponent przycisku
 */
const CalendarExportButton = ({ appointmentId, isAdmin = false, className = '' }) => {
  const handleExport = () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Musisz być zalogowany, aby eksportować wizyty do kalendarza')
      return
    }

    // Tworzymy URL do eksportu
    const endpoint = isAdmin 
      ? `${API_URL}/api/admin/appointments/${appointmentId}/calendar` 
      : `${API_URL}/api/user/appointments/${appointmentId}/calendar`
    
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
      className={`flex items-center space-x-1 text-blue-600 hover:text-blue-800 ${className}`}
      title="Eksportuj do kalendarza"
    >
      <Calendar className="w-4 h-4" />
      <span>Dodaj do kalendarza</span>
    </button>
  )
}

export default CalendarExportButton