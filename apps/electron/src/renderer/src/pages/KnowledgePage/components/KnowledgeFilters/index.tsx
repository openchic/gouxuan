import type { KnowledgeStatusFilter, PreviewDocument } from '../../preview'
import { Icon } from '@astryxdesign/core/Icon'
import { TextInput } from '@astryxdesign/core/TextInput'
import { KNOWLEDGE_STATUS_FILTERS } from '../../enum'
import './index.css'

type KnowledgeFiltersProps = {
  documents: PreviewDocument[]
  search: string
  status: KnowledgeStatusFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: KnowledgeStatusFilter) => void
}

export const KnowledgeFilters = ({
  documents,
  search,
  status,
  onSearchChange,
  onStatusChange,
}: KnowledgeFiltersProps): React.JSX.Element => {
  const statusCounts = documents.reduce<Record<KnowledgeStatusFilter, number>>(
    (counts, document) => {
      counts[document.status] += 1
      return counts
    },
    {
      全部: documents.length,
      已发布: 0,
      待审核: 0,
      处理中: 0,
      失败: 0,
    }
  )

  return (
    <div className="knowledge-toolbar">
      <div className="knowledge-filters" role="group" aria-label="资料状态">
        {KNOWLEDGE_STATUS_FILTERS.map(filter => (
          <button
            type="button"
            key={filter}
            className={`knowledge-filter ${status === filter ? 'is-active' : ''}`}
            aria-pressed={status === filter}
            onClick={() => onStatusChange(filter)}>
            {filter}
            <span>{statusCounts[filter]}</span>
          </button>
        ))}
      </div>
      <div className="knowledge-search">
        <TextInput
          label="搜索资料"
          isLabelHidden
          value={search}
          onChange={onSearchChange}
          placeholder="搜索资料名称"
          startIcon={<Icon icon="search" size="sm" />}
          hasClear
          size="sm"
        />
      </div>
    </div>
  )
}
KnowledgeFilters.displayName = 'KnowledgeFilters'
