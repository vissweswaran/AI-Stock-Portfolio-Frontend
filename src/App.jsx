import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import AnalysisPage from './pages/AnalysisPage'
import SmartAnalysisPage from './pages/SmartAnalysisPage'
import DashboardPage from './pages/DashboardPage'
import DividendsPage from './pages/DividendsPage'
import HoldingsPage from './pages/HoldingsPage'
import PortfolioIntelligencePage from './pages/PortfolioIntelligencePage'
import TransactionsPage from './pages/TransactionsPage'

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" />
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/holdings" element={<HoldingsPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/smart-analysis" element={<SmartAnalysisPage />} />
        <Route path="/portfolio-intelligence" element={<PortfolioIntelligencePage />} />
        <Route path="/dividends" element={<DividendsPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
