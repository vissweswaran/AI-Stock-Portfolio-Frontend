import Button from './Button'

const ErrorMessage = ({ message, onRetry }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
    <p className="font-medium">{message || 'Something went wrong'}</p>
    {onRetry ? (
      <Button variant="secondary" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </div>
)

export default ErrorMessage
