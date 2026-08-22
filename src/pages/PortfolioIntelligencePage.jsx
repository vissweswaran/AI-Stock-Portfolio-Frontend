import { useEffect, useState } from 'react'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatNumber } from '../utils/formatters'

const friendlyLabel = (value) =>
  String(value || 'N/A')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const tone = (value) => {
  const status = String(value || '').toUpperCase()
  if (['INTACT', 'SUITABLE', 'ATTRACTIVE', 'WATCH', 'HIGH', 'GOOD', 'STRONG'].some((item) => status.includes(item))) {
    return 'text-emerald-700'
  }
  if (['MONITOR', 'REVIEW', 'CAUTION', 'MODERATE', 'MEDIUM'].some((item) => status.includes(item))) {
    return 'text-amber-700'
  }
  if (['WEAKENING', 'SELL', 'INSUFFICIENT', 'LOW', 'UNATTRACTIVE'].some((item) => status.includes(item))) {
    return 'text-red-700'
  }
  return 'text-slate-700'
}

const badge = (value) => {
  const status = String(value || '').toUpperCase()
  if (['INTACT', 'SUITABLE', 'ATTRACTIVE', 'WATCH', 'HIGH', 'GOOD', 'STRONG'].some((item) => status.includes(item))) {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (['MONITOR', 'REVIEW', 'CAUTION', 'MODERATE', 'MEDIUM'].some((item) => status.includes(item))) {
    return 'bg-amber-50 text-amber-700'
  }
  if (['WEAKENING', 'SELL', 'INSUFFICIENT', 'LOW', 'UNATTRACTIVE'].some((item) => status.includes(item))) {
    return 'bg-red-50 text-red-700'
  }
  return 'bg-slate-100 text-slate-700'
}

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
  </div>
)

const formatTimestamp = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const syncStatusLabel = (value) => {
  const status = String(value || '').toUpperCase()
  if (status.includes('SUCCESS') || status.includes('COMPLETED') || status.includes('DONE')) return 'Success: Portfolio data synced'
  if (status.includes('RUNNING') || status.includes('SYNCING') || status.includes('IN_PROGRESS')) return 'Syncing...'
  if (status.includes('FAIL') || status.includes('ERROR')) return 'Failed: Sync failed'
  return value ? String(value) : ''
}

