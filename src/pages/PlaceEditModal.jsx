import { useEffect } from 'react'
import PlaceEditForm from './PlaceEditForm'
import './PlaceEditModal.css'

export default function PlaceEditModal({ id, onClose, onDeleted, onSaved }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="pem-overlay" onClick={onClose}>
      <div className="pem-panel" onClick={e => e.stopPropagation()}>
        <button className="pem-close" onClick={onClose} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <PlaceEditForm
          id={id}
          backLabel="Cerrar"
          onBack={onClose}
          onSaved={onSaved}
          onDeleted={() => { onDeleted?.(); onClose() }}
        />
      </div>
    </div>
  )
}
