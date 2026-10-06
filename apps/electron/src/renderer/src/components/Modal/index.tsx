import type { ReactNode } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { Icon } from '@astryxdesign/core/Icon'
import './index.css'
type ModalProps = {
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  purpose?: 'info' | 'form'
}
export const Modal = ({
  title,
  subtitle,
  isOpen,
  onClose,
  children,
  footer,
  purpose = 'info',
}: ModalProps): React.JSX.Element => (
  <Dialog
    isOpen={isOpen}
    onOpenChange={open => {
      if (!open) onClose()
    }}
    width={600}
    maxHeight="85dvh"
    padding={0}
    purpose={purpose}
    aria-label={title}>
    <div className="modal-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Button
        label="关闭"
        variant="ghost"
        isIconOnly
        icon={<Icon icon="close" />}
        onClick={onClose}
      />
    </div>
    <div className="modal-content">{children}</div>
    {footer && <div className="modal-footer">{footer}</div>}
  </Dialog>
)
Modal.displayName = 'Modal'
