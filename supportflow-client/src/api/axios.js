import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:7132/api',
})

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('supportflow_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('supportflow_token')
      sessionStorage.removeItem('supportflow_user')

      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api