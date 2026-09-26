import axios from 'axios'

/**
 * API client. Talks to the Express backend through the Vite dev proxy
 * (relative /api URLs) so the browser never needs localhost.
 */
export const api = axios.create({ baseURL: '/api' })

export function setToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

// Attach JWT from storage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hsv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors → { message, status }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong. Please try again.'
    const status = err.response?.status
    const normalized = Object.assign(new Error(message), { status, data: err.response?.data })
    return Promise.reject(normalized)
  },
)

export function errMsg(e) {
  return e?.message || 'Something went wrong. Please try again.'
}

export default api
