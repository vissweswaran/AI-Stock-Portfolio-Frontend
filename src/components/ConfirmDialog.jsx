import Button from './Button'
import Modal from './Modal'

const ConfirmDialog = ({ title = 'Confirm', message, onConfirm, onClose, loading }) => (
  <Modal title={title} onClose={onClose}>
    <p className="text-sm text-slate-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </Modal>
)

export default ConfirmDialog
