const SearchBox = ({ value, onChange, placeholder = 'Search...' }) => (
  <input
    className="input max-w-sm"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
  />
)

export default SearchBox
