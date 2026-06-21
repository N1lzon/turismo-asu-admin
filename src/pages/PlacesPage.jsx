import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchPlaces } from '../api/places'
import './PlacesPage.css'

const CATEGORY_META = {
  gastronomia: { label: 'Gastronomía', className: 'badge--gastro' },
  hoteles:     { label: 'Hoteles',     className: 'badge--hotel' },
  lugares:     { label: 'Lugares',     className: 'badge--lugar' },
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] ?? { label: category, className: '' }
  return <span className={`badge ${meta.className}`}>{meta.label}</span>
}

function StarRating({ rating, total }) {
  if (rating == null) return <span className="no-data">—</span>
  return (
    <span className="rating">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {Number(rating).toFixed(1)}
      {total != null && <span className="rating-total">({total})</span>}
    </span>
  )
}

export default function PlacesPage() {
  const { token } = useAuth()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchPlaces(token)
      .then(setPlaces)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return places.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q)
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter
      return matchSearch && matchCat
    })
  }, [places, search, categoryFilter])

  return (
    <div className="places-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lugares</h1>
          {!loading && !error && (
            <p className="page-subtitle">{filtered.length} de {places.length} registros</p>
          )}
        </div>
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
            placeholder="Buscar por nombre o dirección…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="cat-filter"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          <option value="gastronomia">Gastronomía</option>
          <option value="hoteles">Hoteles</option>
          <option value="lugares">Lugares</option>
        </select>
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
                <th>Categoría</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(place => (
                <tr key={place.id}>
                  <td className="td-name">
                    <span className="place-name">{place.name}</span>
                    {place.website && (
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="place-web" title={place.website}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </td>
                  <td><CategoryBadge category={place.category} /></td>
                  <td className="td-address">
                    {place.address ?? <span className="no-data">—</span>}
                  </td>
                  <td className="td-phone">
                    {place.phone ?? <span className="no-data">—</span>}
                  </td>
                  <td>
                    <StarRating rating={place.rating} total={place.total_ratings} />
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
