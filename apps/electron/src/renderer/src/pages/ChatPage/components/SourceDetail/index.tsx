import type { PreviewSource } from '../../../../data/preview-conversations'
import { MetadataList } from '../../../../components'
import './index.css'

type SourceDetailProps = { source: PreviewSource }

export const SourceDetail = ({
  source,
}: SourceDetailProps): React.JSX.Element => (
  <div className="source-detail">
    <h3>{source.title}</h3>
    <MetadataList>
      <div>
        <dt>原文定位</dt>
        <dd>{source.location}</dd>
      </div>
      <div>
        <dt>资料版本</dt>
        <dd>{source.version}</dd>
      </div>
    </MetadataList>
    <blockquote>{source.excerpt}</blockquote>
  </div>
)
SourceDetail.displayName = 'SourceDetail'
