import './index.css'

type InlineErrorProps = { children: string }

export const InlineError = ({
  children,
}: InlineErrorProps): React.JSX.Element => (
  <p role="alert" className="inline-error">
    {children}
  </p>
)
InlineError.displayName = 'InlineError'
