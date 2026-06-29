import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../context/AuthContext'
import { fetchMetrics } from '../api/metrics'
import { fetchPlaces } from '../api/places'
import './ReportsPage.css'

const CATEGORY_LABELS = {
  gastronomia: 'Gastronomía',
  hoteles: 'Hoteles',
  lugares: 'Lugares',
}

function fmtDuration(seg) {
  if (seg == null) return '—'
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return m > 0 ? `${m} min ${s > 0 ? `${s} s` : ''}`.trim() : `${s} s`
}

// ─── SVG chart primitives ─────────────────────────────────────────────────────

function BarChart({ data, yKey, tooltipKey, color = 'var(--tc-500)' }) {
  const W = 600, H = 100
  const max = Math.max(...data.map(d => d[yKey]), 1)
  const n = data.length
  const step = W / n
  const barW = step * 0.62

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block' }}
    >
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={0} y1={H * (1 - p)} x2={W} y2={H * (1 - p)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const h = Math.max(2, (d[yKey] / max) * (H - 2))
        return (
          <rect
            key={i}
            x={i * step + (step - barW) / 2}
            y={H - h}
            width={barW}
            height={h}
            fill={color}
            rx={2}
            opacity={0.82}
          >
            <title>{tooltipKey != null ? `${d[tooltipKey]}: ` : ''}{d[yKey].toLocaleString()}</title>
          </rect>
        )
      })}
    </svg>
  )
}

function LineChart({ data, xKey, yKey, color = 'var(--tc-500)' }) {
  const W = 600, H = 88
  const max = Math.max(...data.map(d => d[yKey]), 1)
  const n = data.length
  if (n < 2) return <p className="rp-no-data">Sin datos</p>

  const pts = data.map((d, i) => ({
    x: (i / (n - 1)) * W,
    y: H - 8 - (d[yKey] / max) * (H - 18),
  }))

  const linePts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPts = [
    `0,${H}`,
    ...pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `${W},${H}`,
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block' }}
    >
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={0} y1={H * (1 - p)} x2={W} y2={H * (1 - p)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <polygon points={areaPts} fill="url(#lc-grad)" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="#fff" strokeWidth="1.5">
          <title>{data[i][xKey]}: {data[i][yKey]}</title>
        </circle>
      ))}
    </svg>
  )
}

