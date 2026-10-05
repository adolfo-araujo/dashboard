import { Dialog } from './ui/dialog'
import { Button } from './ui/button'

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, isLoading }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
