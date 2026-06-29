import { API_URL } from './config'

async function req(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const fetchRoutes = (token) =>
  req('/admin/routes', token)

export const fetchRoute = (token, id) =>
  req(`/admin/routes/${id}`, token)

export const updateRoute = (token, id, body) =>
  req(`/admin/routes/${id}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deleteRoute = (token, id) =>
  req(`/admin/routes/${id}`, token, { method: 'DELETE' })
