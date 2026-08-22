import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

const get = async (path, params = {}) => {
  const response = await api.get(path, { params })
  return response.data
}

const post = async (path, data = {}) => {
  const response = await api.post(path, data)
  return response.data
}

const put = async (path, data = {}) => {
  const response = await api.put(path, data)
  return response.data
}

const remove = async (path) => {
  const response = await api.delete(path)
  return response.data
}

export const apiService = {
  getHealth: () => get('/health'),
  getSummary: (year) => get('/summary', year ? { year } : {}),
  getDashboard: () => get('/dashboard'),
  getTransactions: () => get('/transactions'),
  createTransaction: (payload) => post('/transactions', payload),
  updateTransaction: (id, payload) => put(`/transactions/${id}`, payload),
  deleteTransaction: (id) => remove(`/transactions/${id}`),
  getHoldings: () => get('/holdings'),
  runAnalysis: () => post('/analyze'),
  getDividends: (year) => get('/dividends', year ? { year } : {}),
  getDividendBySymbol: (symbol, year) =>
    get(`/dividends/${encodeURIComponent(symbol)}`, year ? { year } : {}),
  searchStocks: (query) => get('/stocks/search', { q: query }),
}

export default apiService
