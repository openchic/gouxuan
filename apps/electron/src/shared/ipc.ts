export type ThemePreference = 'light' | 'dark' | 'system'
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
  }
  knowledge: {
    chooseFile: () => Promise<BridgeResult<SelectedKnowledgeFile | null>>
  }
}
export const IPC_CHANNELS = {
  getTheme: 'appearance:get-preference',
  setTheme: 'appearance:set-preference',
  chooseKnowledgeFile: 'knowledge:choose-file',
} as const
export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'
