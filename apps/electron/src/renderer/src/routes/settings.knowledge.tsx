import { createFileRoute } from '@tanstack/react-router'
import { KnowledgePage } from '../pages/KnowledgePage'
export const Route = createFileRoute('/settings/knowledge')({
  component: KnowledgePage,
})
