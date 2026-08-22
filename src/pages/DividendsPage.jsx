import { useState } from 'react'
import Card from '../components/Card'
import DataTable from '../components/DataTable'
import ErrorMessage from '../components/ErrorMessage'
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatDate, formatMoney, formatNumber } from '../utils/formatters'

const currentYear = new Date().getFullYear()

const DividendsPage = () => {
  const [year, setYear] = useState(currentYear)
  const { data, loading, error, refetch } = useApi(() => apiService.getDividends(year), [year])

  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Dividends</h2>
          <p className="text-sm text-slate-500">Expected dividend based on total holdings.</p>
        </div>
        <input
          type="number"
          className="input max-w-xs"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>

      <Card title="Total Expected Dividend" value={formatMoney(data?.totalDividend || 0)} subtitle={`Year ${year}`} />

      <DataTable
        loading={loading}
        rows={data?.stocks || []}
        emptyMessage="No dividend data available"
        columns={[
          { key: 'symbol', title: 'Symbol' },
          { key: 'totalQuantity', title: 'Quantity', render: (row) => formatNumber(row.totalQuantity, 0) },
          { key: 'dividendPerShare', title: 'Dividend Per Share', render: (row) => formatMoney(row.dividendPerShare) },
          { key: 'totalDividend', title: 'Total Dividend', render: (row) => formatMoney(row.totalDividend) },
          { key: 'exDividendDate', title: 'Ex-Dividend Date', render: (row) => formatDate(row.exDividendDate) },
          { key: 'paymentDate', title: 'Payment Date', render: (row) => formatDate(row.paymentDate) },
        ]}
      />
    </div>
  )
}

export default DividendsPage
