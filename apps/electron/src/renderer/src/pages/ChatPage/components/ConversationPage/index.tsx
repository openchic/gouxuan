import { useParams } from '@tanstack/react-router'
import { ChatPage } from '../../index'

export const ConversationPage = (): React.JSX.Element => {
  const { conversationId } = useParams({ from: '/chat/$conversationId' })
  return <ChatPage key={conversationId} conversationId={conversationId} />
}
ConversationPage.displayName = 'ConversationPage'
