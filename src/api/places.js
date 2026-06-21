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

export const fetchPlaces = (token) =>
  req('/admin/places', token)

export const fetchPlace = (token, id) =>
  req(`/admin/places/${id}`, token)

export const updatePlace = (token, id, body) =>
  req(`/admin/places/${id}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deletePlace = (token, id) =>
  req(`/admin/places/${id}`, token, { method: 'DELETE' })

export const uploadPhoto = (token, id, file) => {
  const form = new FormData()
  form.append('file', file)
  return req(`/admin/places/${id}/photos`, token, { method: 'POST', body: form })
}

export const deletePhoto = (token, id, url) =>
  req(`/admin/places/${id}/photos`, token, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
