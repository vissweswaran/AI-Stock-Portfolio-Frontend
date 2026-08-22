import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FiActivity, FiBriefcase, FiShield, FiShoppingCart, FiZap } from 'react-icons/fi'
import Card from './Card'
import { formatMoney } from '../utils/formatters'

const formatDiffPercent = (currentValue, investedAmount, profitPercentage) => {
  if (Number.isFinite(Number(profitPercentage))) {
    const pct = Number(profitPercentage)
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  if (!investedAmount) return '—'

  const pct = ((currentValue - investedAmount) / investedAmount) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

const getDiffPercentValue = (currentValue, investedAmount, profitPercentage) => {
  if (Number.isFinite(Number(profitPercentage))) return Number(profitPercentage)
  if (!investedAmount) return null
  return ((currentValue - investedAmount) / investedAmount) * 100
}

const STOCK_COLORS = ['#3b66d6', '#45a76e', '#ed8d32', '#d94444', '#7c3aed', '#0891b2']

const SECTOR_STYLES = [
  { match: /consumer cyclical/i, color: '#3b66d6', lightColor: '#93c5fd', Icon: FiShoppingCart },
  { match: /health/i, color: '#45a76e', lightColor: '#86efac', Icon: FiActivity },
  { match: /consumer defensive/i, color: '#ed8d32', lightColor: '#fdba74', Icon: FiShield },
  { match: /energy/i, color: '#d94444', lightColor: '#fca5a5', Icon: FiZap },
]

const getSectorStyle = (sector, index) => {
  const matched = SECTOR_STYLES.find(({ match }) => match.test(sector))
  if (matched) return matched

  const color = STOCK_COLORS[index % STOCK_COLORS.length]
  return { color, lightColor: `${color}55`, Icon: FiBriefcase }
}

const formatProfitLabel = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}`
}

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
  const pct = payload?.percent ?? 0
  if (pct < 8) return null

  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${pct.toFixed(1)}%`}
    </text>
  )
}

const renderProfitLabel = ({ x, y, width, height, value }) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null

  const isPositive = num >= 0

  return (
    <text
      x={x + width / 2}
      y={isPositive ? y - 6 : y + height + 14}
      fill="#334155"
      textAnchor="middle"
      fontSize={11}
    >
      {formatProfitLabel(num)}
    </text>
  )
}

const buildSectorData = (sectorBreakdown, holdings) => {
  if (sectorBreakdown.length) {
    return sectorBreakdown.map((sector) => ({
      sector: sector.sector,
      currentValue: sector.currentValue || 0,
      investedAmount: sector.investedAmount || 0,
      profitPercentage: sector.profitPercentage,
    }))
  }

  const grouped = {}

  holdings.forEach((holding) => {
    const sector = holding.sector || 'Unknown'
    if (!grouped[sector]) {
      grouped[sector] = { sector, currentValue: 0, investedAmount: 0 }
    }
    grouped[sector].currentValue += holding.currentValue || 0
    grouped[sector].investedAmount += holding.investedAmount || 0
  })

  return Object.values(grouped)
}

