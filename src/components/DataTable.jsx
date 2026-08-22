import EmptyState from './EmptyState'
import Loader from './Loader'

const DataTable = ({ columns, rows, loading, emptyMessage = 'No records found' }) => {
  if (loading) return <Loader />

  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
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
            {rows.map((row, index) => (
              <tr key={row.id || `${row.symbol || 'row'}-${index}`} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row, index) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
