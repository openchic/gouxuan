import './index.css'
type BrandProps = { compact?: boolean }
export const Brand = ({ compact = false }: BrandProps): React.JSX.Element => (
  <div className="brand">
    <span className="brand-mark" aria-hidden="true">
      玄
    </span>
    {!compact && (
      <span className="brand-wordmark">
        钩玄<span>保险咨询</span>
      </span>
    )}
  </div>
)
Brand.displayName = 'Brand'
