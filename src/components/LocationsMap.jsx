import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationsMap.css'

const ASU_CENTER = [-25.2867, -57.647]

function parsePoints(value) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function markerRadius(weight) {
  return Math.max(7, Math.min(24, Math.sqrt(weight) * 2.4))
}

function MapClickHandler({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5))
    },
  })
  return null
}

export default function LocationsMap({ value, onChange }) {
  const [points, setPoints] = useState(() => parsePoints(value))

  function commit(next) {
    setPoints(next)
    onChange(JSON.stringify(next, null, 2))
  }

  function handleAdd(lat, lng) {
    commit([...points, { lat, lng, weight: 1 }])
  }

  function handleWeightChange(idx, w) {
    const next = [...points]
    next[idx] = { ...next[idx], weight: Math.max(1, +w || 1) }
    commit(next)
  }

  function handleRemove(idx) {
    commit(points.filter((_, i) => i !== idx))
  }

  return (
    <div className="lmap-wrapper">
      <p className="lmap-hint">
        Clic en el mapa para agregar un punto · Clic en un punto para quitarlo
      </p>

      <div className="lmap-container">
        <MapContainer center={ASU_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onAdd={handleAdd} />
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={markerRadius(p.weight)}
              pathOptions={{
                color: '#B84D2F',
                fillColor: '#DD613B',
                fillOpacity: 0.75,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="lmap-popup">
                  <span className="lmap-popup-title">Punto #{i + 1}</span>
                  <span className="lmap-popup-coord">{p.lat}, {p.lng}</span>
                  <button
                    className="lmap-popup-remove"
                    type="button"
                    onClick={() => handleRemove(i)}
                  >
                    Quitar punto
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {points.length === 0 ? (
        <p className="lmap-empty">Sin puntos. Hacé clic en el mapa para agregar.</p>
      ) : (
        <table className="lmap-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Cantidad de búsquedas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td className="lmap-td-n">{i + 1}</td>
                <td className="lmap-td-coord">{p.lat}</td>
                <td className="lmap-td-coord">{p.lng}</td>
                <td>
                  <input
                    className="lmap-weight-input"
                    type="number"
                    min="1"
                    value={p.weight}
                    onChange={e => handleWeightChange(i, e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="lmap-remove-btn"
                    type="button"
                    onClick={() => handleRemove(i)}
                    title="Quitar punto"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
