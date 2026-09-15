import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from './Button'
import useApi from '../hooks/useApi'
import apiService from '../services/api'

const DATASET_ROWS = [
  { key: 'MARKET', label: 'Market' },
  { key: 'FINANCIAL_FACTS', label: 'Financial' },
  { key: 'OWNERSHIP', label: 'Ownership' },
  { key: 'CORPORATE_ACTIONS', label: 'Corporate Actions' },
]

const toneFor = (status) => {
  const value = String(status || '').toUpperCase()
  if (['SYNCED', 'READY', 'UP_TO_DATE', 'COMPLETED'].includes(value)) return 'bg-emerald-50 text-emerald-700'
  if (value === 'REUSED') return 'bg-blue-50 text-blue-700'
  if (['PARTIAL', 'STALE', 'INSUFFICIENT_DATA'].includes(value)) return 'bg-amber-50 text-amber-700'
  if (['ERROR', 'FAILED'].includes(value)) return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

const StockDataSync = ({ symbol, onSynced }) => {
  const readinessApi = useApi(() => apiService.getAnalysisReadiness(symbol), [symbol])
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState(null)

  const handleSyncStock = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncResults(null)

    const results = {
      MARKET: null,
      FINANCIAL_FACTS: null,
      OWNERSHIP: null,
      CORPORATE_ACTIONS: null,
    }

    const run = async (key, apiCall) => {
      try {
        const response = await apiCall()
        results[key] = { status: 'SYNCED', message: '' }
        return response
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          `${key} sync failed`
        results[key] = { status: 'FAILED', message }
        return null
      }
    }

    await run('MARKET', () => apiService.syncMarketData(symbol))
    await run('FINANCIAL_FACTS', () => apiService.syncFinancialData(symbol))
    await run('OWNERSHIP', () => apiService.syncOwnershipData(symbol))
    await run('CORPORATE_ACTIONS', () => apiService.syncCorporateActions(symbol))

    setSyncResults(results)

    const failed = DATASET_ROWS.filter(
      (row) => results[row.key]?.status === 'FAILED',
    ).length
    const synced = DATASET_ROWS.filter(
      (row) => results[row.key]?.status === 'SYNCED',
    ).length

    if (failed === 0 && synced > 0) {
      toast.success(`${symbol} data sync completed.`)
    } else if (synced > 0) {
      toast(`Data sync completed with warnings — ${failed} dataset(s) failed.`)
    } else {
      toast.error(`Unable to sync ${symbol} data.`)
    }

    await Promise.all([readinessApi.refetch(), onSynced()])
    setSyncing(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Data status</p>
          <p className="text-xs text-slate-500">
            Stored data freshness reported by the backend.
          </p>
        </div>
        <Button
          onClick={handleSyncStock}
          disabled={syncing}
          aria-busy={syncing}
          variant="secondary"
        >
          {syncing ? 'Syncing Stock...' : 'Sync Stock Data'}
        </Button>
      </div>

      {readinessApi.loading ? (
        <p className="mt-3 text-xs text-slate-500">Loading data status…</p>
      ) : readinessApi.error ? (
        <p className="mt-3 text-xs text-red-700">{readinessApi.error}</p>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${toneFor(
                readinessApi.data?.overall,
              )}`}
            >
              {readinessApi.data?.overall || '—'}
            </span>
            <span className="text-xs text-slate-500">
              {readinessApi.data?.canCalculate
                ? 'Ready to calculate analysis'
                : 'Analysis may be limited'}
            </span>
            {readinessApi.data?.dataCoveragePercent != null ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Coverage {readinessApi.data.dataCoveragePercent}%
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DATASET_ROWS.map((row) => {
              const dataset = readinessApi.data?.datasets?.[row.key]
              const syncResult = syncResults?.[row.key]
              const status = syncResult?.status || dataset?.status || '—'
              return (
                <div key={row.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-600">{row.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneFor(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                  {syncResult?.message ? (
                    <p className="mt-1 text-xs text-red-700">{syncResult.message}</p>
                  ) : dataset?.reason ? (
                    <p className="mt-1 text-xs text-slate-500">{dataset.reason}</p>
                  ) : null}
                  {dataset?.ageDays != null &&
                  syncResult?.status !== 'FAILED' &&
                  syncResult?.status !== 'SYNCED' ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {dataset.ageDays} day(s) old
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {syncResults ? (
        <p className="mt-3 text-xs text-slate-500">
          Backend sync outcome shown above. Analysis is not re-run automatically —
          use Analyze to recalculate after syncing.
        </p>
      ) : null}
    </div>
  )
}

export default StockDataSync