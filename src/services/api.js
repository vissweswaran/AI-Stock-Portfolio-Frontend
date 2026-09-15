import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

const get = async (path, params = {}) => {
  const response = await api.get(path, { params })
  return response.data
}

const post = async (path, data = {}, config = {}) => {
  const response = await api.post(path, data, config)
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
  getScores: () => get('/score'),
  getScoreBySymbol: (symbol) => get(`/score/${encodeURIComponent(symbol)}`),
  getDividends: (year) => get('/dividends', year ? { year } : {}),
  getDividendBySymbol: (symbol, year) =>
    get(`/dividends/${encodeURIComponent(symbol)}`, year ? { year } : {}),
  searchStocks: (query) => get('/stocks/search', { q: query }),
  getPortfolioIntelligence: () => get('/portfolio/intelligence'),
  getPortfolioIntelligenceBySymbol: (symbol) =>
    get(`/portfolio/intelligence/${encodeURIComponent(symbol)}`),
  syncPortfolioData: () => post('/portfolio/sync'),
  syncMarketData: (symbol) =>
    post(symbol ? `/market-data/sync/${encodeURIComponent(symbol)}` : '/market-data/sync', {}, { timeout: 60000 }),
  syncFinancialData: (symbol) =>
    post(symbol ? `/financial-data/sync/${encodeURIComponent(symbol)}` : '/financial-data/sync', {}, { timeout: 60000 }),
  syncOwnershipData: (symbol) =>
    post(symbol ? `/ownership/sync/${encodeURIComponent(symbol)}` : '/ownership/sync', {}, { timeout: 60000 }),
  syncCorporateActions: (symbol) =>
    post(symbol ? `/corporate-actions/sync/${encodeURIComponent(symbol)}` : '/corporate-actions/sync', {}, { timeout: 60000 }),
  getAnalysisResults: () => get('/analysis/results'),
  getAnalysisResultsBySymbol: (symbol) =>
    get(`/analysis/results/${encodeURIComponent(symbol)}`),
  getAnalysisPortfolio: () => get('/analysis/portfolio'),
  getAnalysisRankings: () => get('/analysis/rankings'),
  getMergedAnalysis: (symbol) => get(`/analysis/${encodeURIComponent(symbol)}`),
  analyzeAnalysisSymbol: (symbol, payload = {}) =>
    post(`/analysis/analyze/${encodeURIComponent(symbol)}`, payload),
  analyzeAnalysisPortfolio: (payload) =>
    post('/analysis/analyze', payload, { timeout: 180000 }),
  getAnalysisDecision: (symbol) =>
    get(`/analysis/decision/${encodeURIComponent(symbol)}`),
  getAnalysisValuation: (symbol) =>
    get(`/analysis/valuation/${encodeURIComponent(symbol)}`),
  getAnalysisReadiness: (symbol) =>
    get(`/analysis/readiness/${encodeURIComponent(symbol)}`),
}

export default apiService
