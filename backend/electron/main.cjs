const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 800,
    minHeight: 680,
    backgroundColor: '#0b0c0d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  const loadPromise = process.env.VITE_DEV_SERVER_URL
    ? window.loadURL(process.env.VITE_DEV_SERVER_URL)
    : window.loadFile(path.join(__dirname, '..', '..', 'dist', 'frontend', 'index.html'));
  loadPromise.catch((err) => {
    console.error('Failed to load renderer:', err.message);
    window
      .loadURL(
        `data:text/html,<h1 style="color:#d84032;padding:40px;font-family:sans-serif">Failed to load Shiftwork</h1>`,
      )
      .catch(() => {});
  });
};

app.whenReady().then(() => {
  ipcMain.handle('window:set-fullscreen', (event, enabled) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.setFullScreen(Boolean(enabled));
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
