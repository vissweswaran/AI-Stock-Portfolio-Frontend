import { useCallback, useEffect, useRef, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import apiService from '../services/api'
import Input from './Input'
import Loader from './Loader'

const StockSearch = ({ value, onSelect, error }) => {
  const [query, setQuery] = useState(value?.companyName || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const debounceTimeout = useRef(null)

  useEffect(() => {
    if (value && value.companyName !== query) {
      setQuery(value.companyName)
    }
  }, [value])

  const search = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowDropdown(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await apiService.searchStocks(searchQuery)
      setResults(data)
      setShowDropdown(true)
      setHighlightedIndex(-1)
    } catch (err) {
      console.error('Stock search failed', err)
      setResults([])
      setShowDropdown(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (event) => {
    const newQuery = event.target.value
    setQuery(newQuery)
    onSelect(null) // Clear selected stock if typing

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      search(newQuery)
    }, 300)
  }

  const handleSelect = (stock) => {
    setQuery(stock.companyName)
    onSelect(stock)
    setShowDropdown(false)
  }

  const handleKeyDown = (event) => {
    if (showDropdown) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleSelect(results[highlightedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          setShowDropdown(false)
          break
        default:
          break
      }
    }
  }

  const handleBlur = (event) => {
    // Close dropdown only if click is outside the component
    if (dropdownRef.current && !dropdownRef.current.contains(event.relatedTarget)) {
      setShowDropdown(false)
    }
  }

  return (
    <div className="relative" onBlur={handleBlur}>
      <Input
        ref={inputRef}
        label="Stock"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        error={error}
        placeholder="Search company name or symbol"
        autoComplete="off"
      />
      {loading ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Loader />
        </div>
      ) : (
        <FiSearch className="absolute right-3 top-9 text-slate-400" />
      )}

      {showDropdown && results.length > 0 ? (
        <ul
          ref={dropdownRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          tabIndex="-1" // Make the ul focusable programmatically
        >
          {results.map((stock, index) => (
            <li
              key={stock.symbol}
              className={`relative cursor-default select-none py-2 pl-3 pr-9 ${highlightedIndex === index ? 'bg-blue-600 text-white' : 'text-slate-900'}`}
              onClick={() => handleSelect(stock)}
              onMouseEnter={() => setHighlightedIndex(index)}
              id={`stock-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              <span className="block truncate">{stock.companyName} ({stock.symbol})</span>
              <span className={`block truncate text-xs ${highlightedIndex === index ? 'text-blue-200' : 'text-slate-500'}`}>
                {stock.exchange}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default StockSearch
