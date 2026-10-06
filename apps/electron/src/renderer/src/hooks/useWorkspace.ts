import { createContext, useContext } from 'react'
import type { ThemePreference } from '../../../shared/ipc'

export type WorkspaceState = {
  theme: ThemePreference
  isSavingTheme: boolean
  themeError: string
  changeTheme: (mode: ThemePreference) => Promise<void>
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}

export const WorkspaceContext = createContext<WorkspaceState | null>(null)

export const useWorkspace = (): WorkspaceState => {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('WorkspaceProvider is missing')
  return context
}
