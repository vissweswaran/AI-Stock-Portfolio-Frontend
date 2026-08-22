import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import ErrorMessage from '../components/ErrorMessage'
import Input from '../components/Input'
import Modal from '../components/Modal'
import SearchBox from '../components/SearchBox'
import StockSearch from '../components/StockSearch' // New import
import useApi from '../hooks/useApi'
import apiService from '../services/api'
import { formatDate, formatMoney, formatNumber } from '../utils/formatters'

const emptyForm = {
  selectedStock: null, // Replaced symbol, companyName, exchange
  quantity: '',
  buyPrice: '',
  buyDate: '',
}

const validateForm = (form) => {
  const errors = {}

  if (!form.selectedStock) errors.selectedStock = 'Stock is required' // New validation
  if (!(Number(form.quantity) > 0)) errors.quantity = 'Quantity must be positive'
  if (!(Number(form.buyPrice) > 0)) errors.buyPrice = 'Buy price must be positive'
  if (!form.buyDate) errors.buyDate = 'Buy date is required'

  return errors
}

const TransactionsPage = () => {
  const { data, loading, error, refetch } = useApi(() => apiService.getTransactions(), [])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const transactions = useMemo(
    () =>
      (data || []).filter((item) =>
        [item.symbol, item.companyName].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  )

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (transaction) => {
    setEditing(transaction)
    setForm({
      selectedStock: { // New
        symbol: transaction.symbol,
        companyName: transaction.companyName,
        exchange: transaction.exchange,
      },
      quantity: transaction.quantity,
      buyPrice: transaction.buyPrice,
      buyDate: transaction.buyDate ? transaction.buyDate.slice(0, 10) : '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const saveTransaction = async (event) => {
    event.preventDefault()
    const validationErrors = validateForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) return

    setSaving(true)

    // Construct payload for backend
    const payload = {
      symbol: form.selectedStock.symbol,
      companyName: form.selectedStock.companyName,
      exchange: form.selectedStock.exchange,
      quantity: form.quantity,
      buyPrice: form.buyPrice,
      buyDate: form.buyDate,
    }

    try {
      if (editing) {
        await apiService.updateTransaction(editing.id, payload)
        toast.success('Transaction Updated')
      } else {
        await apiService.createTransaction(payload)
        toast.success('Transaction Added')
      }

      setModalOpen(false)
      refetch()
    } catch (apiError) {
      toast.error(apiError.response?.data?.message || 'API Error')
    } finally {
      setSaving(false)
    }
  }

  const deleteTransaction = async () => {
    if (!deleting) return
    setSaving(true)

    try {
      await apiService.deleteTransaction(deleting.id)
      toast.success('Transaction Deleted')
      setDeleting(null)
      refetch()
    } catch (apiError) {
      toast.error(apiError.response?.data?.message || 'API Error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-sm text-slate-500">Every stock purchase is stored separately.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search symbol or company" />
          <Button onClick={openAdd}>Add Transaction</Button>
        </div>
      </div>

      <DataTable
        loading={loading}
        rows={transactions}
        emptyMessage="No transactions yet"
        columns={[
          { key: 'symbol', title: 'Symbol' },
          { key: 'companyName', title: 'Company' },
          { key: 'quantity', title: 'Quantity', render: (row) => formatNumber(row.quantity, 0) },
          { key: 'buyPrice', title: 'Buy Price', render: (row) => formatMoney(row.buyPrice) },
          { key: 'buyDate', title: 'Buy Date', render: (row) => formatDate(row.buyDate) },
          {
            key: 'actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleting(row)}>Delete</Button>
              </div>
            ),
          },
        ]}
      />

      {modalOpen ? (
        <Modal title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={() => setModalOpen(false)}>
          <form className="grid gap-4" onSubmit={saveTransaction}>
            <StockSearch
              value={form.selectedStock}
              onSelect={(stock) => setForm({ ...form, selectedStock: stock })}
              error={errors.selectedStock}
            />
            {/* Removed Symbol, Company, Exchange Inputs */}
            <Input label="Quantity" type="number" min="0" step="0.01" value={form.quantity} error={errors.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            <Input label="Buy Price" type="number" min="0" step="0.01" value={form.buyPrice} error={errors.buyPrice} onChange={(event) => setForm({ ...form, buyPrice: event.target.value })} />
            <Input label="Buy Date" type="date" value={form.buyDate} error={errors.buyDate} onChange={(event) => setForm({ ...form, buyDate: event.target.value })} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Delete ${deleting.symbol} transaction?`}
          loading={saving}
          onConfirm={deleteTransaction}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}

export default TransactionsPage
