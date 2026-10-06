import { dialog, ipcMain } from 'electron'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import {
  IPC_CHANNELS,
  isAppearanceContext,
  isThemePreference,
} from '../shared/ipc'
import type {
  AppearanceContext,
  BridgeResult,
  ThemePreference,
} from '../shared/ipc'

export const isTrustedPage = (url: string, entryUrl: string): boolean => {
  try {
    const actual = new URL(url)
    const expected = new URL(entryUrl)
    return (
      actual.protocol === expected.protocol &&
      actual.host === expected.host &&
      actual.pathname === expected.pathname &&
      actual.search === expected.search
    )
  } catch {
    return false
  }
}
type AppearanceController = {
  getPreference: () => ThemePreference
  setPreference: (mode: ThemePreference) => void
  setContext: (context: AppearanceContext) => void
}
export const registerWindowIpc = (
  getWindow: () => BrowserWindow | undefined,
  entryUrl: string,
  appearance: AppearanceController
): void => {
  const handle = <T>(
    channel: string,
    action: (argument: unknown, window: BrowserWindow) => T | Promise<T>
  ): void => {
    ipcMain.handle(
      channel,
      async (
        event: IpcMainInvokeEvent,
        argument: unknown
      ): Promise<BridgeResult<T>> => {
        const window = getWindow()
        if (
          !window ||
          window.isDestroyed() ||
          event.sender !== window.webContents ||
          event.senderFrame !== window.webContents.mainFrame ||
          !isTrustedPage(event.senderFrame.url, entryUrl)
        ) {
          return {
            ok: false,
            error: { code: 'FORBIDDEN', message: '不允许此页面调用。' },
          }
        }
        try {
          return { ok: true, value: await action(argument, window) }
        } catch (error) {
          if (error instanceof BridgeFailure)
            return {
              ok: false,
              error: { code: error.code, message: error.message },
            }
          return {
            ok: false,
            error: {
              code: 'UNAVAILABLE',
              message: '操作暂时不可用，请稍后重试。',
            },
          }
        }
      }
    )
  }
  handle(IPC_CHANNELS.getTheme, argument => {
    if (argument !== undefined)
      throw new BridgeFailure('INVALID_ARGUMENT', '参数不正确。')
    return appearance.getPreference()
  })
  handle(IPC_CHANNELS.setTheme, mode => {
    if (!isThemePreference(mode))
      throw new BridgeFailure('INVALID_ARGUMENT', '不支持此主题。')
    appearance.setPreference(mode)
    return appearance.getPreference()
  })
  handle(IPC_CHANNELS.setAppearanceContext, context => {
    if (!isAppearanceContext(context))
      throw new BridgeFailure('INVALID_ARGUMENT', '页面类型不正确。')
    appearance.setContext(context)
    return null
  })
  handle(IPC_CHANNELS.chooseKnowledgeFile, async (argument, window) => {
    if (argument !== undefined)
      throw new BridgeFailure('INVALID_ARGUMENT', '参数不正确。')
    const result = await dialog.showOpenDialog(window, {
      title: '选择知识库资料',
      buttonLabel: '选择资料',
      properties: ['openFile'],
      filters: [{ name: '文本资料', extensions: ['pdf', 'md'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    const path = result.filePaths[0]
    const extension = extname(path).toLowerCase()
    if (extension !== '.pdf' && extension !== '.md')
      throw new BridgeFailure('FILE_INVALID', '请选择 PDF 或 Markdown 文件。')
    const metadata = await stat(path)
    if (
      !metadata.isFile() ||
      metadata.size === 0 ||
      metadata.size > 20 * 1024 * 1024
    ) {
      throw new BridgeFailure(
        'FILE_INVALID',
        '请选择非空且不超过 20MB 的文件。'
      )
    }
    return {
      name: basename(path),
      size: metadata.size,
      format: extension === '.pdf' ? ('PDF' as const) : ('Markdown' as const),
    }
  })
}
class BridgeFailure extends Error {
  constructor(
    readonly code: 'INVALID_ARGUMENT' | 'FILE_INVALID',
    message: string
  ) {
    super(message)
  }
}
