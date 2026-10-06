import { Icon } from '@astryxdesign/core/Icon'
import './index.css'
type PreviewNoticeProps = { children: React.ReactNode }
export const PreviewNotice = ({
  children,
}: PreviewNoticeProps): React.JSX.Element => (
  <div className="preview-notice">
    <Icon icon="info" size="sm" />
    <span>{children}</span>
  </div>
)
PreviewNotice.displayName = 'PreviewNotice'
