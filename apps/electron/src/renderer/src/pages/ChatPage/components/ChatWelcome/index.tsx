import { Icon } from '@astryxdesign/core/Icon'
import './index.css'

const SUGGESTIONS = [
  '医疗险和重疾险有什么区别？',
  '保险条款里的免赔额怎么看？',
  '如何找到回答所依据的条款？',
]

type ChatWelcomeProps = {
  onSelectSuggestion: (question: string) => void
}

export const ChatWelcome = ({
  onSelectSuggestion,
}: ChatWelcomeProps): React.JSX.Element => (
  <div className="welcome-column">
    <h2>有什么想了解的保险问题？</h2>
    <p>从保障或条款开始，回答附有可核对的来源。</p>
    <div className="suggestions" aria-label="试试这些问题">
      {SUGGESTIONS.map(question => (
        <button
          type="button"
          className="suggestion"
          key={question}
          onClick={() => onSelectSuggestion(question)}>
          <span>{question}</span>
          <Icon icon="chevronRight" size="sm" />
        </button>
      ))}
    </div>
  </div>
)
ChatWelcome.displayName = 'ChatWelcome'
