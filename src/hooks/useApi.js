import { useCallback, useEffect, useState } from 'react'

const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiCall()
      setData(result)
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'API request failed')
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}

export default useApi
