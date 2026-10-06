import type { ReactNode } from 'react'
import type { ThemePreference } from '../../../../shared/ipc'
import { useCallback, useMemo, useState } from 'react'
import { WorkspaceContext } from '../../hooks/useWorkspace'

type WorkspaceProviderProps = {
  initialTheme: ThemePreference
  children: ReactNode
}

export const WorkspaceProvider = ({
  initialTheme,
  children,
}: WorkspaceProviderProps): React.JSX.Element => {
  const [theme, setTheme] = useState(initialTheme)
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  const [themeError, setThemeError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const setDraft = useCallback((key: string, value: string) => {
    setDrafts(current => ({ ...current, [key]: value }))
  }, [])
  const changeTheme = useCallback(async (mode: ThemePreference) => {
    setIsSavingTheme(true)
    setThemeError('')
    try {
      const result = await window.desktop.appearance.setPreference(mode)
      if (!result.ok) throw new Error(result.error.message)
      setTheme(result.value)
    } catch {
      setThemeError('主题未能保存，请重试。')
    } finally {
      setIsSavingTheme(false)
    }
  }, [])
  const value = useMemo(
    () => ({ theme, isSavingTheme, themeError, changeTheme, drafts, setDraft }),
    [theme, isSavingTheme, themeError, changeTheme, drafts, setDraft]
  )
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
WorkspaceProvider.displayName = 'WorkspaceProvider'
