import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchRoute, updateRoute, deleteRoute } from '../api/routes'
import { fetchPlaces } from '../api/places'
import './PlacesPage.css'
import './PlaceEditPage.css'
import './RouteEditPage.css'

const CATEGORY_META = {
  gastronomia: { label: 'Gastronomía', className: 'badge--gastro' },
  hoteles:     { label: 'Hoteles',     className: 'badge--hotel' },
  lugares:     { label: 'Lugares',     className: 'badge--lugar' },
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] ?? { label: category, className: '' }
  return <span className={`badge ${meta.className}`}>{meta.label}</span>
}

function toForm(route) {
  return {
    name:        route.name ?? '',
    description: route.description ?? '',
    is_preset:   route.is_preset ?? false,
    start_time:  route.start_time ? route.start_time.slice(0, 5) : '',
  }
}

export default function RouteEditPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [route, setRoute]           = useState(null)
  const [form, setForm]             = useState(null)
  const [placesInRoute, setPlacesInRoute] = useState([])
  const [allPlaces, setAllPlaces]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(false)
  const [search, setSearch]         = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    Promise.all([fetchRoute(token, id), fetchPlaces(token)])
      .then(([r, places]) => {
        setRoute(r)
        setForm(toForm(r))
        setPlacesInRoute(r.places ?? [])
        setAllPlaces(places)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, id])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setSuccess(false)
  }

  const available = useMemo(() => {
    const inRouteIds = new Set(placesInRoute.map(p => p.id))
    const q = search.toLowerCase()
    return allPlaces.filter(p =>
      !inRouteIds.has(p.id) &&
      (p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q))
    )
  }, [allPlaces, placesInRoute, search])

  function handleAdd() {
    const place = allPlaces.find(p => p.id === parseInt(selectedId))
    if (!place) return
    setPlacesInRoute(prev => [...prev, place])
    setSelectedId('')
    setSearch('')
    setSuccess(false)
  }

  function handleRemove(placeId) {
    setPlacesInRoute(prev => prev.filter(p => p.id !== placeId))
    setSuccess(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await updateRoute(token, id, {
        name:        form.name,
        description: form.description || null,
        is_preset:   form.is_preset,
        start_time:  form.start_time || null,
        place_ids:   placesInRoute.map(p => p.id),
      })
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${route.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteRoute(token, id)
      navigate('/rutas', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <p className="state-msg">Cargando…</p>
  if (!form)   return <p className="state-msg state-msg--error">{error ?? 'Ruta no encontrada'}</p>

  return (
    <div className="edit-page">

      <div className="edit-header">
        <button className="back-btn" onClick={() => navigate('/rutas')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Rutas
        </button>

        <h1 className="edit-title">{route.name}</h1>

        <div className="edit-actions">
          <button className="btn-delete" onClick={handleDelete}>Eliminar</button>
          <button className="btn-save" onClick={handleSave} disabled={saving} form="route-form">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {error   && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">Cambios guardados.</div>}

      <div className="edit-grid route-grid">

        {/* ── Info form ── */}
        <div className="edit-col">
          <form id="route-form" className="edit-card" onSubmit={handleSave}>
            <p className="card-title">Información</p>

            <div className="field">
              <label>Nombre</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="field">
              <label>Descripción</label>
              <textarea
                className="route-textarea"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Opcional"
                rows={4}
              />
            </div>

            <div className="field">
              <label>Hora de inicio recomendada</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => set('start_time', e.target.value)}
              />
            </div>

            <label className="route-preset-toggle">
              <input
                type="checkbox"
                checked={form.is_preset}
                onChange={e => set('is_preset', e.target.checked)}
              />
              Ruta predefinida de la app
            </label>
          </form>
        </div>

        {/* ── Places panel ── */}
        <div className="edit-col">
          <div className="edit-card">
            <p className="card-title">Lugares en esta ruta ({placesInRoute.length})</p>

            {/* Current places list */}
            {placesInRoute.length === 0 ? (
              <p className="no-photos">Sin lugares asignados</p>
            ) : (
              <ul className="route-places-list">
                {placesInRoute.map((p, i) => (
                  <li key={p.id} className="route-place-item">
                    <span className="route-place-order">{i + 1}</span>
                    <span className="route-place-id">#{p.id}</span>
                    <span className="route-place-name">{p.name}</span>
                    <CategoryBadge category={p.category} />
                    <button
                      className="route-place-remove"
                      onClick={() => handleRemove(p.id)}
                      title="Quitar de la ruta"
                      type="button"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add place */}
            <div className="route-add-section">
              <p className="card-title" style={{ marginBottom: 6 }}>Agregar lugar</p>
              <input
                className="route-search-input"
                placeholder="Buscar lugar…"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedId('') }}
              />
              {search && available.length > 0 && (
                <ul className="route-suggestions">
                  {available.slice(0, 8).map(p => (
                    <li
                      key={p.id}
                      className={`route-suggestion-item${selectedId === String(p.id) ? ' selected' : ''}`}
                      onClick={() => setSelectedId(String(p.id))}
                    >
                      <span className="route-place-name">{p.name}</span>
                      <CategoryBadge category={p.category} />
                    </li>
                  ))}
                </ul>
              )}
              {search && available.length === 0 && (
                <p className="route-no-results">Sin resultados</p>
              )}
              <button
                className="route-add-btn"
                type="button"
                onClick={handleAdd}
                disabled={!selectedId}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
