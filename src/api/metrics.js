import { API_URL } from './config'

export async function fetchMetrics(token) {
  const res = await fetch(`${API_URL}/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateMetrics(token, data) {
  const res = await fetch(`${API_URL}/admin/metrics`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
