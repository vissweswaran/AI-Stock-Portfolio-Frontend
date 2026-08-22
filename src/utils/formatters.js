export const formatMoney = (value) => {
  if (!Number.isFinite(Number(value))) return '—'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

export const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) return '—'
  return `${Number(value).toFixed(2)}%`
}

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN')
}

export const formatDateTime = (value) => {
  if (!value) return 'Not analyzed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not analyzed'
  return date.toLocaleString('en-IN')
}
