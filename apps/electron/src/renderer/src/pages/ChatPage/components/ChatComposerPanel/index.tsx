import type { KeyboardEvent, RefObject } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import {
  ChatComposer,
  ChatComposerInput,
  type ChatComposerInputHandle,
} from '@astryxdesign/core/Chat'
import type { PreviewConversation } from '../../../../data/preview-conversations'
import './index.css'

type ChatComposerPanelProps = {
  conversation?: PreviewConversation
  draft: string
  editorRef: RefObject<ChatComposerInputHandle | null>
  sendError: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onDismiss: () => void
}

export const ChatComposerPanel = ({
  conversation,
  draft,
  editorRef,
  sendError,
  onDraftChange,
  onSubmit,
  onDismiss,
}: ChatComposerPanelProps): React.JSX.Element => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="composer-column">
      <div className="composer-shell">
        <ChatComposer
          value={draft}
          onChange={onDraftChange}
          onSubmit={onSubmit}
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
              onKeyDown={handleKeyDown}
            />
          }
          sendButton={
            <Button
              label="发送问题"
              isIconOnly
              variant="primary"
              icon={<Icon icon="arrowUp" />}
              isDisabled={!draft.trim()}
              onClick={onSubmit}
            />
          }
        />
        {sendError && (
          <div className="composer-error" role="status">
            <div className="composer-error-message">
              <Icon icon="warning" size="sm" color="warning" />
              <span>{sendError}</span>
            </div>
            <Button
              label="关闭提示"
              variant="ghost"
              size="sm"
              isIconOnly
              icon={<Icon icon="close" />}
              onClick={onDismiss}
            />
          </div>
        )}
      </div>
    </div>
  )
}
ChatComposerPanel.displayName = 'ChatComposerPanel'
