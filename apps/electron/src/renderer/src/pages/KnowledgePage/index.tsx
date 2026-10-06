import type { BadgeVariant } from '@astryxdesign/core/Badge'
import type { TableColumn } from '@astryxdesign/core/Table'
import type { KnowledgeStatus, PreviewDocument } from './preview'
import { useState } from 'react'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { Table, pixel, proportional } from '@astryxdesign/core/Table'
import { TextInput } from '@astryxdesign/core/TextInput'
import { PlusIcon } from '@radix-ui/react-icons'
import { MetadataList, Modal, PreviewNotice } from '../../components'
import { UploadDialog } from './components'
import { previewDocuments } from './preview'
import './index.css'

const statusVariant: Record<KnowledgeStatus, BadgeVariant> = {
  已发布: 'success',
  待审核: 'warning',
  处理中: 'info',
  失败: 'error',
}
const statuses: KnowledgeStatus[] = ['已发布', '待审核', '处理中', '失败']

export const KnowledgePage = (): React.JSX.Element => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('全部')
  const [document, setDocument] = useState<PreviewDocument | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const filtered = previewDocuments.filter(
    item =>
      (status === '全部' || item.status === status) &&
      item.name.includes(search.trim())
  )
  const columns: TableColumn<PreviewDocument>[] = [
    {
      key: 'name',
      header: '资料名称',
      width: proportional(1.7),
      renderCell: item => (
        <div className="document-name">
          <span className="file-format">
            {item.format === 'PDF' ? 'PDF' : 'MD'}
          </span>
          <div>
            <strong>{item.name}</strong>
            <small>
              {item.category} · {item.size}
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
      renderCell: item => (
        <Badge label={item.status} variant={statusVariant[item.status]} />
      ),
    },
    { key: 'updatedAt', header: '更新日期', width: pixel(112) },
    {
      key: 'id',
      header: '操作',
      width: pixel(96),
      renderCell: item => (
        <Button
          label="查看"
          variant="ghost"
          size="sm"
          onClick={() => setDocument(item)}
        />
      ),
    },
  ]
  return (
    <section className="knowledge-page">
      <div className="knowledge-heading">
        <div>
          <h1>知识库</h1>
          <p>管理问答使用的资料与发布版本。</p>
        </div>
        <Button
          label="上传资料"
          variant="primary"
          icon={<PlusIcon width="1em" height="1em" aria-hidden />}
          onClick={() => setIsUploadOpen(true)}
        />
      </div>
      <PreviewNotice>以下为虚构示例资料，知识库服务尚未接入。</PreviewNotice>
      <div className="knowledge-toolbar">
        <div className="knowledge-filters" role="group" aria-label="资料状态">
          {(['全部', ...statuses] as const).map(item => (
            <button
              key={item}
              className={`knowledge-filter ${status === item ? 'is-active' : ''}`}
              aria-pressed={status === item}
              onClick={() => setStatus(item)}>
              {item}
              <span>
                {item === '全部'
                  ? previewDocuments.length
                  : previewDocuments.filter(doc => doc.status === item).length}
              </span>
            </button>
          ))}
        </div>
        <div className="knowledge-search">
          <TextInput
            label="搜索资料"
            isLabelHidden
            value={search}
            onChange={setSearch}
            placeholder="搜索资料名称"
            startIcon={<Icon icon="search" size="sm" />}
            hasClear
            size="sm"
          />
        </div>
      </div>
      <div className="document-table">
        <Table
          data={filtered}
          columns={columns}
          density="balanced"
          emptyState={false}
          hasHover
          aria-label="知识库示例资料"
        />
        {filtered.length === 0 && (
          <div className="knowledge-empty">
            <Icon icon="search" size="lg" />
            <strong>没有找到匹配的资料</strong>
            <p>试试其他关键词，或清除筛选条件。</p>
            <Button
              label="清除筛选"
              variant="secondary"
              onClick={() => {
                setSearch('')
                setStatus('全部')
              }}
            />
          </div>
        )}
      </div>
      <Modal
        title="资料详情"
        isOpen={document !== null}
        onClose={() => setDocument(null)}
        footer={
          <Button
            label="完成"
            variant="secondary"
            onClick={() => setDocument(null)}
          />
        }>
        {document && (
          <div className="document-detail">
            <div className="document-detail-title">
              <h3>{document.name}</h3>
              <Badge
                label={document.status}
                variant={statusVariant[document.status]}
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
              <Icon
                icon={document.status === '失败' ? 'error' : 'info'}
                size="sm"
              />
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
        )}
      </Modal>
      {isUploadOpen && (
        <UploadDialog isOpen onClose={() => setIsUploadOpen(false)} />
      )}
    </section>
  )
}
KnowledgePage.displayName = 'KnowledgePage'
