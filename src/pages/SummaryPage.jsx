import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatDateTime, formatMoney, formatNumber, formatPercent } from '../utils/formatters'

const SummaryPage = () => {
  const { data, loading, error, refetch } = useApi(() => apiService.getSummary(), [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  const summary = data || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Portfolio Summary</h2>
        <p className="text-sm text-slate-500">High-level portfolio totals for the home dashboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="investment" title="Total Investment" value={formatMoney(summary.totalInvestment)} />
        <Card variant="portfolio" title="Current Portfolio Value" value={formatMoney(summary.currentPortfolioValue)} />
        <Card variant="profit" title="Total Profit" value={formatMoney(summary.overallProfit)} />
        <Card variant="profit-percent" title="Profit Percentage" value={formatPercent(summary.overallProfitPercentage)} />
        <Card variant="xirr" title="Portfolio XIRR" value={formatPercent(summary.portfolioXirr)} />
        <Card variant="holdings" title="Total Holdings" value={formatNumber(summary.totalStocks, 0)} />
        <Card variant="transactions" title="Total Transactions" value={formatNumber(summary.totalTransactions, 0)} />
        <Card variant="dividend" title="Total Dividend" value={formatMoney(summary.totalDividendThisYear)} />
        <Card variant="buy-opportunities" title="Buy Opportunities" value={formatNumber(summary.todayBuyOpportunities, 0)} />
        <Card variant="hold" title="Hold Stocks" value={formatNumber(summary.todayHoldStocks, 0)} />
        <Card variant="review" title="Review Stocks" value={formatNumber(summary.todayReviewStocks, 0)} />
        <Card variant="quantity" title="Total Quantity" value={formatNumber(summary.totalQuantity, 0)} />
        <Card variant="analysis" title="Last Analysis" value={formatDateTime(summary.lastAnalysisTime)} />
      </div>
    </div>
  )
}

export default SummaryPage
