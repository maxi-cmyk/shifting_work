const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const outputDir = process.argv[2] || '/tmp/shiftwork-visual-smoke';
const target =
  process.env.SHIFTWORK_URL ||
  `file://${path.join(__dirname, '..', '..', 'dist', 'frontend', 'index.html')}`;

const sampleState = {
  tasks: [
    {
      id: 'task-1',
      title: 'Clear the morning inbox',
      gear: 1,
      targetMinutes: 10,
      status: 'queued',
      position: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Shape the launch narrative',
      gear: 2,
      targetMinutes: 20,
      status: 'queued',
      position: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Build interaction prototype',
      gear: 3,
      targetMinutes: 30,
      status: 'queued',
      position: 2,
      createdAt: new Date().toISOString(),
    },
  ],
  history: [],
  activeSession: null,
  preferences: { onboardingComplete: true, soundEnabled: false, reducedMotion: false },
};

app.whenReady().then(async () => {
  await fs.mkdir(outputDir, { recursive: true });
  const errors = [];
  ipcMain.handle('window:set-fullscreen', (event, enabled) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow) targetWindow.setFullScreen(Boolean(enabled));
  });
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    show: false,
    backgroundColor: '#090a0b',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: 'shiftwork-visual-smoke',
      preload: path.join(__dirname, '..', 'electron', 'preload.cjs'),
    },
  });
  window.webContents.on('console-message', (event) => {
    if (event.level === 'error' || event.level === 'warning') errors.push(event.message);
  });

  await window.loadURL(target);
  await window.webContents.executeJavaScript('localStorage.clear()');
  await new Promise((resolve) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.reload();
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  await fs.writeFile(
    path.join(outputDir, '01-onboarding.png'),
    (await window.webContents.capturePage()).toPNG(),
  );

  await window.webContents.executeJavaScript(
    `localStorage.setItem('shiftwork.mvp.state.v1', ${JSON.stringify(JSON.stringify(sampleState))})`,
  );
  await new Promise((resolve) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.reload();
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  await window.webContents.executeJavaScript(
    "window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))",
  );
  await new Promise((resolve) => setTimeout(resolve, 350));
  await fs.writeFile(
    path.join(outputDir, '02-cockpit.png'),
    (await window.webContents.capturePage()).toPNG(),
  );
  window.setSize(800, 720);
  await new Promise((resolve) => setTimeout(resolve, 300));
  await fs.writeFile(
    path.join(outputDir, '03-compact.png'),
    (await window.webContents.capturePage()).toPNG(),
  );

  const focusState = {
    ...sampleState,
    tasks: sampleState.tasks.map((task, index) => ({
      ...task,
      status: index === 0 ? 'active' : 'queued',
    })),
    activeSession: {
      taskId: 'task-1',
      accumulatedSeconds: 154,
      lastStartedAt: null,
      isRunning: false,
      currentGear: 1,
    },
  };
  await window.webContents.executeJavaScript(
    `localStorage.setItem('shiftwork.mvp.state.v1', ${JSON.stringify(JSON.stringify(focusState))})`,
  );
  window.setSize(1440, 920);
  await new Promise((resolve) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.reload();
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
  const fullscreenObserved = window.isFullScreen();
  window.setFullScreen(false);
  await new Promise((resolve) => setTimeout(resolve, 650));
  await fs.writeFile(
    path.join(outputDir, '04-focus.png'),
    (await window.webContents.capturePage()).toPNG(),
  );
  await fs.writeFile(path.join(outputDir, 'renderer-errors.json'), JSON.stringify(errors, null, 2));

  console.log(
    JSON.stringify({ outputDir, target, fullscreenObserved, rendererErrors: errors }, null, 2),
  );
  app.quit();
});
