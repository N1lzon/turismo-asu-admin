import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { checkBackendStatus } from '../api/status'
import { fetchLastCommit } from '../api/github'
import { API_URL } from '../api/config'
import './DashboardPage.css'

const CATEGORY_LABELS = {
  gastronomia: 'Gastronomía',
  hoteles: 'Hoteles',
  lugares: 'Lugares',
}

const REPOS = [
  { owner: 'N1lzon', repo: 'turismo-asu-frontend', label: 'Frontend' },
  { owner: 'N1lzon', repo: 'turismo-asu-backend', label: 'Backend' },
  { owner: 'N1lzon', repo: 'turismo-asu-admin', label: 'Admin' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function RepoCard({ owner, repo, label }) {
  const [commit, setCommit] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchLastCommit(owner, repo)
      .then(setCommit)
      .catch(() => setError(true))
  }, [owner, repo])

  return (
    <div className="repo-card">
      <div className="repo-card-header">
        <span className="repo-label">{label}</span>
        <a
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="repo-link"
        >
          {owner}/{repo}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {error ? (
        <p className="repo-error">No se pudo obtener el repositorio</p>
      ) : commit === null ? (
        <p className="repo-loading">Cargando…</p>
      ) : (
        <>
          <a href={commit.url} target="_blank" rel="noopener noreferrer" className="commit-message">
            {commit.message}
          </a>
          <div className="commit-meta">
            <span className="commit-sha">{commit.sha}</span>
            <span className="commit-dot">·</span>
            <span>{commit.author}</span>
            <span className="commit-dot">·</span>
            <span>{timeAgo(commit.date)}</span>
          </div>
        </>
      )}
    </div>
  )
}

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

  useEffect(() => { check() }, [check])

  return (
    <div className="dashboard">

      {/* ── Backend status ────────────────── */}
      <div className="status-card">
        <div className="status-card-header">
          <h2 className="status-card-title">Estado del backend</h2>
          <span className="status-url">{API_URL}</span>
        </div>

        <div className="status-row">
          {status === null || loading ? (
            <>
              <span className="dot dot--checking" />
              <span className="status-label">Verificando…</span>
            </>
          ) : status.online ? (
            <>
              <span className="dot dot--online" />
              <span className="status-label">En línea</span>
              <span className="status-latency">{status.latency} ms</span>
            </>
          ) : (
            <>
              <span className="dot dot--offline" />
              <span className="status-label">Sin conexión</span>
            </>
          )}
        </div>

        {status?.online && status?.total !== null && (
          <div className="status-details">
            <div className="detail-row">
              <span className="detail-key">Total registros</span>
              <span className="detail-val">{status.total}</span>
            </div>
            {status.counts && Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div className="detail-row detail-row--sub" key={key}>
                <span className="detail-key">{label}</span>
                <span className="detail-val">{status.counts[key] ?? 0}</span>
              </div>
            ))}
            {status.statusCode && (
              <div className="detail-row">
                <span className="detail-key">HTTP status</span>
                <span className="detail-val">{status.statusCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="status-footer">
          {checkedAt && !loading && (
            <span className="status-time">
              Verificado a las {checkedAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button className="status-refresh-btn" onClick={check} disabled={loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Repo cards ────────────────────── */}
      <div className="repos-column">
        {REPOS.map(r => <RepoCard key={r.repo} {...r} />)}
      </div>

    </div>
  )
}
