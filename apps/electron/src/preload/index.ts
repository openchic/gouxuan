import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { DesktopBridge } from '../shared/ipc'

const desktop: DesktopBridge = {
  platform: process.platform,
  appearance: {
    getPreference: () => ipcRenderer.invoke(IPC_CHANNELS.getTheme),
    setPreference: mode => ipcRenderer.invoke(IPC_CHANNELS.setTheme, mode),
    setContext: context =>
      ipcRenderer.invoke(IPC_CHANNELS.setAppearanceContext, context),
  },
  knowledge: {
    chooseFile: () => ipcRenderer.invoke(IPC_CHANNELS.chooseKnowledgeFile),
  },
}
contextBridge.exposeInMainWorld('desktop', desktop)
