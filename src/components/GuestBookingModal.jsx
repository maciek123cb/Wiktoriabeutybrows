import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock, Phone, Mail } from 'lucide-react'
import { API_URL } from '../config'
import GuestAppointmentSchedule from './GuestAppointmentSchedule'

const GuestBookingModal = ({ isOpen, onClose, selectedDate, selectedTime }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate))
  const [currentTime, setCurrentTime] = useState(selectedTime)

  // Aktualizuj datę i czas, gdy zmienią się propsy
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate))
    }
    if (selectedTime) {
      setCurrentTime(selectedTime)
    }
  }, [selectedDate, selectedTime])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Podgląd terminarza</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Komponent z terminarzem i informacjami dla niezalogowanych */}
          <GuestAppointmentSchedule 
            selectedDate={currentDate} 
            selectedTime={currentTime} 
          />
          
          {/* Przycisk zamknięcia */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default GuestBookingModal