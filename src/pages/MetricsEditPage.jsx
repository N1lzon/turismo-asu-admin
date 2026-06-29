import { Fragment, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchMetrics, updateMetrics } from '../api/metrics'
import LocationsMap from '../components/LocationsMap'
import './MetricsEditPage.css'

const CATS = ['gastronomia', 'hoteles', 'lugares']
const CAT_LABELS = { gastronomia: 'Gastronomía', hoteles: 'Hoteles', lugares: 'Lugares' }

function arr(v) {
  return JSON.stringify(v ?? [], null, 2)
}

function Section({ title, children }) {
  return (
    <section className="me-section">
      <h2 className="me-section-title">{title}</h2>
      <div className="me-fields">{children}</div>
    </section>
  )
}

function Field({ label, hint, wide, children }) {
  return (
    <div className={`me-field${wide ? ' me-field--wide' : ''}`}>
      <label className="me-label">
        {label}
        {hint && <span className="me-hint">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export default function MetricsEditPage() {
  const { token } = useAuth()
  const [mode, setMode] = useState('fields')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const [jsonText, setJsonText] = useState('')

  const [trafico, setTrafico] = useState({
    sesiones_mes: 0,
    duracion_promedio_seg: 0,
    tasa_rebote_pct: 0,
    sesiones_por_dia: '[]',
    sesiones_por_hora: '[]',
    ubicaciones: '[]',
  })
  const [lugaresEdit, setLugaresEdit] = useState({
    top_buscados: '[]',
    lugares_por_mes: '[]',
    veces_ver_mapa: 0,
  })
  const [busquedas, setBusquedas] = useState({
    total_mes: 0,
    top_terminos: '[]',
    categoria_mas_consultada: 'gastronomia',
    sin_resultados_pct: 0,
  })
  const [sistema, setSistema] = useState({
    peso_fotos_gb: 0,
    uptime_30d: 100,
    latencia_promedio_ms: 0,
    errores_5xx_semana: 0,
  })

  useEffect(() => {
    fetchMetrics(token)
      .then(data => {
        setTrafico({
          sesiones_mes: data.trafico?.sesiones_mes ?? 0,
          duracion_promedio_seg: data.trafico?.duracion_promedio_seg ?? 0,
          tasa_rebote_pct: data.trafico?.tasa_rebote_pct ?? 0,
          sesiones_por_dia: arr(data.trafico?.sesiones_por_dia),
          sesiones_por_hora: arr(data.trafico?.sesiones_por_hora),
          ubicaciones: arr(data.trafico?.ubicaciones),
        })
        setLugaresEdit({
          top_buscados: arr(data.lugares?.top_buscados),
          lugares_por_mes: arr(data.lugares?.lugares_por_mes),
          veces_ver_mapa: data.lugares?.veces_ver_mapa ?? 0,
        })
        setBusquedas({
          total_mes: data.busquedas?.total_mes ?? 0,
          top_terminos: arr(data.busquedas?.top_terminos),
          categoria_mas_consultada: data.busquedas?.categoria_mas_consultada ?? 'gastronomia',
          sin_resultados_pct: data.busquedas?.sin_resultados_pct ?? 0,
        })
        setSistema({
          peso_fotos_gb: data.sistema?.peso_fotos_gb ?? 0,
          uptime_30d: data.sistema?.uptime_30d ?? 100,
          latencia_promedio_ms: data.sistema?.latencia_promedio_ms ?? 0,
          errores_5xx_semana: data.sistema?.errores_5xx_semana ?? 0,
        })
        // JSON mode: only the writable subset (strip live-computed fields)
        const writable = {
          trafico: data.trafico ?? {},
          lugares: {
            top_buscados: data.lugares?.top_buscados ?? [],
            lugares_por_mes: data.lugares?.lugares_por_mes ?? [],
            veces_ver_mapa: data.lugares?.veces_ver_mapa ?? 0,
          },
          busquedas: data.busquedas ?? {},
          sistema: data.sistema ?? {},
        }
        setJsonText(JSON.stringify(writable, null, 2))
      })
      .catch(e => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  function parseArr(label, str) {
    try {
      return JSON.parse(str)
    } catch {
      throw new Error(`JSON inválido en el campo "${label}"`)
    }
  }

  function buildPayloadFromFields() {
    return {
      trafico: {
        sesiones_mes: Number(trafico.sesiones_mes),
        duracion_promedio_seg: Number(trafico.duracion_promedio_seg),
        tasa_rebote_pct: Number(trafico.tasa_rebote_pct),
        sesiones_por_dia: parseArr('Sesiones por día', trafico.sesiones_por_dia),
        sesiones_por_hora: parseArr('Sesiones por hora', trafico.sesiones_por_hora),
        ubicaciones: parseArr('Ubicaciones', trafico.ubicaciones),
      },
      lugares: {
        top_buscados: parseArr('Top buscados', lugaresEdit.top_buscados),
        lugares_por_mes: parseArr('Lugares por mes', lugaresEdit.lugares_por_mes),
        veces_ver_mapa: Number(lugaresEdit.veces_ver_mapa),
      },
      busquedas: {
        total_mes: Number(busquedas.total_mes),
        top_terminos: parseArr('Top términos', busquedas.top_terminos),
        categoria_mas_consultada: busquedas.categoria_mas_consultada,
        sin_resultados_pct: Number(busquedas.sin_resultados_pct),
      },
      sistema: {
        peso_fotos_gb: Number(sistema.peso_fotos_gb),
        uptime_30d: Number(sistema.uptime_30d),
        latencia_promedio_ms: Number(sistema.latencia_promedio_ms),
        errores_5xx_semana: Number(sistema.errores_5xx_semana),
      },
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      let payload
      if (mode === 'json') {
        try {
          payload = JSON.parse(jsonText)
        } catch {
          throw new Error('El JSON no es válido — verificá la sintaxis')
        }
      } else {
        payload = buildPayloadFromFields()
      }
      await updateMetrics(token, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="me-status">Cargando…</p>
  if (fetchError) return <p className="me-status me-status--error">Error al cargar: {fetchError}</p>

  return (
    <div className="metrics-edit-page">
      <div className="me-header">
        <div>
          <h1 className="me-page-title">Editar métricas</h1>
          <p className="me-page-sub">Los cambios reemplazan la totalidad de los datos almacenados.</p>
        </div>
        <div className="me-actions">
          {saveError && <span className="me-msg me-msg--error">{saveError}</span>}
          {saved && <span className="me-msg me-msg--ok">Guardado</span>}
          <button className="me-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="me-tabs">
        <button
          className={`me-tab${mode === 'fields' ? ' active' : ''}`}
          onClick={() => setMode('fields')}
        >
          Por campos
        </button>
        <button
          className={`me-tab${mode === 'json' ? ' active' : ''}`}
          onClick={() => setMode('json')}
        >
          JSON completo
        </button>
      </div>

      {mode === 'json' ? (
        <div className="me-json-mode">
          <p className="me-json-hint">
            Pegá o editá el JSON directamente. Al guardar se reemplaza todo el contenido almacenado.
          </p>
          <textarea
            className="me-json-editor"
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>
      ) : (
        <Fragment>
          <Section title="Tráfico">
            <Field label="Sesiones este mes" hint="integer">
              <input
                type="number"
                className="me-input"
                value={trafico.sesiones_mes}
                onChange={e => setTrafico(s => ({ ...s, sesiones_mes: e.target.value }))}
              />
            </Field>

            <Field label="Duración promedio de sesión" hint="segundos integer (ej: 222 = 3 min 42 s)">
              <input
                type="number"
                className="me-input"
                value={trafico.duracion_promedio_seg}
                onChange={e => setTrafico(s => ({ ...s, duracion_promedio_seg: e.target.value }))}
              />
            </Field>

            <Field label="Tasa de rebote" hint="porcentaje float (ej: 34.7)">
              <input
                type="number"
                step="0.1"
                className="me-input"
                value={trafico.tasa_rebote_pct}
                onChange={e => setTrafico(s => ({ ...s, tasa_rebote_pct: e.target.value }))}
              />
            </Field>

            <Field label="Sesiones por día" hint="array · { date: string, count: integer } × 30" wide>
              <textarea
                className="me-textarea"
                value={trafico.sesiones_por_dia}
                onChange={e => setTrafico(s => ({ ...s, sesiones_por_dia: e.target.value }))}
              />
            </Field>

            <Field label="Sesiones por hora" hint="array · { hour: 0–23, count: integer } × 24" wide>
              <textarea
                className="me-textarea"
                value={trafico.sesiones_por_hora}
                onChange={e => setTrafico(s => ({ ...s, sesiones_por_hora: e.target.value }))}
              />
            </Field>

            <Field label="Mapa de ubicaciones de usuarios" hint="{ lat, lng, weight }" wide>
              <LocationsMap
                value={trafico.ubicaciones}
                onChange={v => setTrafico(s => ({ ...s, ubicaciones: v }))}
              />
            </Field>
          </Section>

          <Section title="Lugares">
            <Field label="Veces 'Ver en mapa'" hint="integer">
              <input
                type="number"
                className="me-input"
                value={lugaresEdit.veces_ver_mapa}
                onChange={e => setLugaresEdit(s => ({ ...s, veces_ver_mapa: e.target.value }))}
              />
            </Field>

            <Field label="Top 10 más buscados" hint="array · { name: string, count: integer }" wide>
              <textarea
                className="me-textarea"
                value={lugaresEdit.top_buscados}
                onChange={e => setLugaresEdit(s => ({ ...s, top_buscados: e.target.value }))}
              />
            </Field>

            <Field label="Lugares añadidos por mes" hint="array · { month: YYYY-MM, count: integer } × 6" wide>
              <textarea
                className="me-textarea me-textarea--sm"
                value={lugaresEdit.lugares_por_mes}
                onChange={e => setLugaresEdit(s => ({ ...s, lugares_por_mes: e.target.value }))}
              />
            </Field>
          </Section>

          <Section title="Búsquedas">
            <Field label="Búsquedas este mes" hint="integer">
              <input
                type="number"
                className="me-input"
                value={busquedas.total_mes}
                onChange={e => setBusquedas(s => ({ ...s, total_mes: e.target.value }))}
              />
            </Field>

            <Field label="Sin resultados" hint="porcentaje float (ej: 12.4)">
              <input
                type="number"
                step="0.1"
                className="me-input"
                value={busquedas.sin_resultados_pct}
                onChange={e => setBusquedas(s => ({ ...s, sin_resultados_pct: e.target.value }))}
              />
            </Field>

            <Field label="Categoría más consultada">
              <select
                className="me-select"
                value={busquedas.categoria_mas_consultada}
                onChange={e => setBusquedas(s => ({ ...s, categoria_mas_consultada: e.target.value }))}
              >
                {CATS.map(c => (
                  <option key={c} value={c}>{CAT_LABELS[c]}</option>
                ))}
              </select>
            </Field>

            <Field label="Top términos buscados" hint="array · { term: string, count: integer } × 8" wide>
              <textarea
                className="me-textarea me-textarea--sm"
                value={busquedas.top_terminos}
                onChange={e => setBusquedas(s => ({ ...s, top_terminos: e.target.value }))}
              />
            </Field>
          </Section>

          <Section title="Sistema">
            <Field label="Peso de fotos" hint="GB float">
              <input
                type="number"
                step="0.1"
                className="me-input"
                value={sistema.peso_fotos_gb}
                onChange={e => setSistema(s => ({ ...s, peso_fotos_gb: e.target.value }))}
              />
            </Field>

            <Field label="Uptime 30d" hint="porcentaje float (ej: 99.7)">
              <input
                type="number"
                step="0.1"
                className="me-input"
                value={sistema.uptime_30d}
                onChange={e => setSistema(s => ({ ...s, uptime_30d: e.target.value }))}
              />
            </Field>

            <Field label="Latencia promedio" hint="ms integer">
              <input
                type="number"
                className="me-input"
                value={sistema.latencia_promedio_ms}
                onChange={e => setSistema(s => ({ ...s, latencia_promedio_ms: e.target.value }))}
              />
            </Field>

            <Field label="Errores 5xx (semana)" hint="integer">
              <input
                type="number"
                className="me-input"
                value={sistema.errores_5xx_semana}
                onChange={e => setSistema(s => ({ ...s, errores_5xx_semana: e.target.value }))}
              />
            </Field>
          </Section>
        </Fragment>
      )}
    </div>
  )
}
