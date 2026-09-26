import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach Bearer token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('helpdesk_auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.error('Failed to read token from localStorage', e)
  }
  return config
})

// Response interceptor for unified response extraction & 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired session
      localStorage.removeItem('helpdesk_auth_token')
      localStorage.removeItem('helpdesk_auth_user')
    }
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Server connection error'
    return Promise.reject(new Error(message))
  }
)

export const authService = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    if (res?.data?.token) {
      localStorage.setItem('helpdesk_auth_token', res.data.token)
      localStorage.setItem('helpdesk_auth_user', JSON.stringify(res.data.user))
    }
    return res.data
  },

  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData)
    if (res?.data?.token) {
      localStorage.setItem('helpdesk_auth_token', res.data.token)
      localStorage.setItem('helpdesk_auth_user', JSON.stringify(res.data.user))
    }
    return res.data
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me')
    return res.data?.user
  },

  logout: () => {
    localStorage.removeItem('helpdesk_auth_token')
    localStorage.removeItem('helpdesk_auth_user')
  }
}

export const ticketService = {
  getTickets: async (params = {}) => {
    const res = await apiClient.get('/tickets', { params })
    return res.data || []
  },

  getTicketById: async (id) => {
    const res = await apiClient.get(`/tickets/${id}`)
    return res.data
  },

  createTicket: async (ticketData) => {
    const res = await apiClient.post('/tickets', ticketData)
    return res.data
  },

  updateTicket: async (id, data) => {
    const res = await apiClient.patch(`/tickets/${id}`, data)
    return res.data
  },

  assignTicket: async (id, technicianId) => {
    const res = await apiClient.post(`/tickets/${id}/assign`, { technicianId })
    return res.data
  },

  addComment: async (id, message, isInternal = false) => {
    const res = await apiClient.post(`/tickets/${id}/comments`, { message, isInternal })
    return res.data
  },

  resolveTicket: async (id, notes = '') => {
    const res = await apiClient.post(`/tickets/${id}/resolve`, { notes })
    return res.data
  },

  rateTicket: async (id, rating, feedback = '') => {
    const res = await apiClient.post(`/tickets/${id}/rate`, { rating, feedback })
    return res.data
  }
}

export const assetService = {
  getAssets: async (params = {}) => {
    const res = await apiClient.get('/assets', { params })
    return res.data || []
  },

  createAsset: async (data) => {
    const res = await apiClient.post('/assets', data)
    return res.data
  },

  getMaintenance: async () => {
    const res = await apiClient.get('/assets/maintenance')
    return res.data || []
  }
}

export const userService = {
  getUsers: async () => {
    const res = await apiClient.get('/users')
    return res.data || []
  },

  updateRole: async (id, role, department) => {
    const res = await apiClient.patch(`/users/${id}`, { role, department })
    return res.data
  }
}

export const reportService = {
  getDashboardStats: async () => {
    const res = await apiClient.get('/reports/dashboard')
    return res.data
  },

  getAuditLogs: async () => {
    const res = await apiClient.get('/reports/audit-logs')
    return res.data || []
  }
}
