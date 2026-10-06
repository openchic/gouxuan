export type ThemePreference = 'light' | 'dark' | 'system'
export type AppearanceContext = 'preview' | 'login'
export type SelectedKnowledgeFile = {
  name: string
  size: number
  format: 'PDF' | 'Markdown'
}
export type BridgeResult<T> =
  | { ok: true; value: T }
  | {
      ok: false
      error: {
        code: 'FORBIDDEN' | 'INVALID_ARGUMENT' | 'FILE_INVALID' | 'UNAVAILABLE'
        message: string
      }
    }
export type DesktopBridge = {
  readonly platform: string
  appearance: {
    getPreference: () => Promise<BridgeResult<ThemePreference>>
    setPreference: (
      mode: ThemePreference
    ) => Promise<BridgeResult<ThemePreference>>
    setContext: (context: AppearanceContext) => Promise<BridgeResult<null>>
  }
  knowledge: {
    chooseFile: () => Promise<BridgeResult<SelectedKnowledgeFile | null>>
  }
}
export const IPC_CHANNELS = {
  getTheme: 'appearance:get-preference',
  setTheme: 'appearance:set-preference',
  setAppearanceContext: 'appearance:set-context',
  chooseKnowledgeFile: 'knowledge:choose-file',
} as const
export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'
export const isAppearanceContext = (
  value: unknown
): value is AppearanceContext => value === 'preview' || value === 'login'
