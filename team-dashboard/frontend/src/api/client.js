import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true, // send session cookie
})

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const login = (username, password) =>
  client.post('/auth/login', { username, password }).then(r => r.data)

export const logout = () =>
  client.post('/auth/logout').then(r => r.data)

export const getMembers = () =>
  client.get('/team/members').then(r => r.data)

export const getStats = (start, end) =>
  client.get('/team/stats', { params: { start, end } }).then(r => r.data)

export const getModelStats = (start, end) =>
  client.get('/team/model-stats', { params: { start, end } }).then(r => r.data)

export const getGroupStats = (start, end) =>
  client.get('/team/group-stats', { params: { start, end } }).then(r => r.data)

// Token management
export const getTokens = () =>
  client.get('/team/tokens').then(r => r.data)

export const getKumaStatus = () =>
  client.get('/team/kuma').then(r => r.data)
