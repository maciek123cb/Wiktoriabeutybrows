import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import AdminPanel from '../pages/AdminPanel'

const AdminPanelModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="px-4 pb-6">
            <AdminPanel 
              user={user} 
              onLogout={() => {
                // Zamiast bezpośrednio wylogowywać, używamy funkcji onClose
                // aby najpierw zamknąć modal, a potem obsłużyć wylogowanie w App.jsx
                onClose();
              }}
              isModal={true}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminPanelModal