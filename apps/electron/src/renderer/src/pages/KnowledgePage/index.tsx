import type { KnowledgeStatusFilter, PreviewDocument } from './preview'
import { useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { PlusIcon } from '@radix-ui/react-icons'
import { Modal, PreviewNotice } from '../../components'
import {
  KnowledgeDocumentDetail,
  KnowledgeFilters,
  KnowledgeTable,
  UploadDialog,
} from './components'
import { previewDocuments } from './preview'
import './index.css'

export const KnowledgePage = (): React.JSX.Element => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<KnowledgeStatusFilter>('全部')
  const [document, setDocument] = useState<PreviewDocument | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const filteredDocuments = previewDocuments.filter(
    item =>
      (status === '全部' || item.status === status) &&
      item.name.includes(search.trim())
  )
  const clearFilters = (): void => {
    setSearch('')
    setStatus('全部')
  }

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
      <KnowledgeFilters
        documents={previewDocuments}
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <KnowledgeTable
        documents={filteredDocuments}
        onSelectDocument={setDocument}
        onClearFilters={clearFilters}
      />
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
        {document && <KnowledgeDocumentDetail document={document} />}
      </Modal>
      {isUploadOpen && (
        <UploadDialog isOpen onClose={() => setIsUploadOpen(false)} />
      )}
    </section>
  )
}
KnowledgePage.displayName = 'KnowledgePage'
