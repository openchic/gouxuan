import { createFileRoute } from '@tanstack/react-router'
import { ConversationPage } from '../pages/ChatPage/components'
export const Route = createFileRoute('/chat/$conversationId')({
  component: ConversationPage,
})
