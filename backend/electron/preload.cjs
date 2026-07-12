const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shiftworkDesktop', {
  platform: process.platform,
  setFullscreen: (enabled) => ipcRenderer.invoke('window:set-fullscreen', Boolean(enabled)),
})
