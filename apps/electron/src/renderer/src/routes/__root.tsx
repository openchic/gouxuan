import { createRootRoute } from '@tanstack/react-router'
import { AppShell, NotFound } from '../components'
export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFound,
})
