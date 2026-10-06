import type { PreviewSource } from '../../data/preview-conversations'
import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import {
  ChatComposer,
  ChatComposerInput,
  type ChatComposerInputHandle,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
} from '@astryxdesign/core/Chat'
import { Brand, MetadataList, Modal } from '../../components'
import { useWorkspace } from '../../hooks'
import { previewConversations } from '../../data/preview-conversations'
import './index.css'

type ChatPageProps = { conversationId?: string }
const suggestions = [
  '医疗险和重疾险有什么区别？',
  '保险条款里的免赔额怎么看？',
  '如何找到回答所依据的条款？',
]

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
        emptyState={
          <div className="welcome-column">
            <h2>有什么想了解的保险问题？</h2>
            <p>从保障或条款开始，回答附有可核对的来源。</p>
            <div className="suggestions" aria-label="试试这些问题">
              {suggestions.map(question => (
                <button
                  className="suggestion"
                  key={question}
                  onClick={() => {
                    updateDraft(question)
                    editorRef.current?.focus()
                  }}>
                  <span>{question}</span>
                  <Icon icon="chevronRight" size="sm" />
                </button>
              ))}
            </div>
          </div>
        }
        composer={
          <div className="composer-column">
            <ChatComposer
              value={draft}
              onChange={updateDraft}
              onSubmit={attemptSend}
              density="balanced"
              className="question-composer"
              input={
                <ChatComposerInput
                  handleRef={editorRef}
                  label="输入保险问题"
                  placeholder={
                    conversation
                      ? '继续提问，或补充你想核对的条款…'
                      : '输入你的保险问题…'
                  }
                  maxRows={8}
                  hasHistory={false}
                  onKeyDown={event => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      attemptSend()
                    }
                  }}
                />
              }
              sendActions={
                <span className="composer-shortcut">
                  Enter 发送 · Shift + Enter 换行
                </span>
              }
              sendButton={
                <Button
                  label="发送问题"
                  isIconOnly
                  variant="primary"
                  icon={<Icon icon="arrowUp" />}
                  isDisabled={!draft.trim()}
                  onClick={attemptSend}
                />
              }
              status={
                sendError ? { type: 'warning', message: sendError } : undefined
              }
            />
            <p className="composer-disclaimer">
              问答服务尚未接入，发送不会提交问题。
            </p>
          </div>
        }>
        {conversation && (
          <div className="conversation-column">
            <ChatMessageList align="top" density="balanced">
              <ChatMessage sender="user">
                <ChatMessageBubble>{conversation.question}</ChatMessageBubble>
              </ChatMessage>
              <ChatMessage sender="assistant" avatar={<Brand compact />}>
                <ChatMessageBubble
                  variant="ghost"
                  width="100%"
                  name={
                    <span className="assistant-name">
                      钩玄 <Badge label="示例回答" variant="neutral" />
                    </span>
                  }>
                  <div className="answer-body">
                    <p>{conversation.introduction}</p>
                    {conversation.sections.map(section => (
                      <section key={section.title}>
                        <h2>{section.title}</h2>
                        <p>
                          {section.text}
                          <button
                            className="citation-number"
                            aria-label={`查看来源 ${section.sourceId}`}
                            onClick={() =>
                              setSource(
                                conversation.sources.find(
                                  item => item.id === section.sourceId
                                ) ?? null
                              )
                            }>
                            {section.sourceId}
                          </button>
                        </p>
                      </section>
                    ))}
                    <p className="answer-closing">{conversation.closing}</p>
                  </div>
                  <div className="answer-sources">
                    <div className="sources-heading">
                      <strong>参考来源</strong>
                      <span>{conversation.sources.length} 份资料</span>
                    </div>
                    <div className="source-cards">
                      {conversation.sources.map(item => (
                        <button
                          className="source-card"
                          key={item.id}
                          onClick={() => setSource(item)}>
                          <span className="source-index">{item.id}</span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>{item.location}</small>
                          </span>
                          <Icon icon="chevronRight" size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="answer-footnote">
                    以上内容与引用均为虚构样例，不代表真实保险产品条款。
                  </div>
                </ChatMessageBubble>
              </ChatMessage>
            </ChatMessageList>
          </div>
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
        {source && (
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
        )}
      </Modal>
    </section>
  )
}
ChatPage.displayName = 'ChatPage'
