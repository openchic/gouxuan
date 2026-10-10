import type {
  PreviewConversation,
  PreviewSource,
} from '../../../../data/preview-conversations'
import { Badge } from '@astryxdesign/core/Badge'
import { Icon } from '@astryxdesign/core/Icon'
import {
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
} from '@astryxdesign/core/Chat'
import { Brand } from '../../../../components'
import './index.css'

type ConversationContentProps = {
  conversation: PreviewConversation
  onSourceSelect: (source: PreviewSource) => void
}

export const ConversationContent = ({
  conversation,
  onSourceSelect,
}: ConversationContentProps): React.JSX.Element => {
  const sourcesById = new Map(
    conversation.sources.map(source => [source.id, source])
  )
  const selectSource = (sourceId: number): void => {
    const source = sourcesById.get(sourceId)
    if (source) onSourceSelect(source)
  }

  return (
    <ChatMessageList>
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
                    type="button"
                    className="citation-number"
                    aria-label={`查看来源 ${section.sourceId}`}
                    onClick={() => selectSource(section.sourceId)}>
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
              {conversation.sources.map(source => (
                <button
                  type="button"
                  className="source-card"
                  key={source.id}
                  onClick={() => onSourceSelect(source)}>
                  <span className="source-index">{source.id}</span>
                  <span>
                    <strong>{source.title}</strong>
                    <small>{source.location}</small>
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
  )
}
ConversationContent.displayName = 'ConversationContent'
