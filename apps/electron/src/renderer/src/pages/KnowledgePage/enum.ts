import type { BadgeVariant } from '@astryxdesign/core/Badge'
import type { KnowledgeStatus, KnowledgeStatusFilter } from './preview'

export const KNOWLEDGE_STATUS_VARIANT_MAP: Record<
  KnowledgeStatus,
  BadgeVariant
> = {
  已发布: 'success',
  待审核: 'warning',
  处理中: 'info',
  失败: 'error',
}

export const KNOWLEDGE_STATUS_FILTERS: KnowledgeStatusFilter[] = [
  '全部',
  '已发布',
  '待审核',
  '处理中',
  '失败',
]
