import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'

const friendly = (value) =>
  String(value || 'N/A')
    .replaceAll('_', ' ')
    .toUpperCase()

const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  return String(value)
}

const formatThreshold = (threshold, rule) => {
  if (threshold === null || threshold === undefined) {
    if (rule === 'PositiveOCF') return '5 years required'
    return 'N/A'
  }

  return rule === 'PositiveOCF' ? `${threshold} years required` : threshold
}

const rowClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PASS') return 'bg-emerald-50 text-emerald-700'
  if (normalized === 'FAIL') return 'bg-red-50 text-red-700'
  if (normalized === 'SKIPPED') return 'bg-slate-100 text-slate-700'
  if (normalized === 'INSUFFICIENT_DATA') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

const FundamentalRulesPage = () => {
  const { data, loading, error, refetch } = useApi(() => apiService.getScores(), [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  const results = data?.results || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Fundamental Rules</h2>
        <p className="text-sm text-slate-500">Detailed Phase 6 rule-by-rule analysis for each portfolio stock.</p>
      </div>

      {results.map((stock) => {
        const score = stock.score || {}
        const rules = stock.rules || []
        const insufficientCount = rules.filter((rule) => rule.status === 'INSUFFICIENT_DATA').length

        return (
          <Card key={stock.symbol}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{stock.symbol}</h3>
                <p className="text-sm text-slate-500">{stock.calculations?.companyName || stock.calculations?.company || 'Portfolio stock'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
                <div>
                  <p className="text-slate-500">Passed</p>
                  <p className="font-semibold text-slate-900">{score.passed ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Failed</p>
                  <p className="font-semibold text-slate-900">{score.failed ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Skipped</p>
                  <p className="font-semibold text-slate-900">{score.skipped ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Evaluated</p>
                  <p className="font-semibold text-slate-900">{score.evaluated ?? 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Normalized</p>
                  <p className="font-semibold text-slate-900">{formatValue(score.normalizedPercent)}%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Rule</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.rule}>
                      <td className="px-4 py-3 font-medium text-slate-900">{rule.rule}</td>
                      <td className="px-4 py-3 text-slate-700">{formatValue(rule.value)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatThreshold(rule.threshold, rule.rule)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rowClass(rule.status)}`}>
                          {friendly(rule.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{rule.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-5 text-sm">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">PASS</p>
                <p className="text-lg font-semibold text-emerald-700">{score.passed ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">FAIL</p>
                <p className="text-lg font-semibold text-red-700">{score.failed ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">SKIPPED</p>
                <p className="text-lg font-semibold text-slate-700">{score.skipped ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">INSUFFICIENT DATA</p>
                <p className="text-lg font-semibold text-amber-700">{insufficientCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">Normalized %</p>
                <p className="text-lg font-semibold text-slate-900">{formatValue(score.normalizedPercent)}%</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Classification</p>
                <p className="font-medium text-slate-900">{stock.classification?.label || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reason</p>
                <p className="font-medium text-slate-900">{stock.reason || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Calculated At</p>
                <p className="font-medium text-slate-900">{stock.calculatedAt || data?.calculatedAt || 'N/A'}</p>
              </div>
            </div>
          </Card>
        )
      })}

      {!results.length ? <p className="text-sm text-slate-500">No score data available.</p> : null}
    </div>
  )
}

export default FundamentalRulesPage
