import type { PreviewSource } from '../../data/preview-conversations'
import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import {
  ChatLayout,
  type ChatComposerInputHandle,
} from '@astryxdesign/core/Chat'
import { Modal } from '../../components'
import { useWorkspace } from '../../hooks'
import { previewConversations } from '../../data/preview-conversations'
import { ChatComposerPanel } from './components/ChatComposerPanel'
import { ChatWelcome } from './components/ChatWelcome'
import { ConversationContent } from './components/ConversationContent'
import { SourceDetail } from './components/SourceDetail'
import './index.css'

type ChatPageProps = { conversationId?: string }

export const ChatPage = ({
  conversationId,
}: ChatPageProps): React.JSX.Element => {
  const conversation = previewConversations.find(
    item => item.id === conversationId
  )
  const { drafts, setDraft } = useWorkspace()
  const draftKey = conversationId ?? 'new'
  const draft = drafts[draftKey] ?? ''
  const editorRef = useRef<ChatComposerInputHandle>(null)
  const [sendError, setSendError] = useState('')
  const [source, setSource] = useState<PreviewSource | null>(null)
  const updateDraft = (value: string): void => {
    setDraft(draftKey, value)
    setSendError('')
  }
  const attemptSend = (): void => {
    if (draft.trim())
      setSendError('问答服务尚未接入，问题未发送，草稿已保留在当前窗口。')
  }
  const selectSuggestion = (question: string): void => {
    updateDraft(question)
    editorRef.current?.focus()
  }
  if (conversationId && !conversation)
    return (
      <div className="chat-empty">
        <Icon icon="info" size="lg" />
        <h1>未找到这个示例会话</h1>
        <p>当前只提供本地界面预览。</p>
        <Link to="/chat">返回新建会话</Link>
      </div>
    )

  return (
    <section
      className="chat-page"
      aria-label={conversation?.title ?? '保险咨询问答'}>
      <ChatLayout
        className="chat-layout"
        density="spacious"
        scrollButton={null}
        key={draftKey}
        emptyState={<ChatWelcome onSelectSuggestion={selectSuggestion} />}
        composer={
          <ChatComposerPanel
            conversation={conversation}
            draft={draft}
            editorRef={editorRef}
            sendError={sendError}
            onDraftChange={updateDraft}
            onSubmit={attemptSend}
            onDismiss={() => setSendError('')}
          />
        }>
        {conversation && (
          <ConversationContent
            conversation={conversation}
            onSourceSelect={setSource}
          />
        )}
      </ChatLayout>
      <Modal
        title="参考来源"
        isOpen={source !== null}
        onClose={() => setSource(null)}
        footer={
          <Button
            label="完成"
            variant="secondary"
            onClick={() => setSource(null)}
          />
        }>
        {source && <SourceDetail source={source} />}
      </Modal>
    </section>
  )
}
ChatPage.displayName = 'ChatPage'
