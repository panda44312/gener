const { app, BrowserWindow, ipcMain } = require('electron');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new MicaBrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    //隐藏标题栏
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'app-icon', 'app-256.png'), // 设置窗口图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  //隐藏
  win.setAutoTheme();
  win.setMicaEffect();        // Mica Effect
  // win.alwaysFocused(true);    // Always focused
  
  win.loadFile('./index.html'); // 加载你的应用

  win.webContents.once('dom-ready', () => {
    win.show();
  });

  // 处理最小化、关闭和置顶的IPC消息
  ipcMain.on('minimize', () => {
    win.minimize();
  });

  ipcMain.on('getUserDataPath', (event) => {
    event.reply('userDataPath', app.getPath('appData'));
  });

  ipcMain.on('close', () => {
    app.quit();
  });

  ipcMain.on('toggle-topmost', () => {
    const isAlwaysOnTop = win.isAlwaysOnTop(); // 检测当前窗口是否置顶
    if (isAlwaysOnTop) { // 如果已置顶
      win.setAlwaysOnTop(false); // 取消置顶
    } else {
      win.setAlwaysOnTop(true); // 置顶
    }
  });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  exec('taskkill /f /im python.exe');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});