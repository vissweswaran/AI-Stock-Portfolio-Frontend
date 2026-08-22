import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import AnalysisPage from './pages/AnalysisPage'
import DashboardPage from './pages/DashboardPage'
import DividendsPage from './pages/DividendsPage'
import HoldingsPage from './pages/HoldingsPage'
import FundamentalRulesPage from './pages/FundamentalRulesPage'
import PortfolioIntelligencePage from './pages/PortfolioIntelligencePage'
import SummaryPage from './pages/SummaryPage'
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
        <Route path="/fundamental-rules" element={<FundamentalRulesPage />} />
        <Route path="/portfolio-intelligence" element={<PortfolioIntelligencePage />} />
        <Route path="/dividends" element={<DividendsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
