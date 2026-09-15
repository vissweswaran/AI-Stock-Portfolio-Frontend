import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import StockDataSync from '../components/StockDataSync'
import { formatDateTime, formatMoney, formatNumber } from '../utils/formatters'

const gradeBadge = (grade) => {
  const value = String(grade || '').toUpperCase()
  if (['A+', 'A'].includes(value)) return 'bg-emerald-50 text-emerald-700'
  if (value === 'B') return 'bg-blue-50 text-blue-700'
  if (value === 'C') return 'bg-amber-50 text-amber-700'
  if (value === 'D') return 'bg-orange-50 text-orange-700'
  if (value === 'F') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

const scoreClass = (score) => {
  if (score == null) return 'text-slate-700'
  if (score >= 70) return 'text-emerald-700'
  if (score >= 50) return 'text-amber-700'
  return 'text-red-700'
}

const factorBarClass = (value) => {
  if (value >= 70) return 'bg-emerald-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

const declineTone = (value) => {
  const text = String(value || '').toUpperCase()
  if (text.includes('TEMPORARY')) return 'text-amber-700'
  if (text.includes('STRUCTURAL')) return 'text-red-700'
  return 'text-slate-700'
}

const statusBadge = (status) => {
  const value = String(status || '').toUpperCase()
  if (value === 'COMPLETED') return 'bg-emerald-50 text-emerald-700'
  if (value === 'FAILED') return 'bg-red-50 text-red-700'
  if (value === 'INSUFFICIENT_DATA') return 'bg-amber-50 text-amber-700'
  if (value === 'RUNNING') return 'bg-blue-50 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}

const statusLabel = (status) => {
  const value = String(status || '').toUpperCase()
  if (value === 'COMPLETED') return 'Analyzed'
  if (value === 'FAILED') return 'Failed'
  if (value === 'INSUFFICIENT_DATA') return 'Insufficient data'
  if (value === 'RUNNING') return 'Running'
  return 'Not analyzed'
}

const syncStatusBadge = (status) => {
  const value = String(status || '').toUpperCase()
  const tone = {
    SYNCED: 'bg-emerald-50 text-emerald-700',
    REUSED: 'bg-blue-50 text-blue-700',
    ERROR: 'bg-red-50 text-red-700',
  }[value]
  if (!tone) return <span className="text-slate-400">—</span>
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {value}
    </span>
  )
}

const decisionTone = (decision) => {
  const value = String(decision || '').toUpperCase()
  if (value === 'BUY' || value === 'ADD') return 'bg-emerald-50 text-emerald-700'
  if (value === 'HOLD') return 'bg-blue-50 text-blue-700'
  if (value === 'SELL') return 'bg-red-50 text-red-700'
  if (value.includes("DON'T") || value === 'DONT_ADD') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

const readinessBadge = (readiness) => {
  const value = String(readiness || '').toUpperCase()
  if (value === 'COMPLETED' || value === 'READY') return 'bg-emerald-50 text-emerald-700'
  if (value === 'PARTIAL') return 'bg-amber-50 text-amber-700'
  if (value === 'INSUFFICIENT' || value === 'FAILED') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

const dcfConfidenceBadge = (confidence) => {
  const value = String(confidence || '').toUpperCase()
  if (value === 'HIGH') return 'bg-emerald-50 text-emerald-700'
  if (value === 'MEDIUM') return 'bg-amber-50 text-amber-700'
  if (value === 'LOW') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

const pct = (value, digits = 1) => {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${formatNumber(Number(value) * 100, digits)}%`
}

const inrCr = (value, digits = 0) => {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `₹${formatNumber(Number(value) / 1e7, digits)} Cr`
}

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-3">
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
  </div>
)

const FactorScores = ({ factorScores }) => {
  if (!factorScores || !Object.keys(factorScores).length) {
    return <p className="text-sm text-slate-500">No factor scores available.</p>
  }
  return (
    <div className="space-y-2">
      {Object.entries(factorScores).map(([name, value]) => (
        <div key={name}>
          <div className="flex justify-between text-xs text-slate-600">
            <span>{name}</span>
            <span className="font-medium">{formatNumber(value, 0)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-slate-200">
            <div
              className={`h-2 rounded ${factorBarClass(value)}`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const MetricField = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-900">{value ?? '—'}</span>
  </div>
)

const FundamentalHealth = ({ metrics }) => {
  if (!metrics) return <p className="text-sm text-slate-500">No fundamentals available.</p>

  const g = metrics.growth || {}
  const p = metrics.profitability || {}
  const f = metrics.financialStrength || {}
  const c = metrics.cashFlow || {}
  const v = metrics.valuation || {}
  const d = metrics.dividend || {}
  const o = metrics.ownership || {}

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div>
        <SectionTitle title="Growth" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="Revenue YoY" value={pct(g.revYoY)} />
          <MetricField label="Revenue 3Y CAGR" value={pct(g.revCagr3)} />
          <MetricField label="Revenue 5Y CAGR" value={pct(g.revCagr5)} />
          <MetricField label="Net income YoY" value={pct(g.niYoY)} />
          <MetricField label="EPS YoY" value={pct(g.epsYoY)} />
          <MetricField label="EBITDA YoY" value={pct(g.ebitdaYoY)} />
        </div>
      </div>
      <div>
        <SectionTitle title="Profitability" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="Gross margin" value={pct(p.grossMargin)} />
          <MetricField label="Operating margin" value={pct(p.opMargin)} />
          <MetricField label="EBITDA margin" value={pct(p.ebitdaMargin)} />
          <MetricField label="Net margin" value={pct(p.netMargin)} />
          <MetricField label="ROE" value={pct(p.roe)} />
          <MetricField label="ROCE" value={pct(p.roce)} />
          <MetricField label="ROA" value={pct(p.roa)} />
        </div>
      </div>
      <div>
        <SectionTitle title="Financial strength" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="Debt / Equity" value={formatNumber(f.debtEquity)} />
          <MetricField label="Net debt" value={inrCr(f.netDebt)} />
          <MetricField label="Debt / EBITDA" value={formatNumber(f.debtToEbitda)} />
          <MetricField label="Interest coverage" value={formatNumber(f.interestCoverage)} />
          <MetricField label="Current ratio" value={formatNumber(f.currentRatio)} />
          <MetricField label="Cash / Debt" value={formatNumber(f.cashToDebt)} />
        </div>
      </div>
      <div>
        <SectionTitle title="Cash flow" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="Operating cash flow" value={inrCr(c.ocf)} />
          <MetricField label="Free cash flow" value={inrCr(c.fcf)} />
          <MetricField label="FCF margin" value={pct(c.fcfMargin)} />
          <MetricField label="FCF yield" value={pct(c.fcfYield)} />
          <MetricField label="FCF / Net income" value={formatNumber(c.fcfToNI)} />
          <MetricField label="OCF all positive" value={c.ocfAllPositive != null ? (c.ocfAllPositive ? 'Yes' : 'No') : '—'} />
        </div>
      </div>
      <div>
        <SectionTitle title="Valuation" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="P/E" value={formatNumber(v.pe)} />
          <MetricField label="Forward P/E" value={formatNumber(v.forwardPE ?? v.fwdPE)} />
          <MetricField label="P/B" value={formatNumber(v.priceToBook ?? v.pb)} />
          <MetricField label="EV / EBITDA" value={formatNumber(v.evToEbitda ?? v.evEbitda)} />
          <MetricField label="PEG" value={formatNumber(v.peg ?? v.pegRatio)} />
          <MetricField label="PE percentile" value={pct(v.pePercentile, 0)} />
          <MetricField label="Dividend yield" value={pct(d.dividendYield ?? v.dividendYield ?? v.divYieldVal)} />
        </div>
      </div>
      <div>
        <SectionTitle title="Dividend & ownership" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="Payout ratio" value={pct(d.payoutRatio ?? d.calcPayoutRatio)} />
          <MetricField label="Dividend years" value={d.divYears?.length != null ? `${d.divYears.length}` : '—'} />
          <MetricField label="Paying all years" value={d.allYearsPaying != null ? (d.allYearsPaying ? 'Yes' : 'No') : '—'} />
          <MetricField label="DPS growth" value={pct(d.dpsGrowth)} />
          <MetricField label="Insider holding" value={pct(o.insiderPct)} />
          <MetricField label="Institutional holding" value={pct(o.instPct)} />
        </div>
      </div>
    </div>
  )
}

const RedFlagsDetail = ({ redFlags, declineClassification }) => (
  <div>
    <details className="group rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
        <span>Red flags ({redFlags?.length ?? 0})</span>
        <span className="text-xs text-slate-400 group-open:hidden">Expand</span>
        <span className="hidden text-xs text-slate-400 group-open:inline">Collapse</span>
      </summary>
      {redFlags?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-red-700">
          {redFlags.map((flag, index) => (
            <li key={`flag-${index}`}>{flag}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">None detected by the backend.</p>
      )}
      {declineClassification ? (
        <p className={`mt-3 text-sm font-medium ${declineTone(declineClassification)}`}>
          Decline: {declineClassification}
        </p>
      ) : null}
    </details>
  </div>
)

const DataQualityDetail = ({ dataQuality }) => {
  if (!dataQuality) return null
  const datasets = dataQuality.datasets || {}

  return (
    <div>
      <SectionTitle title="Data quality" />
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${readinessBadge(dataQuality.readiness)}`}>
          {dataQuality.readiness || '—'}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Coverage {dataQuality.dataCoverage != null ? `${formatNumber(dataQuality.dataCoverage, 0)}%` : '—'}
        </span>
        {dataQuality.lastUpdated ? (
          <span className="text-xs text-slate-500">Last updated {formatDateTime(dataQuality.lastUpdated)}</span>
        ) : null}
      </div>
      {Object.keys(datasets).length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(datasets).map(([name, value]) => (
            <div key={name} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">{name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${readinessBadge(value?.status)}`}>
                  {value?.status || '—'}
                </span>
              </div>
              {value?.reason ? <p className="mt-1 text-xs text-slate-500">{value.reason}</p> : null}
              {value?.provider ? (
                <p className="mt-1 text-xs text-slate-400">Provider: {value.provider}</p>
              ) : null}
              {value?.actionCount != null ? (
                <p className="mt-1 text-xs text-slate-400">{value.actionCount} actions</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {dataQuality.missing?.length ? (
        <p className="mt-3 text-sm text-amber-700">
          Missing: {dataQuality.missing.join(', ')}
        </p>
      ) : null}
    </div>
  )
}

const DecisionDetail = ({ decision }) => {
  if (!decision) return null

  return (
    <div>
      <SectionTitle title="Decision" />
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${decisionTone(decision.decision)}`}>
          {decision.decision || '—'}
        </span>
        <span className={`rounded-full bg-slate-100 px-3 py-1 text-xs font-medium ${decision.confidence ? 'text-slate-700' : ''}`}>
          Confidence {decision.confidence?.level || '—'}
          {decision.confidence?.numericScore != null
            ? ` · ${formatNumber(decision.confidence.numericScore, 0)}`
            : ''}
        </span>
      </div>

      {decision.reasons?.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600">Reasons</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
            {decision.reasons.map((reason, index) => (
              <li key={`reason-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {decision.warnings?.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-700">Warnings</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-amber-700">
            {decision.warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {decision.risk?.riskTriggers?.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-red-700">Risk triggers</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-red-700">
            {decision.risk.riskTriggers.map((trigger, index) => (
              <li key={`trigger-${index}`}>{trigger}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

const ValuationDetail = ({ analysis, valuation }) => {
  const v = analysis?.metrics?.valuation || {}
  const dcfAvailable =
    analysis?.dcfIntrinsicPerShare != null || analysis?.dcfUpside != null

  return (
    <div>
      <SectionTitle title="Valuation" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField label="P/E" value={formatNumber(v.pe)} />
          <MetricField label="Forward P/E" value={formatNumber(v.forwardPE ?? v.fwdPE)} />
          <MetricField label="P/B" value={formatNumber(v.priceToBook ?? v.pb)} />
          <MetricField label="EV / EBITDA" value={formatNumber(v.evToEbitda ?? v.evEbitda)} />
          <MetricField label="PEG" value={formatNumber(v.peg ?? v.pegRatio)} />
          <MetricField label="PE percentile" value={pct(v.pePercentile, 0)} />
          <MetricField label="FCF yield" value={pct(v.fcfYield)} />
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MetricField
            label="Valuation zone"
            value={valuation?.zoneLabel || '—'}
          />
          <MetricField label="Buy price" value={valuation?.price != null ? formatMoney(valuation.price) : 'Not provided by backend'} />
          <div>
            <p className="text-sm text-slate-500">DCF intrinsic / share</p>
            <p className="text-sm font-medium text-slate-900">
              {analysis?.dcfIntrinsicPerShare != null ? formatMoney(analysis.dcfIntrinsicPerShare) : 'Not computed'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">DCF upside</p>
            <p className={`text-sm font-medium ${analysis?.dcfUpside != null ? (analysis.dcfUpside >= 0 ? 'text-emerald-700' : 'text-red-700') : 'text-slate-900'}`}>
              {analysis?.dcfUpside != null ? pct(analysis.dcfUpside, 0) : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">DCF confidence</p>
            {analysis?.dcfConfidence ? (
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${dcfConfidenceBadge(analysis.dcfConfidence)}`}>
                {analysis.dcfConfidence}
              </span>
            ) : (
              <p className="text-sm text-slate-900">Not computed</p>
            )}
          </div>
        </div>
      </div>
      {!dcfAvailable ? (
        <p className="mt-3 text-sm text-slate-500">
          DCF is not computed by the backend for this stock (e.g. banks / NBFCs or missing data).
        </p>
      ) : analysis?.dcfConfidenceReasons?.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600">DCF confidence reasons</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
            {analysis.dcfConfidenceReasons.map((reason, index) => (
              <li key={`dcf-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

const AnalysisDetail = ({ symbol, analysis, decision, holding, hasRow, valuation }) => {
  if (!hasRow) {
    return (
      <div className="space-y-4 text-sm">
        <p className="font-medium text-slate-700">{symbol} is not analyzed yet.</p>
        <p className="text-slate-500">
          Run <span className="font-semibold">Analyze Portfolio</span> to compute the backend
          sector score, DCF valuation and decision for this holding.
        </p>
      </div>
    )
  }

  if (analysis?.status === 'FAILED' || analysis?.status === 'INSUFFICIENT_DATA') {
    return (
      <div className="space-y-4 text-sm">
        <div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(analysis.status)}`}>
            {statusLabel(analysis.status)}
          </span>
        </div>
        <p className="text-red-700">{analysis.errorMessage || 'No error detail provided by backend.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle title="Overview" />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <MetricField label="Symbol" value={symbol} />
            <MetricField label="Company" value={analysis?.companyName || holding?.companyName || '—'} />
            <MetricField label="Sector" value={analysis?.sectorTitle || analysis?.sector || holding?.sector || '—'} />
            <MetricField label="Current price" value={holding?.currentPrice != null ? formatMoney(holding.currentPrice) : '—'} />
            <MetricField label="Average buy price" value={holding?.averageBuyPrice != null ? formatMoney(holding.averageBuyPrice) : '—'} />
            <MetricField label="Overall score" value={analysis?.overallScore != null ? formatNumber(analysis.overallScore, 0) : '—'} />
            <MetricField label="Grade" value={analysis?.grade || '—'} />
            <MetricField label="Data coverage" value={analysis?.dataCoverage != null ? `${formatNumber(analysis.dataCoverage, 0)}%` : '—'} />
            <MetricField label="Data source" value={analysis?.dataSource || '—'} />
            <MetricField label="Completed at" value={analysis?.completedAt ? formatDateTime(analysis.completedAt) : '—'} />
          </div>
        </div>
        <div>
          <SectionTitle title="Factor scores" subtitle="Sector-aware criteria scores from the backend" />
          <FactorScores factorScores={analysis?.factorScores} />
        </div>
      </div>

      <div>
        <SectionTitle title="Fundamental health" subtitle="All values computed and persisted by the backend" />
        <FundamentalHealth metrics={analysis?.metrics} />
      </div>

      <div>
        <ValuationDetail analysis={analysis} valuation={valuation} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle title="Red flags" />
          <RedFlagsDetail
            redFlags={analysis?.redFlags}
            declineClassification={analysis?.declineClassification}
          />
        </div>
        <div>
          <DataQualityDetail dataQuality={decision?.dataQuality} />
        </div>
      </div>

      <div>
        <DecisionDetail decision={decision} />
      </div>
    </div>
  )
}

const SmartAnalysisPage = () => {
  const dashboardApi = useApi(() => apiService.getDashboard(), [])
  const portfolioApi = useApi(() => apiService.getAnalysisPortfolio(), [])
  const [analyzing, setAnalyzing] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [portfolioSyncResult, setPortfolioSyncResult] = useState(null)
  const [expandedSymbols, setExpandedSymbols] = useState(() => new Set())

  const holdings = useMemo(() => dashboardApi.data?.holdings || [], [dashboardApi.data])
  const results = useMemo(() => portfolioApi.data?.results || [], [portfolioApi.data])
  const sectorRankings = useMemo(
    () => portfolioApi.data?.sectorRankings || {},
    [portfolioApi.data],
  )
  const decisions = useMemo(() => portfolioApi.data?.decisions || {}, [portfolioApi.data])

  const holdingsBySymbol = useMemo(() => {
    const map = {}
    for (const holding of holdings) {
      map[holding.symbol.toUpperCase()] = holding
    }
    return map
  }, [holdings])

  const resultsBySymbol = useMemo(() => {
    const map = {}
    for (const row of results) {
      map[row.symbol.toUpperCase()] = row
    }
    return map
  }, [results])

  const analyzedCount = results.filter((row) => row.status === 'COMPLETED').length
  const failedCount = results.filter((row) => row.status === 'FAILED').length

  const lastUpdated = useMemo(() => {
    let latestTimestamp = null
    for (const row of results) {
      if (row.status === 'COMPLETED' && row.completedAt) {
        if (!latestTimestamp || new Date(row.completedAt) > new Date(latestTimestamp)) {
          latestTimestamp = row.completedAt
        }
      }
    }
    return latestTimestamp
  }, [results])

  const gradeCounts = useMemo(() => {
    const counts = {}
    for (const row of results) {
      if (row.status === 'COMPLETED' && row.grade) {
        counts[row.grade] = (counts[row.grade] || 0) + 1
      }
    }
    return counts
  }, [results])
  const gradeSummary = Object.entries(gradeCounts)
    .sort((first, second) => second[1] - first[1])
    .map(([grade, count]) => `${grade} ${count}`)
    .join(' · ')

  const sectorList = useMemo(
    () =>
      Object.values(sectorRankings).sort(
        (first, second) => (first.sectorRank ?? 0) - (second.sectorRank ?? 0),
      ),
    [sectorRankings],
  )

  const toggleExpand = (symbol) => {
    setExpandedSymbols((current) => {
      const next = new Set(current)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const handleAnalyze = async () => {
    if (analyzing) return
    if (holdings.length === 0) {
      toast.error('No holdings to analyze')
      return
    }

    setAnalyzing(true)
    try {
      const result = await apiService.analyzeAnalysisPortfolio({
        force: true,
        symbols: holdings.map((holding) => holding.symbol),
        concurrency: 2,
      })

      if (result?.status === 'NO_STOCKS') {
        toast.error(result.message || 'No stocks available to analyze')
      } else {
        const completed = result?.completedCount ?? 0
        const failed = result?.failedCount ?? 0
        if (completed === 0 && failed > 0) {
          toast.error(`Analysis failed — ${failed} stock(s) could not be analyzed`)
        } else if (failed > 0) {
          toast(`Analysis complete — ${completed} analyzed, ${failed} failed`)
        } else {
          toast.success(`Analysis complete — ${completed} analyzed`)
        }
      }

      await Promise.all([dashboardApi.refetch(), portfolioApi.refetch()])
    } catch (apiError) {
      toast.error(apiError.response?.data?.message || apiError.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSyncPortfolio = async () => {
    if (syncLoading) return
    if (holdings.length === 0) {
      toast.error('No holdings to sync')
      return
    }

    setSyncLoading(true)
    setPortfolioSyncResult(null)

    try {
      const result = await apiService.syncPortfolioData()
      setPortfolioSyncResult(result || null)

      const failed = result?.errors?.length || 0
      const processed = result?.stocksProcessed ?? holdings.length
      if (result?.success === false || failed > 0) {
        toast(
          `Data sync completed with warnings — ${processed ?? 0} stock(s), ${failed} with errors`,
        )
      } else if ((processed ?? 0) === 0) {
        toast('Data sync completed — no stocks required updates')
      } else {
        toast.success(`Portfolio data sync completed — ${processed} stock(s) processed`)
      }

      await Promise.all([dashboardApi.refetch(), portfolioApi.refetch()])
    } catch (apiError) {
      const message =
        apiError.response?.data?.message || apiError.message || 'Unable to sync portfolio data'
      setPortfolioSyncResult({ error: message })
      toast.error(message)
    } finally {
      setSyncLoading(false)
    }
  }

  const handleStockSynced = async () => {
    await Promise.all([dashboardApi.refetch(), portfolioApi.refetch()])
  }

  const loading = dashboardApi.loading || portfolioApi.loading
  const error = dashboardApi.error || portfolioApi.error

  if (loading) return <Loader />
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => {
          dashboardApi.refetch()
          portfolioApi.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Smart Analysis</h2>
        <p className="text-sm text-slate-500">
          Sector-scored fundamental analysis with DCF valuation, computed by the backend.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            <p>
              <span className="font-medium text-slate-700">Latest Analysis:</span>{' '}
              {lastUpdated ? formatDateTime(lastUpdated) : 'Not analyzed yet'}
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-700">Latest Data Sync:</span>{' '}
              {portfolioSyncResult?.error ? (
                <span className="font-medium text-red-700">{portfolioSyncResult.error}</span>
              ) : portfolioSyncResult?.stocksProcessed != null ? (
                <span className="font-medium text-emerald-700">
                  {portfolioSyncResult.stocksProcessed ?? 0} stock(s) processed
                  {(portfolioSyncResult.errors?.length ?? 0) > 0
                    ? ` · ${portfolioSyncResult.errors.length} with errors`
                    : ''}
                </span>
              ) : (
                <span>Run Sync Data to update stored values</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Sync Data updates stored market, financial, ownership and corporate action data.
              Analyze recalculates scores and decisions from stored data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleSyncPortfolio}
              disabled={syncLoading}
              aria-busy={syncLoading}
              title="Fetch and update stored market data, financial facts, ownership and corporate actions from backend providers."
            >
              {syncLoading ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={analyzing}
              aria-busy={analyzing}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
            </Button>
          </div>
        </div>
      </div>

      {portfolioSyncResult?.results?.length ? (
        <Card title="Sync Results" subtitle="Backend per-stock dataset sync outcome (SYNCED/REUSED/ERROR)">
          <div className="mt-4">
            <div className="table-shell">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Market</th>
                      <th>Financial</th>
                      <th>Ownership</th>
                      <th>Corporate</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolioSyncResult.results.map((item) => (
                      <tr key={item.symbol} className="hover:bg-slate-50">
                        <td className="font-medium text-slate-900">{item.symbol}</td>
                        <td>{syncStatusBadge(item.marketData ?? item.marketDataStatus ?? item.market)}</td>
                        <td>{syncStatusBadge(item.financialData ?? item.financialDataStatus ?? item.financial)}</td>
                        <td>{syncStatusBadge(item.ownership ?? item.ownershipStatus)}</td>
                        <td>{syncStatusBadge(item.corporateActions ?? item.corporateActionsStatus ?? item.corporate)}</td>
                        <td className="max-w-[12rem] text-xs text-slate-500">
                          {item.errors?.length
                            ? item.errors.join('; ')
                            : (item.marketData ?? item.financialData ?? item.ownership ?? item.corporateActions) ? 'OK' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Synced stock(s) indicate backend had existing data (REUSED) or refreshed it (SYNCED).
              Errors indicate provider or validation failures. Stock-level data sync
              triggers do not recalculate analysis — use Analyze separately.
            </p>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Holdings" value={formatNumber(holdings.length, 0)} subtitle="From current portfolio" />
        <Card title="Analyzed" value={formatNumber(analyzedCount, 0)} subtitle={`${failedCount} failed`} />
        <Card title="Grades" value={gradeSummary || '—'} subtitle="Backend grade distribution" />
        <Card title="Latest Analysis" value={lastUpdated ? formatDateTime(lastUpdated) : 'Never'} subtitle="Backend completedAt timestamp" />
      </div>

      <Card title="Holdings Analysis" subtitle="One row per current holding; unanalyzed holdings show —">
        {holdings.length === 0 ? (
          <EmptyState message="No holdings yet. Add buy transactions to get started." />
        ) : (
          <div className="mt-4">
            <div className="table-shell">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th>Sector</th>
                      <th>Grade</th>
                      <th>Score</th>
                      <th>Price</th>
                      <th>Decision</th>
                      <th>DCF / Share</th>
                      <th>DCF Upside</th>
                      <th>Red Flags</th>
                      <th>Coverage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {holdings.map((holding) => {
                      const symbol = holding.symbol
                      const key = symbol.toUpperCase()
                      const analysis = resultsBySymbol[key]
                      const decision = decisions[key]
                      const isExpanded = expandedSymbols.has(key)

                      return [
                        <tr key={symbol} className="hover:bg-slate-50">
                          <td>
                            <button
                              type="button"
                              onClick={() => toggleExpand(key)}
                              className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                            >
                              {symbol}
                              <span className="text-xs text-slate-400">{isExpanded ? '−' : '+'}</span>
                            </button>
                          </td>
                          <td>{holding.companyName || '—'}</td>
                          <td>{analysis?.sectorTitle || holding.sector || '—'}</td>
                          <td>
                            {analysis?.grade ? (
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${gradeBadge(analysis.grade)}`}>
                                {analysis.grade}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={`font-semibold ${scoreClass(analysis?.overallScore)}`}>
                            {analysis?.overallScore != null ? formatNumber(analysis.overallScore, 0) : '—'}
                          </td>
                          <td>{holding.currentPrice != null ? formatMoney(holding.currentPrice) : '—'}</td>
                          <td>
                            {decision?.decision ? (
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${decisionTone(decision.decision)}`}>
                                {decision.decision}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td>{formatMoney(analysis?.dcfIntrinsicPerShare)}</td>
                          <td className={analysis?.dcfUpside != null && analysis.dcfUpside >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                            {analysis?.dcfUpside != null ? pct(analysis.dcfUpside, 0) : '—'}
                          </td>
                          <td>
                            {analysis?.redFlags?.length ? (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                {analysis.redFlags.length}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td>
                            {analysis?.dataCoverage != null
                              ? `${formatNumber(analysis.dataCoverage, 0)}%`
                              : '—'}
                          </td>
                          <td>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(analysis?.status)}`}>
                              {statusLabel(analysis?.status)}
                            </span>
                          </td>
                        </tr>,
                        isExpanded ? (
                          <tr key={`${symbol}-detail`} className="bg-slate-50">
                            <td colSpan={12} className="space-y-4 p-4">
                              <StockDataSync symbol={key} onSynced={handleStockSynced} />
                              {analysis?.status === 'COMPLETED' ? (
                                <AnalysisDetailWithValuation
                                  symbol={key}
                                  analysis={analysis}
                                  decision={decision}
                                  holding={holding}
                                  hasRow
                                />
                              ) : (
                                <AnalysisDetail
                                  symbol={key}
                                  analysis={analysis}
                                  decision={decision}
                                  holding={holding}
                                  hasRow={Boolean(analysis)}
                                />
                              )}
                            </td>
                          </tr>
                        ) : null,
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      {sectorList.length ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Sector Rankings</h3>
            <p className="text-sm text-slate-500">Sectors ranked by average backend score.</p>
          </div>
          {sectorList.map((sector) => (
            <Card key={sector.sectorKey}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{sector.sectorTitle || sector.sectorKey}</p>
                  <p className="text-sm text-slate-500">Backend sector rank #{sector.sectorRank ?? '—'}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-slate-500">Avg score</p>
                    <p className={`font-semibold ${scoreClass(sector.avgScore)}`}>
                      {sector.avgScore != null ? formatNumber(sector.avgScore, 0) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Stocks</p>
                    <p className="font-semibold text-slate-900">{sector.stocks.length}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 table-shell">
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Symbol</th>
                        <th>Company</th>
                        <th>Grade</th>
                        <th>Score</th>
                        <th>Price</th>
                        <th>DCF / Share</th>
                        <th>DCF Upside</th>
                        <th>Red Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sector.stocks.map((stock) => {
                        const symbol = stock.symbol.toUpperCase()
                        const stockHolding = holdingsBySymbol[symbol]
                        const stockAnalysis = resultsBySymbol[symbol]
                        return (
                          <tr key={symbol} className="hover:bg-slate-50">
                            <td className="font-medium text-slate-700">#{stock.rank ?? '—'}</td>
                            <td className="font-medium text-blue-600">{stock.symbol}</td>
                            <td>{stock.companyName || '—'}</td>
                            <td>
                              {stock.grade ? (
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${gradeBadge(stock.grade)}`}>
                                  {stock.grade}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className={`font-semibold ${scoreClass(stock.overallScore)}`}>
                              {stock.overallScore != null ? formatNumber(stock.overallScore, 0) : '—'}
                            </td>
                            <td>{stockHolding?.currentPrice != null ? formatMoney(stockHolding.currentPrice) : '—'}</td>
                            <td>{formatMoney(stock.dcfIntrinsicPerShare)}</td>
                            <td className={stock.dcfUpside != null && stock.dcfUpside >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                              {stock.dcfUpside != null ? pct(stock.dcfUpside, 0) : '—'}
                            </td>
                            <td>
                              {stockAnalysis?.redFlags?.length ? (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                  {stockAnalysis.redFlags.length}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="Analyze your portfolio to see sector rankings." />
      )}
    </div>
  )
}

const AnalysisDetailWithValuation = ({ symbol, analysis, decision, holding }) => {
  const mergedApi = useApi(() => apiService.getMergedAnalysis(symbol), [symbol])
  const valuation = mergedApi.data?.valuation

  return (
    <div>
      {mergedApi.loading ? (
        <p className="mb-3 text-xs text-slate-500">Loading enriched valuation data…</p>
      ) : null}
      <AnalysisDetail
        symbol={symbol}
        analysis={analysis}
        decision={decision}
        holding={holding}
        hasRow
        valuation={valuation}
      />
    </div>
  )
}

export default SmartAnalysisPage