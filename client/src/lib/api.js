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

// Normalize errors → { message, status, isNetwork }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong. Please try again.'
    const status = err.response?.status
    const normalized = Object.assign(new Error(message), {
      status,
      data: err.response?.data,
      isNetwork: !err.response, // request never reached a server
    })
    return Promise.reject(normalized)
  },
)

export function errMsg(e) {
  if (e?.isNetwork) {
    // API unreachable (static preview without a backend / offline)
    return "The live server isn't reachable from here — you're viewing the static demo. Ordering & auth work in the Arena LIVE PREVIEW or a local run."
  }
  return e?.message || 'Something went wrong. Please try again.'
}

/** Static seed menu (public/seed-menu.json) used when the API is unreachable. */
let seedPromise = null
export function loadSeed() {
  if (!seedPromise) {
    seedPromise = fetch(`${import.meta.env.BASE_URL}seed-menu.json`)
      .then((r) => {
        if (!r.ok) throw new Error('seed missing')
        return r.json()
      })
      .catch((e) => {
        seedPromise = null
        throw e
      })
  }
  return seedPromise
}

export default api
