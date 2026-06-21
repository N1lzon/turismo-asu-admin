import { API_URL } from './config'

export async function checkBackendStatus(token) {
  const start = performance.now()
  try {
    const res = await fetch(`${API_URL}/admin/places`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    })
    const latency = Math.round(performance.now() - start)
    return { online: true, latency, status: res.status }
  } catch {
    return { online: false, latency: null, status: null }
  }
}
