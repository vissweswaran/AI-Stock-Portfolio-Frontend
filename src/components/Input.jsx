const Input = ({ label, error, ...props }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span>{label}</span>
    <input className={`input mt-1 ${error ? 'border-red-400' : ''}`} {...props} />
    {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
  </label>
)

export default Input
