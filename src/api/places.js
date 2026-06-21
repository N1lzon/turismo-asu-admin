import { API_URL } from './config'

export async function fetchPlaces(token) {
  const res = await fetch(`${API_URL}/admin/places`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