const PortfolioAllocation = ({ allocation, totalValue }) => {
  if (!allocation.length) return null

  return (
    <Card title="Portfolio Allocation" subtitle="Current value distribution by stock">
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[10.5rem_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[10.5rem]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="88%"
                paddingAngle={2}
                label={renderPieLabel}
                labelLine={false}
              >
                {allocation.map((item) => (
                  <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
            <p className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
              {formatMoney(totalValue)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Total Value</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {allocation.map((item) => (
            <li key={item.name} className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 leading-snug text-slate-600">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="text-slate-400"> | </span>
                {formatMoney(item.value)}
                <span className="text-slate-400"> ({item.percent.toFixed(1)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

const SectorAllocation = ({ sectors }) => {
  const rows = useMemo(
    () =>
      [...sectors]
        .filter((sector) => sector.currentValue > 0 || sector.investedAmount > 0)
        .sort((a, b) => b.currentValue - a.currentValue)
        .map((sector, index) => ({
          ...sector,
          style: getSectorStyle(sector.sector, index),
        })),
    [sectors],
  )

  const maxValue = useMemo(
    () =>
      rows.reduce(
        (max, row) => Math.max(max, row.currentValue, row.investedAmount),
        0,
      ),
    [rows],
  )

  if (!rows.length) return null

  return (
    <Card title="Sector Allocation" subtitle="Current Value vs Invested Amount by Sector">
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-600" />
          Current Value (INR)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-200" />
          Invested Amount (INR)
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border-b border-slate-200 pb-3 text-xs font-medium text-slate-500">
        <span>Sector</span>
        <span className="text-right">Amount (INR)</span>
        <span className="min-w-[4.5rem] text-right">Change</span>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map(({ sector, currentValue, investedAmount, profitPercentage, style }) => {
          const { color, lightColor, Icon } = style
          const currentWidth = maxValue > 0 ? (currentValue / maxValue) * 100 : 0
          const investedWidth = maxValue > 0 ? (investedAmount / maxValue) * 100 : 0
          const diffValue = getDiffPercentValue(currentValue, investedAmount, profitPercentage)
          const diffLabel = formatDiffPercent(currentValue, investedAmount, profitPercentage)
          const diffTone =
            diffValue == null
              ? 'text-slate-400'
              : diffValue >= 0
                ? 'text-emerald-600'
                : 'text-red-500'

          return (
            <div
              key={sector}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-5 sm:gap-6"
            >
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0 space-y-3">
                  <p className="text-sm font-medium text-slate-800">{sector}</p>
                  <div className="space-y-2.5">
                    <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${currentWidth}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${investedWidth}%`, backgroundColor: lightColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-[6.5rem] shrink-0 text-right text-sm leading-6">
                <p className="font-semibold" style={{ color }}>
                  {formatMoney(currentValue)}
                </p>
                <p className="text-slate-500">{formatMoney(investedAmount)}</p>
              </div>

              <p className={`min-w-[4.5rem] shrink-0 text-right text-sm font-semibold ${diffTone}`}>
                {diffLabel}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const ProfitDistribution = ({ profitData }) => {
  if (!profitData.length) return null

  return (
    <Card title="Portfolio Profit Distribution" subtitle="Profit / Loss by stock (in INR)">
      <div className="mt-4 h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={profitData} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="symbol"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={48}
            />
            <YAxis
              width={44}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Profit / Loss (INR)',
                angle: -90,
                position: 'insideLeft',
                offset: 4,
                style: { fontSize: 11, fill: '#64748b', textAnchor: 'middle' },
              }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Tooltip formatter={(value) => formatMoney(value)} />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {profitData.map((item) => (
                <Cell key={item.symbol} fill={item.color} />
              ))}
              <LabelList dataKey="profit" content={renderProfitLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

const PortfolioCharts = ({ holdings = [], sectorBreakdown = [] }) => {
  const colorMap = useMemo(() => {
    const map = {}
    holdings.forEach((holding, index) => {
      map[holding.symbol] = STOCK_COLORS[index % STOCK_COLORS.length]
    })
    return map
  }, [holdings])

  const { allocation, totalValue } = useMemo(() => {
    const items = holdings
      .map((holding) => ({
        name: holding.symbol,
        value: holding.currentValue || holding.investedAmount || 0,
      }))
      .filter((item) => item.value > 0)

    const total = items.reduce((sum, item) => sum + item.value, 0)

    return {
      allocation: items.map((item) => ({
        ...item,
        percent: total > 0 ? (item.value / total) * 100 : 0,
        color: colorMap[item.name],
      })),
      totalValue: total,
    }
  }, [holdings, colorMap])

  const sectorData = useMemo(
    () => buildSectorData(sectorBreakdown, holdings),
    [sectorBreakdown, holdings],
  )

  const profitData = useMemo(
    () =>
      holdings.map((holding) => ({
        symbol: holding.symbol,
        profit: holding.profitLoss || 0,
        color: colorMap[holding.symbol],
      })),
    [holdings, colorMap],
  )

  if (!sectorData.length && !holdings.length) return null

  return (
    <div className="space-y-4">
      {holdings.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          <PortfolioAllocation allocation={allocation} totalValue={totalValue} />
          <ProfitDistribution profitData={profitData} />
        </div>
      )}

      {sectorData.length > 0 && <SectorAllocation sectors={sectorData} />}
    </div>
  )
}

export default PortfolioCharts