const PortfolioIntelligencePage = () => {
  const intelligenceApi = useApi(() => apiService.getPortfolioIntelligence(), [])
  const scoresApi = useApi(() => apiService.getScores(), [])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [syncResult, setSyncResult] = useState(null)
  const [expandedSymbols, setExpandedSymbols] = useState(() => new Set())

  const { data, loading, error, refetch } = intelligenceApi

  useEffect(() => {
    const latestSync = data?.lastSync || data?.sync || data?.syncStatus || data?.dataFreshnessSummary
    const message = syncStatusLabel(latestSync?.status || latestSync?.message || data?.syncMessage)
    if (message) setSyncMessage(message)
  }, [data])

  const refreshDependentData = async () => {
    await Promise.all([refetch(), scoresApi.refetch()])
  }

  const handleSync = async () => {
    if (syncLoading) return

    setSyncLoading(true)
    setSyncError('')
    setSyncMessage('Syncing...')
    setSyncResult(null)

    try {
      const result = await apiService.syncPortfolioData()
      setSyncResult(result || null)

      const statusMessage =
        syncStatusLabel(result?.status || result?.message) ||
        (result?.message ? String(result.message) : 'Success: Portfolio data synced')

      setSyncMessage(statusMessage)

      await refreshDependentData()
    } catch (apiError) {
      const message = apiError.response?.data?.message || apiError.message || 'Sync failed'
      setSyncError(`Failed: Sync failed with error message: ${message}`)
      setSyncMessage('')
    } finally {
      setSyncLoading(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  const portfolio = data?.portfolio || {}
  const balance = data?.portfolioBalance || {}
  const questions = data?.questions || {}
  const stockAnalysis = data?.stockAnalysis || []
  const nextInvestment = data?.rankings?.nextInvestmentCandidates?.[0] || {}
  const byStrength = data?.rankings?.byStrength || []
  const nextCandidates = data?.rankings?.nextInvestmentCandidates || []
  const thesisCandidates = data?.rankings?.thesisBreakCandidates || []
  const thesisMonitoring = questions.thesisBreakMonitoring?.holdings || []
  const sellMonitoring = questions.sellMonitoring || {}
  const freshness = data?.dataFreshnessSummary || {}
  const lastSyncAt =
    syncResult?.lastSyncAt ||
    syncResult?.syncedAt ||
    freshness.lastSyncedAt ||
    freshness.generatedAt ||
    data?.lastSyncAt ||
    data?.syncedAt
  const syncResults = syncResult?.results || syncResult?.stocks || syncResult?.perStockResults || []

  const columns = [
    { key: 'symbol', title: 'Symbol' },
    { key: 'strength', title: 'Strength', render: (row) => friendlyLabel(row.stockStrength?.status) },
    { key: 'longTerm', title: 'LT', render: (row) => friendlyLabel(row.longTermSuitability?.status) },
    { key: 'opportunity', title: 'Opportunity', render: (row) => friendlyLabel(row.currentOpportunity?.status) },
    { key: 'thesis', title: 'Thesis', render: (row) => friendlyLabel(row.investmentThesis?.status || row.thesisHealth?.status) },
    { key: 'sell', title: 'Sell', render: (row) => friendlyLabel(row.sellMonitoring?.status) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Portfolio Intelligence</h2>
        <p className="text-sm text-slate-500">Decision-support view based on backend calculated portfolio signals.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Last sync:</span> {formatTimestamp(lastSyncAt)}
            {syncMessage ? <span className="ml-3 font-medium text-emerald-700">{syncMessage}</span> : null}
            {syncError ? <span className="ml-3 font-medium text-red-700">{syncError}</span> : null}
          </div>
          <Button
            variant="primary"
            onClick={handleSync}
            disabled={syncLoading}
            aria-busy={syncLoading}
          >
            {syncLoading ? 'Syncing...' : 'Sync Portfolio Data'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Holdings" value={formatNumber(portfolio.totalStocks, 0)} />
        <Card title="Total Sectors" value={formatNumber(balance.numberOfSectors, 0)} />
        <Card title="Balance Status" value={friendlyLabel(balance.status)} />
      </div>

      <Card title="Next Investment" subtitle="Backend-ranked next candidate">
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Candidate</p>
            <p className="text-lg font-semibold text-slate-900">{nextInvestment.symbol || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className={`text-lg font-semibold ${tone(nextInvestment.status)}`}>{friendlyLabel(nextInvestment.status)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Ranking</p>
            <p className="text-lg font-semibold text-slate-900">{nextInvestment.rank ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Reason</p>
            <p className="text-sm text-slate-700">{nextInvestment.reasons?.[0] || nextInvestment.decisionExplanation?.whyNow?.summary || 'N/A'}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Portfolio Balance" subtitle="Backend status summary">
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Portfolio Status</span>
              <span className={`rounded-full px-3 py-1 font-medium ${badge(balance.status)}`}>{friendlyLabel(balance.status)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Overweight Sectors</span>
              <span className="font-medium text-slate-900">{formatNumber(balance.concentratedSectors?.length, 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Concentrated Holdings</span>
              <span className="font-medium text-slate-900">{formatNumber(balance.concentratedStocks?.length, 0)}</span>
            </div>
          </div>
        </Card>

        <Card title="Investment Thesis">
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${tone(questions.thesisWeakening?.status)}`}>{friendlyLabel(questions.thesisWeakening?.status)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Long-Term</span>
              <span className={`font-semibold ${tone(stockAnalysis[0]?.longTermSuitability?.status)}`}>{friendlyLabel(stockAnalysis[0]?.longTermSuitability?.status)}</span>
            </div>
          </div>
        </Card>

        <Card title="Sell Monitoring">
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${tone(sellMonitoring.status)}`}>{friendlyLabel(sellMonitoring.status)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Severity</span>
              <span className="font-medium text-slate-900">{friendlyLabel(sellMonitoring.severity)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Data Freshness" value={friendlyLabel(freshness.generatedAt ? 'Updated' : 'Unavailable')} subtitle={freshness.oldestMarketDataAsOf ? `Oldest market data: ${freshness.oldestMarketDataAsOf}` : ''} />
        <Card title="Next Investment Candidates" value={formatNumber(nextCandidates.length, 0)} />
        <Card title="Strength Rankings" value={formatNumber(byStrength.length, 0)} />
      </div>

      {syncResults.length ? (
        <Card title="Sync Results" subtitle="Per-stock backend sync outcome">
          <div className="mt-4 space-y-3">
            {syncResults.map((item, index) => {
              const symbol = item.symbol || item.ticker || `Item ${index + 1}`
              const isOpen = expandedSymbols.has(symbol)
              const toggleOpen = () => {
                setExpandedSymbols((current) => {
                  const next = new Set(current)
                  if (next.has(symbol)) next.delete(symbol)
                  else next.add(symbol)
                  return next
                })
              }

              return (
                <details key={`${symbol}-${index}`} open={isOpen} className="rounded-lg border border-slate-200">
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium text-slate-900"
                    onClick={(event) => {
                      event.preventDefault()
                      toggleOpen()
                    }}
                  >
                    <span>{symbol}</span>
                    <span className="text-xs font-normal text-slate-500">{isOpen ? 'Collapse' : 'Expand'}</span>
                  </summary>
                  <div className="grid gap-3 border-t border-slate-200 p-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Market data</p>
                      <p className="font-medium text-slate-900">{friendlyLabel(item.marketData ?? item.marketDataStatus ?? item.market ?? 'N/A')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Financial data</p>
                      <p className="font-medium text-slate-900">{friendlyLabel(item.financialData ?? item.financialDataStatus ?? item.financial ?? 'N/A')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Ownership</p>
                      <p className="font-medium text-slate-900">{friendlyLabel(item.ownership ?? item.ownershipStatus ?? 'N/A')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Corporate actions</p>
                      <p className="font-medium text-slate-900">{friendlyLabel(item.corporateActions ?? item.corporateActionsStatus ?? 'N/A')}</p>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Holdings" subtitle="Per-stock intelligence from the backend" />
        <div className="mt-4">
          <div className="table-shell">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockAnalysis.map((row, index) => (
                    <tr key={row.symbol || index} className="hover:bg-slate-50">
                      {columns.map((column) => (
                        <td key={column.key}>
                          {column.render ? column.render(row) : row[column.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Thesis Monitoring" subtitle="Holdings requiring attention" />
          <div className="mt-4 space-y-3">
            {thesisMonitoring.length ? (
              thesisMonitoring.map((item, index) => (
                <div key={item.symbol || index} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.symbol || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{item.reasons?.[0] || item.summary || 'N/A'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge(item.status)}`}>{friendlyLabel(item.status)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No holdings currently require attention.</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Rankings" subtitle="Backend ranking order" />
          <div className="mt-4 space-y-3">
            {thesisCandidates.length ? (
              thesisCandidates.map((item, index) => (
                <div key={item.symbol || index} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.symbol || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{friendlyLabel(item.status)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">#{item.rank ?? index + 1}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No ranking data available.</p>
            )}
          </div>
        </Card>
      </div>

      <Card title="Decision Explanation" subtitle="Backend-generated narrative for the top candidate">
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Why This Stock</p>
            <p className="font-medium text-slate-900">{nextInvestment.decisionExplanation?.whyThisStock?.summary || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Why Now</p>
            <p className="font-medium text-slate-900">{nextInvestment.decisionExplanation?.whyNow?.summary || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Why In My Portfolio</p>
            <p className="font-medium text-slate-900">{nextInvestment.decisionExplanation?.whyInMyPortfolio?.summary || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Warnings</p>
            <p className="font-medium text-slate-900">{nextInvestment.decisionExplanation?.risksAndWarnings?.summary || 'N/A'}</p>
          </div>
        </div>
      </Card>

      <div className="text-xs text-slate-500">
        Generated at {freshness.generatedAt || data?.generatedAt || 'N/A'} using {data?.priceSource || 'N/A'} data.
      </div>
    </div>
  )
}

export default PortfolioIntelligencePage
