import type { SelectedKnowledgeFile } from '../../../../../../shared/ipc'
import { useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Icon } from '@astryxdesign/core/Icon'
import { InlineError, Modal, PreviewNotice } from '../../../../components'
import './index.css'

type UploadDialogProps = { isOpen: boolean; onClose: () => void }
export const UploadDialog = ({
  isOpen,
  onClose,
}: UploadDialogProps): React.JSX.Element => {
  const [file, setFile] = useState<SelectedKnowledgeFile | null>(null)
  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [isChoosing, setIsChoosing] = useState(false)
  const chooseFile = async (): Promise<void> => {
    setIsChoosing(true)
    setError('')
    try {
      const result = await window.desktop.knowledge.chooseFile()
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      if (result.value) {
        setFile(result.value)
        if (!title) setTitle(result.value.name.replace(/\.(pdf|md)$/i, ''))
      }
    } catch {
      setError('未能打开文件选择器，请重试。')
    } finally {
      setIsChoosing(false)
    }
  }
  return (
    <Modal
      title="上传资料"
      subtitle="添加可回查原文的保险资料"
      purpose="form"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button label="取消" variant="secondary" onClick={onClose} />
          <Button
            label="上传并解析"
            variant="primary"
            isDisabled
            tooltip="知识库服务尚未接入"
          />
        </>
      }>
      <div className="upload-form">
        <PreviewNotice>
          界面预览支持选择文件和填写信息，暂不上传或保存资料。
        </PreviewNotice>
        <div className="upload-file-picker">
          <Icon icon="viewColumns" size="lg" />
          <div>
            <strong>{file?.name ?? '选择一份资料'}</strong>
            <p>
              {file
                ? `${file.format} · ${(file.size / 1024).toFixed(1)} KB`
                : '文本 PDF 或 Markdown，单份不超过 20MB'}
            </p>
          </div>
          <Button
            label={file ? '重新选择' : '选择文件'}
            variant="secondary"
            isLoading={isChoosing}
            onClick={chooseFile}
          />
        </div>
        {error && <InlineError>{error}</InlineError>}
        <TextInput
          label="资料名称"
          value={title}
          onChange={setTitle}
          placeholder="例如：产品名称及条款类型"
          isRequired
        />
        <div className="upload-form-columns">
          <TextInput
            label="资料版本"
            value={version}
            onChange={setVersion}
            placeholder="例如：2026-01"
            isRequired
          />
          <TextInput
            label="来源"
            value={source}
            onChange={setSource}
            placeholder="例如：保险公司官网"
            isRequired
          />
        </div>
        <label className="upload-native-field">
          访问范围
          <select defaultValue="all">
            <option value="all">全部已登录用户</option>
            <option value="admin">仅管理员</option>
          </select>
        </label>
        <p className="upload-caption">
          资料将在解析、审核和评测通过后，由管理员显式发布。
        </p>
      </div>
    </Modal>
  )
}
UploadDialog.displayName = 'UploadDialog'
