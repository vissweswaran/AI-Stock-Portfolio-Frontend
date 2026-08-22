import { useMemo, useState } from 'react'
import DataTable from '../components/DataTable'
import ErrorMessage from '../components/ErrorMessage'
import SearchBox from '../components/SearchBox'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatMoney, formatNumber, formatPercent } from '../utils/formatters'

const HoldingsPage = () => {
  const { data, loading, error, refetch } = useApi(() => apiService.getDashboard(), [])
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [sortKey, setSortKey] = useState('symbol')

  const sectors = useMemo(
    () =>
      [...new Set((data?.holdings || []).map((holding) => holding.sector || 'Unknown'))].sort(
        (first, second) => first.localeCompare(second),
      ),
    [data],
  )

  const rows = useMemo(() => {
    const filtered = (data?.holdings || []).filter((holding) => {
      const matchesSearch = [holding.symbol, holding.companyName, holding.sector]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesSector =
        sectorFilter === 'all' || (holding.sector || 'Unknown') === sectorFilter

      return matchesSearch && matchesSector
    })

    return [...filtered].sort((first, second) => {
      const firstValue = first[sortKey]
      const secondValue = second[sortKey]

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return secondValue - firstValue
      }

      return String(firstValue || '').localeCompare(String(secondValue || ''))
    })
  }, [data, search, sectorFilter, sortKey])

  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Holdings</h2>
          <p className="text-sm text-slate-500">One calculated row per stock.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search holding" />
          <select
            className="input max-w-xs"
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
          >
            <option value="all">All Sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
          <select className="input max-w-xs" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="symbol">Sort by Symbol</option>
            <option value="sector">Sort by Sector</option>
            <option value="investedAmount">Sort by Investment</option>
            <option value="currentValue">Sort by Current Value</option>
            <option value="profitLoss">Sort by Profit/Loss</option>
            <option value="xirr">Sort by XIRR</option>
          </select>
        </div>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        emptyMessage="No holdings yet"
        columns={[
          { key: 'symbol', title: 'Symbol' },
          { key: 'companyName', title: 'Company' },
          { key: 'sector', title: 'Sector' },
          { key: 'totalQuantity', title: 'Total Quantity', render: (row) => formatNumber(row.totalQuantity, 0) },
          { key: 'averageBuyPrice', title: 'Average Buy Price', render: (row) => formatMoney(row.averageBuyPrice) },
          { key: 'currentPrice', title: 'Current Price', render: (row) => formatMoney(row.currentPrice) },
          { key: 'investedAmount', title: 'Total Investment', render: (row) => formatMoney(row.investedAmount) },
          { key: 'currentValue', title: 'Current Value', render: (row) => formatMoney(row.currentValue) },
          { key: 'profitLoss', title: 'Profit/Loss', render: (row) => formatMoney(row.profitLoss) },
          { key: 'profitPercentage', title: 'Profit %', render: (row) => formatPercent(row.profitPercentage) },
          { key: 'xirr', title: 'XIRR', render: (row) => formatPercent(row.xirr) },
        ]}
      />
    </div>
  )
}

export default HoldingsPage
