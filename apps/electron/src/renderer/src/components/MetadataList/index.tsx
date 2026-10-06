import type { ReactNode } from 'react'
import './index.css'

type MetadataListProps = { children: ReactNode }

export const MetadataList = ({
  children,
}: MetadataListProps): React.JSX.Element => (
  <dl className="metadata-list">{children}</dl>
)
MetadataList.displayName = 'MetadataList'
