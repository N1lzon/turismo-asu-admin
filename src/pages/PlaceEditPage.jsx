import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchPlace, updatePlace, deletePlace, uploadPhoto, deletePhoto } from '../api/places'
import './PlaceEditPage.css'

const CATEGORIES = [
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'hoteles',     label: 'Hoteles' },
  { value: 'lugares',     label: 'Lugares' },
]

function toForm(place) {
  return {
    name:          place.name ?? '',
    category:      place.category ?? 'gastronomia',
    address:       place.address ?? '',
    phone:         place.phone ?? '',
    website:       place.website ?? '',
    rating:        place.rating ?? '',
    total_ratings: place.total_ratings ?? '',
    lat:           place.lat ?? '',
    lng:           place.lng ?? '',
  }
}

export default function PlaceEditPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [place, setPlace]     = useState(null)
  const [form, setForm]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fileRef = useRef(null)

  useEffect(() => {
    fetchPlace(token, id)
      .then(p => { setPlace(p); setForm(toForm(p)) })
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
      const body = {
        name:     form.name,
        category: form.category,
        address:  form.address  || null,
        phone:    form.phone    || null,
        website:  form.website  || null,
        rating:        form.rating        !== '' ? parseFloat(form.rating)        : null,
        total_ratings: form.total_ratings !== '' ? parseInt(form.total_ratings)   : null,
      }
      if (form.lat !== '' && form.lng !== '') {
        body.lat = parseFloat(form.lat)
        body.lng = parseFloat(form.lng)
      }
      await updatePlace(token, id, body)
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${place.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deletePlace(token, id)
      navigate('/lugares', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await uploadPhoto(token, id, file)
      setPlace(p => ({ ...p, photos: [...p.photos, url] }))
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDeletePhoto(url) {
    if (!window.confirm('¿Eliminar esta foto?')) return
    try {
      await deletePhoto(token, id, url)
      setPlace(p => ({ ...p, photos: p.photos.filter(u => u !== url) }))
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <p className="state-msg">Cargando…</p>
  if (!form)   return <p className="state-msg state-msg--error">{error ?? 'Lugar no encontrado'}</p>

  return (
    <div className="edit-page">

      {/* ── Header ────────────────────────────────── */}
      <div className="edit-header">
        <button className="back-btn" onClick={() => navigate('/lugares')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Lugares
        </button>

        <h1 className="edit-title">{place.name}</h1>

        <div className="edit-actions">
          {place.lat && place.lng && (
            <a
              className="btn-map"
              href={`https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.lat},${place.lng},17z`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Ver en mapa
            </a>
          )}
          <button className="btn-delete" onClick={handleDelete}>Eliminar</button>
          <button className="btn-save" onClick={handleSave} disabled={saving} form="edit-form">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {error   && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">Cambios guardados.</div>}

      <div className="edit-grid">

        {/* ── Form ──────────────────────────────────── */}
        <div className="edit-col">
          <form id="edit-form" className="edit-card" onSubmit={handleSave}>
            <p className="card-title">Información</p>

            <div className="field-row">
              <div className="field field--grow">
                <label>Nombre</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="field">
                <label>Categoría</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Dirección</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Opcional" />
            </div>

            <div className="field-row">
              <div className="field field--grow">
                <label>Teléfono</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Opcional" />
              </div>
              <div className="field field--grow">
                <label>Sitio web</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="Opcional" type="url" />
              </div>
            </div>

            <p className="card-title" style={{ marginTop: 8 }}>Ubicación y métricas</p>

            <div className="field-row">
              <div className="field field--grow">
                <label>Latitud</label>
                <input value={form.lat} onChange={e => set('lat', e.target.value)} type="number" step="any" placeholder="ej. -25.2867" />
              </div>
              <div className="field field--grow">
                <label>Longitud</label>
                <input value={form.lng} onChange={e => set('lng', e.target.value)} type="number" step="any" placeholder="ej. -57.647" />
              </div>
            </div>

            <div className="field-row">
              <div className="field field--grow">
                <label>Rating</label>
                <input value={form.rating} onChange={e => set('rating', e.target.value)} type="number" step="0.1" min="0" max="5" placeholder="0.0 – 5.0" />
              </div>
              <div className="field field--grow">
                <label>Total de valoraciones</label>
                <input value={form.total_ratings} onChange={e => set('total_ratings', e.target.value)} type="number" min="0" placeholder="0" />
              </div>
            </div>
          </form>
        </div>

        {/* ── Photos ────────────────────────────────── */}
        <div className="edit-col">
          <div className="edit-card">
            <p className="card-title">Fotos</p>

            <div className="photo-grid">
              {place.photos.map(url => (
                <div key={url} className="photo-item">
                  <img src={url} alt="" />
                  <button
                    className="photo-delete"
                    onClick={() => handleDeletePhoto(url)}
                    title="Eliminar foto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                className="photo-upload-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  '…'
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="file-input"
                onChange={handleUpload}
              />
            </div>

            {place.photos.length === 0 && !uploading && (
              <p className="no-photos">Sin fotos</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
