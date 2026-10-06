import { createFileRoute } from '@tanstack/react-router'
import { SettingsLayout } from '../pages/SettingsPage/components'
export const Route = createFileRoute('/settings')({ component: SettingsLayout })
