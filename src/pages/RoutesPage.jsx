import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchRoutes, createRoute } from '../api/routes'
import './PlacesPage.css'
import './RoutesPage.css'

export default function RoutesPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    fetchRoutes(token)
      .then(setRoutes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return routes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q)
    )
  }, [routes, search])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreateError(null)
    setCreating(true)
    try {
      const { id } = await createRoute(token, { name: newName.trim() })
      navigate(`/rutas/${id}`)
    } catch (e) {
      setCreateError(e.message)
      setCreating(false)
    }
  }

  return (
    <div className="places-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rutas</h1>
          {!loading && !error && (
            <p className="page-subtitle">{filtered.length} de {routes.length} registros</p>
          )}
        </div>
        <form className="create-form" onSubmit={handleCreate}>
          <input
            className="create-input"
            placeholder="Nombre de nueva ruta…"
            value={newName}
            onChange={e => { setNewName(e.target.value); setCreateError(null) }}
          />
          <button className="btn-create" type="submit" disabled={creating || !newName.trim()}>
            {creating ? '…' : 'Nueva ruta'}
          </button>
          {createError && <span className="create-error">{createError}</span>}
        </form>
      </div>

      <div className="toolbar">
        <div className="search-wrapper">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar por nombre o descripción…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="state-msg">Cargando…</p>}
      {error   && <p className="state-msg state-msg--error">Error: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="state-msg">No se encontraron resultados.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="table-wrapper">
          <table className="places-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Hora inicio</th>
                <th>Lugares</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(route => (
                <tr key={route.id} className="tr-clickable" onClick={() => navigate(`/rutas/${route.id}`)}>
                  <td>
                    <div className="route-name-cell">
                      <span className="place-name">{route.name}</span>
                      {route.is_preset && <span className="badge badge--preset">Predefinida</span>}
                    </div>
                  </td>
                  <td className="td-address">
                    {route.description ?? <span className="no-data">—</span>}
                  </td>
                  <td className="td-phone">
                    {route.start_time
                      ? route.start_time.slice(0, 5)
                      : <span className="no-data">—</span>}
                  </td>
                  <td>
                    {route.places?.length != null
                      ? <span className="route-count">{route.places.length}</span>
                      : <span className="no-data">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
