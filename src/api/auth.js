import { API_URL } from './config'

export async function loginRequest(username, password) {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Error al iniciar sesión')
  return data.access_token
}
