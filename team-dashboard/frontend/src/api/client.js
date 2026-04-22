import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true, // send session cookie
})

export const login = (username, password) =>
  client.post('/auth/login', { username, password }).then(r => r.data)

export const logout = () =>
  client.post('/auth/logout').then(r => r.data)

export const getMembers = () =>
  client.get('/team/members').then(r => r.data)

export const getStats = (start, end) =>
  client.get('/team/stats', { params: { start, end } }).then(r => r.data)