function HBarList({ items, nameKey, valueKey, limit }) {
  const list = limit ? items.slice(0, limit) : items
  const max = Math.max(...list.map(i => i[valueKey]), 1)
  return (
    <div className="hbar-list">
      {list.map((item, i) => (
        <div key={i} className="hbar-row">
          <span className="hbar-rank">{i + 1}</span>
          <span className="hbar-label">{item[nameKey]}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
          <span className="hbar-value">{item[valueKey].toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const ASU_CENTER = [-25.2867, -57.6473]

function DotMap({ points }) {
  if (!points?.length) return <p className="rp-no-data">Sin datos de ubicación</p>

  const maxW = Math.max(...points.map(p => p.weight), 1)

  return (
    <MapContainer
      center={ASU_CENTER}
      zoom={13}
      scrollWheelZoom={false}
      className="rp-leaflet-map"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {points.map((p, i) => {
        const ratio = p.weight / maxW
        return (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={8 + ratio * 22}
            pathOptions={{
              fillColor: '#DD613B',
              fillOpacity: 0.28 + ratio * 0.52,
              color: '#B84D2F',
              weight: 1.5,
              opacity: 0.6,
            }}
          >
            <Popup><strong>{p.weight}</strong> sesiones en esta zona</Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

const CAT_COLORS = {
  gastronomia: '#DD613B',
  hoteles:     '#e8874f',
  lugares:     '#f0b28a',
}

function PlaceList({ places }) {
  if (!places?.length) return <p className="rp-no-data">Sin lugares registrados</p>
  return (
    <div className="pl-list">
      {places.slice(0, 10).map((p, i) => (
        <div key={p.id} className="pl-row">
          <span className="pl-rank">{i + 1}</span>
          <span className="pl-name">{p.name}</span>
          <span className="pl-cat" style={{ background: CAT_COLORS[p.category] + '22', color: CAT_COLORS[p.category] }}>
            {CATEGORY_LABELS[p.category] || p.category}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Card primitives ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rp-stat${accent ? ` rp-stat--${accent}` : ''}`}>
      <span className="rp-stat-value">{value}</span>
      <span className="rp-stat-label">{label}</span>
      {sub && <span className="rp-stat-sub">{sub}</span>}
    </div>
  )
}

function Card({ title, sub, children }) {
  return (
    <div className="rp-card">
      {(title || sub) && (
        <div className="rp-card-header">
          {title && <span className="rp-card-title">{title}</span>}
          {sub && <span className="rp-card-sub">{sub}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { token } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchMetrics(token),
      fetchPlaces(token).catch(() => []),
    ])
      .then(([m, p]) => { setMetrics(m); setPlaces(p) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <p className="rp-status">Cargando métricas…</p>
  if (error) return <p className="rp-status rp-status--error">Error al cargar métricas: {error}</p>
  if (!metrics) return null

  const { trafico, lugares, busquedas, sistema } = metrics
  if (!trafico || !lugares || !busquedas || !sistema) {
    return <p className="rp-status rp-status--error">Datos de métricas incompletos. Verifique que el endpoint backend esté configurado y la tabla <code>metrics</code> tenga datos.</p>
  }

  const catItems = Object.entries(lugares.por_categoria)
    .map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, count: v }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="reports-page">
      <h1 className="rp-page-title">Reportes</h1>

      {/* ── TRÁFICO Y USO ─────────────────────── */}
      <section className="rp-section">
        <h2 className="rp-section-title">Tráfico y uso</h2>

        <div className="rp-grid rp-grid--3">
          <StatCard label="Sesiones este mes" value={trafico.sesiones_mes.toLocaleString()} />
          <StatCard
            label="Duración promedio"
            value={fmtDuration(trafico.duracion_promedio_seg)}
            sub="por sesión"
          />
          <StatCard
            label="Tasa de rebote"
            value={trafico.tasa_rebote_pct != null ? `${trafico.tasa_rebote_pct}%` : '—'}
            accent={trafico.tasa_rebote_pct > 50 ? 'warning' : undefined}
          />
        </div>

        <Card title="Mapa de ubicaciones de usuarios" sub="Asunción · intensidad por zona geográfica">
          <DotMap points={trafico.ubicaciones} />
        </Card>
      </section>

      {/* ── LUGARES ───────────────────────────── */}
      <section className="rp-section">
        <h2 className="rp-section-title">Lugares</h2>

        <div className="rp-grid rp-grid--3">
          <StatCard label="Total de lugares" value={lugares.total.toLocaleString()} />
          <StatCard label="Sin fotos" value={lugares.sin_fotos.toLocaleString()} sub={`de ${lugares.total} registrados`} />
          <StatCard label="Veces 'Ver en mapa'" value={lugares.veces_ver_mapa.toLocaleString()} />
        </div>

        <div className="rp-grid rp-grid--2-1">
          <Card title="Top 10 lugares" sub="Desde la base de datos">
            <PlaceList places={places} />
          </Card>
          <div className="rp-col">
            <Card title="Distribución por categoría">
              <HBarList items={catItems} nameKey="name" valueKey="count" />
            </Card>
            <Card title="Lugares añadidos por mes" sub="Últimos 6 meses">
              <LineChart data={lugares.lugares_por_mes} xKey="month" yKey="count" />
            </Card>
          </div>
        </div>
      </section>

      {/* ── BÚSQUEDAS ─────────────────────────── */}
      <section className="rp-section">
        <h2 className="rp-section-title">Búsquedas</h2>

        <div className="rp-grid rp-grid--3">
          <StatCard label="Búsquedas este mes" value={busquedas.total_mes.toLocaleString()} />
          <StatCard
            label="Categoría más consultada"
            value={CATEGORY_LABELS[busquedas.categoria_mas_consultada] || busquedas.categoria_mas_consultada}
          />
          <StatCard label="Sin resultados" value={`${busquedas.sin_resultados_pct}%`} />
        </div>

        <Card title="Top 8 términos más buscados">
          <HBarList items={busquedas.top_terminos} nameKey="term" valueKey="count" limit={8} />
        </Card>
      </section>

      {/* ── SISTEMA Y CONTENIDO ───────────────── */}
      <section className="rp-section">
        <h2 className="rp-section-title">Sistema y contenido</h2>

        <div className="rp-grid rp-grid--5">
          <StatCard label="Total de fotos" value={lugares.total_fotos.toLocaleString()} />
          <StatCard label="Peso de fotos" value={`${sistema.peso_fotos_gb} GB`} />
          <StatCard label="Uptime 30d" value={`${sistema.uptime_30d}%`} accent="success" />
          <StatCard label="Latencia promedio" value={`${sistema.latencia_promedio_ms} ms`} />
          <StatCard
            label="Errores 5xx (semana)"
            value={sistema.errores_5xx_semana}
            accent={sistema.errores_5xx_semana > 0 ? 'warning' : 'success'}
          />
        </div>
      </section>
    </div>
  )
}
