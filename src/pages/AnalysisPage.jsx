import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatMoney, formatNumber } from '../utils/formatters'
import { FiInfo } from 'react-icons/fi'
import Modal from '../components/Modal'

const AnalysisPage = () => {
  const { data, loading, error, refetch } = useApi(() => apiService.getDashboard(), [])
  const [running, setRunning] = useState(false)

  const groups = useMemo(() => {
    const result = { 'Buy Opportunity': [], Hold: [], Review: [] }

    ;(data?.holdings || []).forEach((holding) => {
      const recommendation = holding.recommendation || 'Hold'
      result[recommendation] = result[recommendation] || []
      result[recommendation].push(holding)
    })

    return result
  }, [data])

  const runAnalysis = async () => {
    setRunning(true)

    try {
      await apiService.runAnalysis()
      toast.success('Analysis Completed')
      refetch()
    } catch (apiError) {
      toast.error(apiError.response?.data?.message || 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }
  const [showInfo, setShowInfo] = useState(false)

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Analysis</h2>
          <p className="text-sm text-slate-500">Run the rules engine using holdings and Yahoo Finance data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runAnalysis} disabled={running}>
            {running ? 'Running...' : 'Run Analysis'}
          </Button>
          <button
            type="button"
            aria-label="How score is calculated"
            title="How score is calculated"
            onClick={() => setShowInfo(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <FiInfo className="h-5 w-5" />
          </button>
        </div>
      </div>

      {Object.entries(groups).map(([recommendation, items]) => (
        <section key={recommendation}>
          <h3 className="mb-3 text-lg font-semibold">{recommendation}</h3>
          {items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Card key={item.symbol} title={item.symbol} value={formatMoney(item.currentPrice)}>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Recommendation: {item.recommendation || 'Not analyzed'}</p>
                    <p>Score: {formatNumber(item.score ?? 0, 0)}</p>
                    <p>Profit: {formatMoney(item.profitLoss)}</p>
                    <p>Reason: {item.reason || 'Run analysis to generate reason'}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No stocks in this group.</p>
          )}
        </section>
      ))}
      {showInfo ? (
        <Modal title="How the analysis score is calculated" onClose={() => setShowInfo(false)}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>The score is built from several rules. Each passed rule gives 1 point:</p>
            <ul className="ml-4 list-disc">
              <li>PE &lt; configured PE max</li>
              <li>PB &lt; configured PB max</li>
              <li>ROE &gt; configured ROE min</li>
              <li>Debt/Equity &lt; configured max</li>
              <li>Weekly price drop ≥ configured percent</li>
              <li>Current price is sufficiently below 52-week high</li>
            </ul>
            <p className="mt-2">Recommendation thresholds:</p>
            <ul className="ml-4 list-disc">
              <li>Score ≥ 4 → Buy Opportunity</li>
              <li>Score 2–3 → Hold</li>
              <li>Score ≤ 1 → Review</li>
            </ul>
            <p className="mt-2">Notes:</p>
            <ul className="ml-4 list-disc">
              <li>Missing market fields do not automatically fail the stock — that rule is skipped.</li>
              <li>Reasons shown are the rules that passed (or failed) for the stock.</li>
              <li>Rules are configurable on the backend (PE, PB, ROE, etc.).</li>
            </ul>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default AnalysisPage
