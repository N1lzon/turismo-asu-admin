import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { checkBackendStatus } from '../api/status'
import { API_URL } from '../api/config'
import './DashboardPage.css'

export default function DashboardPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkedAt, setCheckedAt] = useState(null)

  const check = useCallback(async () => {
    setLoading(true)
    const result = await checkBackendStatus(token)
    setStatus(result)
    setCheckedAt(new Date())
    setLoading(false)
  }, [token])

  useEffect(() => {
    check()
  }, [check])

  return (
    <div className="dashboard">
      <div className="status-card">
        <div className="status-card-header">
          <h2 className="status-card-title">Estado del backend</h2>
          <span className="status-url">{API_URL}</span>
        </div>

        <div className="status-body">
          {status === null || loading ? (
            <div className="status-row">
              <span className="dot dot--checking" />
              <span className="status-label">Verificando…</span>
            </div>
          ) : status.online ? (
            <div className="status-row">
              <span className="dot dot--online" />
              <span className="status-label">En línea</span>
              <span className="status-latency">{status.latency} ms</span>
            </div>
          ) : (
            <div className="status-row">
              <span className="dot dot--offline" />
              <span className="status-label">Sin conexión</span>
            </div>
          )}

          {checkedAt && !loading && (
            <p className="status-time">
              Verificado a las{' '}
              {checkedAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

        <button className="status-refresh-btn" onClick={check} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Actualizar
        </button>
      </div>
    </div>
  )
}
