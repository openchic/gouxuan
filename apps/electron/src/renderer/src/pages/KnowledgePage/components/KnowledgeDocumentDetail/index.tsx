import type { PreviewDocument } from '../../preview'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { MetadataList } from '../../../../components'
import { KNOWLEDGE_STATUS_VARIANT_MAP } from '../../enum'
import './index.css'

type KnowledgeDocumentDetailProps = {
  document: PreviewDocument
}

export const KnowledgeDocumentDetail = ({
  document,
}: KnowledgeDocumentDetailProps): React.JSX.Element => (
  <div className="document-detail">
    <div className="document-detail-title">
      <h3>{document.name}</h3>
      <Badge
        label={document.status}
        variant={KNOWLEDGE_STATUS_VARIANT_MAP[document.status]}
      />
    </div>
    <MetadataList>
      <div>
        <dt>资料版本</dt>
        <dd>{document.version} · 虚构示例</dd>
      </div>
      <div>
        <dt>文件类型</dt>
        <dd>
          {document.format} · {document.size}
        </dd>
      </div>
      <div>
        <dt>访问范围</dt>
        <dd>全部已登录用户（示例）</dd>
      </div>
      <div>
        <dt>原文定位</dt>
        <dd>{document.location}</dd>
      </div>
    </MetadataList>
    <div
      className={`document-task ${document.status === '失败' ? 'is-error' : ''}`}>
      <Icon icon={document.status === '失败' ? 'error' : 'info'} size="sm" />
      <span>{document.detail}</span>
    </div>
    {document.excerpt && (
      <>
        <h4>解析内容预览</h4>
        <blockquote>{document.excerpt}</blockquote>
      </>
    )}
    {document.status === '待审核' && (
      <Button
        label="确认审核"
        isDisabled
        variant="primary"
        tooltip="知识库服务尚未接入"
      />
    )}
    {document.status === '失败' && (
      <Button
        label="重试解析"
        isDisabled
        variant="secondary"
        tooltip="知识库服务尚未接入"
      />
    )}
    <p className="document-caption">
      示例状态不代表真实处理结果，审核、发布和回滚将在服务接入后开放。
    </p>
  </div>
)
KnowledgeDocumentDetail.displayName = 'KnowledgeDocumentDetail'
