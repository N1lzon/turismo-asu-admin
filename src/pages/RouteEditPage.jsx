import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchRoute, updateRoute, deleteRoute } from '../api/routes'
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
  }
}

export default function RouteEditPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [route, setRoute]   = useState(null)
  const [form, setForm]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchRoute(token, id)
      .then(r => { setRoute(r); setForm(toForm(r)) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, id])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
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

  const places = route.places ?? []

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
          </form>
        </div>

        <div className="edit-col">
          <div className="edit-card">
            <p className="card-title">Lugares en esta ruta ({places.length})</p>

            {places.length === 0 ? (
              <p className="no-photos">Sin lugares asignados</p>
            ) : (
              <ul className="route-places-list">
                {places.map((p, i) => (
                  <li key={p.id} className="route-place-item">
                    <span className="route-place-order">{i + 1}</span>
                    <span className="route-place-name">{p.name}</span>
                    <CategoryBadge category={p.category} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
