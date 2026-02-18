import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Chromium flags required for the Zoom CCI SDK's WebRTC media pipeline.
// Must be set before app 'ready' fires.
app.commandLine.appendSwitch('use-fake-ui-for-media-stream')
app.commandLine.appendSwitch('enable-usermedia-screen-capturing')
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer,WebRtcHideLocalIpsWithMdns')

/** Main process runs from out/main/index.js; app root is two levels up. */
function getAppPaths() {
  const appRoot = resolve(__dirname, '..', '..')
  return {
    preload: join(appRoot, 'out', 'preload', 'index.js'),
    renderer: join(appRoot, 'out', 'renderer', 'index.html')
  }
}

function createWindow() {
  const { preload, renderer } = getAppPaths()

  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 768,
    minHeight: 1024,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(renderer)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Grant camera, microphone, and display-capture so the Zoom CCI SDK
  // can access media devices inside the renderer process.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(true)
  })

  session.defaultSession.setPermissionCheckHandler(() => {
    return true
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
