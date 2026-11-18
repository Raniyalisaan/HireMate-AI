
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

const api = axios.create({
  baseURL: BASE_URL,
})

// Shared refresh request prevents multiple simultaneous refresh calls.
let refreshPromise = null

const clearAuthData = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
  localStorage.removeItem('profilePhoto')
}

// Attach the current access token to API requests.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Refresh the access token when an API request returns 401.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('token/')
    ) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')

    if (!refreshToken) {
      clearAuthData()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      // All simultaneous requests share the same refresh operation.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}token/refresh/`, {
            refresh: refreshToken,
          })
          .then((response) => {
            const newAccessToken = response.data.access

            if (!newAccessToken) {
              throw new Error('No access token returned')
            }

            localStorage.setItem('accessToken', newAccessToken)

            // Support refresh-token rotation if enabled in Django.
            if (response.data.refresh) {
              localStorage.setItem(
                'refreshToken',
                response.data.refresh
              )
            }

            return newAccessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise

      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`

      // Retry the original request with the new token.
      return api(originalRequest)
    } catch (refreshError) {
      clearAuthData()

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }

      return Promise.reject(refreshError)
    }
  }
)

export default api
