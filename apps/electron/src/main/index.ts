import { app, BrowserWindow, nativeTheme } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { is, optimizer } from '@electron-toolkit/utils'
import { createPreferences } from './preferences'
import { isTrustedPage, registerWindowIpc } from './ipc'

let mainWindow: BrowserWindow | undefined
let preferences: ReturnType<typeof createPreferences>
const entryUrl =
  is.dev && process.env['ELECTRON_RENDERER_URL']
    ? process.env['ELECTRON_RENDERER_URL']
    : pathToFileURL(join(__dirname, '../renderer/index.html')).href

const applyAppearance = (): void => {
  nativeTheme.themeSource = preferences.getTheme()
  mainWindow?.setBackgroundColor(
    nativeTheme.shouldUseDarkColors ? '#1b1b1b' : '#ffffff'
  )
}

const createWindow = (): void => {
  applyAppearance()
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    show: false,
    title: '钩玄',
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1b1b1b' : '#ffffff',
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 18, y: 18 },
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedPage(url, entryUrl)) event.preventDefault()
  })
  mainWindow.webContents.on('will-redirect', event => event.preventDefault())
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false)
  )
  mainWindow.webContents.session.setPermissionCheckHandler(() => false)
  mainWindow.on('closed', () => {
    mainWindow = undefined
  })
  mainWindow.loadURL(entryUrl)
}

app.setName('Gouxuan')
app.whenReady().then(() => {
  if (is.dev && process.platform === 'darwin') {
    app.dock?.setIcon(
      join(__dirname, '../../build/icons/gouxuan-v1/app-icon-macos-1024.png')
    )
  }
  preferences = createPreferences(app.getPath('userData'))
  applyAppearance()
  nativeTheme.on('updated', () => {
    mainWindow?.setBackgroundColor(
      nativeTheme.shouldUseDarkColors ? '#1b1b1b' : '#ffffff'
    )
  })
  registerWindowIpc(() => mainWindow, entryUrl, {
    getPreference: preferences.getTheme,
    setPreference: mode => {
      preferences.setTheme(mode)
      applyAppearance()
    },
  })
  app.on('browser-window-created', (_, window) =>
    optimizer.watchWindowShortcuts(window)
  )
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('will-quit', () => preferences?.close())
