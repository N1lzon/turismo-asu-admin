import { API_URL } from './config'

export async function checkBackendStatus(token) {
  const start = performance.now()
  try {
    const res = await fetch(`${API_URL}/admin/places`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    })
    const latency = Math.round(performance.now() - start)
    if (!res.ok) return { online: true, latency, statusCode: res.status, places: null }
    const places = await res.json()
    const counts = places.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    return { online: true, latency, statusCode: res.status, total: places.length, counts }
  } catch {
    return { online: false, latency: null, statusCode: null, total: null, counts: null }
  }
}
