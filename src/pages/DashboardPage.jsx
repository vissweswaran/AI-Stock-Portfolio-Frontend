import { useMemo } from 'react'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import PortfolioCharts from '../components/PortfolioCharts'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatDateTime, formatMoney, formatNumber, formatPercent } from '../utils/formatters'

const DashboardPage = () => {
  const summaryApi = useApi(() => apiService.getSummary(), [])
  const dashboardApi = useApi(() => apiService.getDashboard(), [])
  const analysisApi = useApi(() => apiService.getAnalysisPortfolio(), [])

  const decisionsBySymbol = useMemo(() => {
    const map = {}
    for (const [symbol, decision] of Object.entries(analysisApi.data?.decisions || {})) {
      map[symbol.toUpperCase()] = decision
    }
    return map
  }, [analysisApi.data])

  const buyOpportunities = useMemo(
    () =>
      (dashboardApi.data?.holdings || []).filter((holding) => {
        const decision = decisionsBySymbol[holding.symbol.toUpperCase()]?.decision
        return decision === 'ADD' || decision === 'BUY'
      }),
    [dashboardApi.data, decisionsBySymbol],
  )

  const holdStocks = useMemo(
    () =>
      (dashboardApi.data?.holdings || []).filter((holding) => {
        const decision = decisionsBySymbol[holding.symbol.toUpperCase()]?.decision
        return decision === 'HOLD'
      }),
    [dashboardApi.data, decisionsBySymbol],
  )

  const sellStocks = useMemo(
    () =>
      (dashboardApi.data?.holdings || []).filter((holding) => {
        const decision = decisionsBySymbol[holding.symbol.toUpperCase()]?.decision
        return decision === 'SELL'
      }),
    [dashboardApi.data, decisionsBySymbol],
  )

  if (summaryApi.loading || dashboardApi.loading || analysisApi.loading) return <Loader />
  if (summaryApi.error) return <ErrorMessage message={summaryApi.error} onRetry={summaryApi.refetch} />
  if (dashboardApi.error) return <ErrorMessage message={dashboardApi.error} onRetry={dashboardApi.refetch} />
  if (analysisApi.error) return <ErrorMessage message={analysisApi.error} onRetry={analysisApi.refetch} />

  const summary = summaryApi.data || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Portfolio overview and latest opportunities.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="investment" title="Total Investment" value={formatMoney(summary.totalInvestment)} />
        <Card variant="portfolio" title="Current Portfolio Value" value={formatMoney(summary.currentPortfolioValue)} />
        <Card variant="profit" title="Overall Profit/Loss" value={formatMoney(summary.overallProfit)} />
        <Card variant="profit-percent" title="Overall Profit %" value={formatPercent(summary.overallProfitPercentage)} />
        <Card variant="xirr" title="Portfolio XIRR" value={formatPercent(summary.portfolioXirr)} />
        <Card variant="holdings" title="Total Holdings" value={formatNumber(summary.totalStocks, 0)} />
        <Card variant="transactions" title="Total Transactions" value={formatNumber(summary.totalTransactions, 0)} />
        <Card variant="dividend" title="Dividend This Year" value={formatMoney(summary.totalDividendThisYear)} />
        <Card variant="buy-opportunities" title="Buy Opportunities" value={formatNumber(buyOpportunities.length, 0)} />
        <Card variant="hold" title="Hold Stocks" value={formatNumber(holdStocks.length, 0)} />
        <Card variant="sell" title="Sell Stocks" value={formatNumber(sellStocks.length, 0)} />
        <Card variant="analysis" title="Last Analysis" value={formatDateTime(summary.lastAnalysisTime)} />
      </div>

      <PortfolioCharts
        holdings={dashboardApi.data?.holdings || []}
        sectorBreakdown={dashboardApi.data?.sectorBreakdown || []}
      />

      <Card
        variant="buy-opportunities"
        title="Buy Opportunities"
        subtitle={buyOpportunities.length ? 'Stocks the Smart Analysis recommends adding to.' : 'No buy opportunities from Smart Analysis yet.'}
      >
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {buyOpportunities.map((holding) => {
            const decision = decisionsBySymbol[holding.symbol.toUpperCase()]
            return (
              <div key={holding.symbol} className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <strong>{holding.symbol}</strong>
                  <span className="text-green-700">{formatMoney(holding.currentPrice)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {decision?.decision || '—'} · Score{' '}
                  {decision?.score != null ? formatNumber(decision.score, 0) : '—'} · Confidence{' '}
                  {decision?.confidence?.level || '—'}
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage
