const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    frame: false,
    icon: path.join(__dirname, 'app-icon', 'app-256.png'), // 设置窗口图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile('./index.html'); // 加载你的应用

  // 处理最小化、关闭和置顶的IPC消息
  ipcMain.on('minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('getUserDataPath', (event) => {
    event.reply('userDataPath', app.getPath('appData'));
  });

  ipcMain.on('close', () => {
    mainWindow.close();
  });

  ipcMain.on('toggle-topmost', () => {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop(); // 检测当前窗口是否置顶
    if (isAlwaysOnTop) { // 如果已置顶
      mainWindow.setAlwaysOnTop(false); // 取消置顶
    } else {
      mainWindow.setAlwaysOnTop(true); // 置顶
    }
  });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  //运行exec 结束python进程
  exec('taskkill /f /im python.exe');
  app.quit();
});