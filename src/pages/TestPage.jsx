import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchNearbyPlaces } from '../api/places'
import PlaceEditModal from './PlaceEditModal'
import './TestPage.css'

const ASU_CENTER = [-25.2867, -57.6473]
const DEFAULT_RADIUS_M = 500
const MIN_RADIUS_M = 100
const MAX_RADIUS_M = 3000

const CATEGORY_META = {
  gastronomia: { label: 'Gastronomía', className: 'tp-badge--gastro' },
  hoteles:     { label: 'Hoteles',     className: 'tp-badge--hotel' },
  lugares:     { label: 'Lugares',     className: 'tp-badge--lugar' },
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] ?? { label: category, className: '' }
  return <span className={`tp-badge ${meta.className}`}>{meta.label}</span>
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function TestPage() {
  const [point, setPoint] = useState(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_M)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const loadNearby = useCallback((lat, lng, r) => {
    setLoading(true)
    setError(null)
    fetchNearbyPlaces(lat, lng, r)
      .then(setPlaces)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!point) return
    const t = setTimeout(() => loadNearby(point.lat, point.lng, radius), 300)
    return () => clearTimeout(t)
  }, [point, radius, loadNearby])

  function handlePick(lat, lng) {
    setPoint({ lat, lng })
  }

  function refresh() {
    if (point) loadNearby(point.lat, point.lng, radius)
  }

  return (
    <div className="tp-page">
      <div className="tp-header">
        <h1 className="tp-title">Pruebas</h1>
        <p className="tp-subtitle">
          Hacé clic en el mapa para buscar lugares cercanos al punto
        </p>
      </div>

      <div className="tp-radius-control">
        <label htmlFor="tp-radius-slider">
          Radio de búsqueda: <strong>{radius} m</strong>
        </label>
        <input
          id="tp-radius-slider"
          type="range"
          min={MIN_RADIUS_M}
          max={MAX_RADIUS_M}
          step="50"
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
        />
      </div>

      <div className="tp-map-container">
        <MapContainer center={ASU_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />

          {point && (
            <>
              <Circle
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{ color: '#DD613B', fillColor: '#DD613B', fillOpacity: 0.08, weight: 1.5 }}
              />
              <CircleMarker
                center={[point.lat, point.lng]}
                radius={7}
                pathOptions={{ color: '#B84D2F', fillColor: '#DD613B', fillOpacity: 0.9, weight: 1.5 }}
              >
                <Popup>
                  Punto de búsqueda<br />
                  {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                </Popup>
              </CircleMarker>
            </>
          )}

          {places.map(p => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{ color: '#1D4ED8', fillColor: '#60A5FA', fillOpacity: 0.85, weight: 1.5 }}
            >
              <Popup>
                <div className="tp-popup">
                  <strong>{p.name}</strong>
                  <span>{Math.round(p.distance_meters)} m</span>
                  <button className="tp-popup-edit" onClick={() => setEditingId(p.id)}>
                    Editar
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {!point && <p className="tp-state-msg">Sin punto seleccionado todavía.</p>}
      {point && loading && <p className="tp-state-msg">Buscando lugares cercanos…</p>}
      {point && error && <p className="tp-state-msg tp-state-msg--error">Error: {error}</p>}

      {point && !loading && !error && (
        <>
          <p className="tp-results-count">
            {places.length} lugar{places.length === 1 ? '' : 'es'} dentro de {radius} m
          </p>

          {places.length > 0 && (
            <div className="tp-table-wrapper">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Distancia</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map(p => (
                    <tr key={p.id} className="tp-row-clickable" onClick={() => setEditingId(p.id)}>
                      <td><span className="tp-place-name">{p.name}</span></td>
                      <td><CategoryBadge category={p.category} /></td>
                      <td className="tp-td-dist">{Math.round(p.distance_meters)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editingId != null && (
        <PlaceEditModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={refresh}
          onDeleted={refresh}
        />
      )}
    </div>
  )
}
