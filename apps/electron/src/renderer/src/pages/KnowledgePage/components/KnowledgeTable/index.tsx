import type { TableColumn } from '@astryxdesign/core/Table'
import type { PreviewDocument } from '../../preview'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { Table, pixel, proportional } from '@astryxdesign/core/Table'
import { KNOWLEDGE_STATUS_VARIANT_MAP } from '../../enum'
import './index.css'

type KnowledgeTableProps = {
  documents: PreviewDocument[]
  onSelectDocument: (document: PreviewDocument) => void
  onClearFilters: () => void
}

const createColumns = (
  onSelectDocument: KnowledgeTableProps['onSelectDocument']
): TableColumn<PreviewDocument>[] => [
  {
    key: 'name',
    header: '资料名称',
    width: proportional(1.7),
    renderCell: document => (
      <div className="document-name">
        <span className="file-format">
          {document.format === 'PDF' ? 'PDF' : 'MD'}
        </span>
        <div>
          <strong>{document.name}</strong>
          <small>
            {document.category} · {document.size}
          </small>
        </div>
      </div>
    ),
  },
  { key: 'version', header: '版本', width: pixel(72) },
  {
    key: 'status',
    header: '状态',
    width: pixel(98),
    renderCell: document => (
      <Badge
        label={document.status}
        variant={KNOWLEDGE_STATUS_VARIANT_MAP[document.status]}
      />
    ),
  },
  { key: 'updatedAt', header: '更新日期', width: pixel(112) },
  {
    key: 'id',
    header: '操作',
    width: pixel(96),
    renderCell: document => (
      <Button
        label="查看"
        variant="ghost"
        size="sm"
        onClick={() => onSelectDocument(document)}
      />
    ),
  },
]

export const KnowledgeTable = ({
  documents,
  onSelectDocument,
  onClearFilters,
}: KnowledgeTableProps): React.JSX.Element => (
  <div className="document-table">
    <Table
      data={documents}
      columns={createColumns(onSelectDocument)}
      density="balanced"
      emptyState={false}
      hasHover
      aria-label="知识库示例资料"
    />
    {documents.length === 0 && (
      <div className="knowledge-empty">
        <Icon icon="search" size="lg" />
        <strong>没有找到匹配的资料</strong>
        <p>试试其他关键词，或清除筛选条件。</p>
        <Button label="清除筛选" variant="secondary" onClick={onClearFilters} />
      </div>
    )}
  </div>
)
KnowledgeTable.displayName = 'KnowledgeTable'
