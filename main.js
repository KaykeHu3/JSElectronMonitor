const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fileWatcher = require('./fileWatcher.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(async () => {
  createWindow();
  
  // Carregar pastas salvas
  await fileWatcher.loadFoldersMap();

  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths;
  });

  ipcMain.on('add-folder', (event, { sourceFolder, destinationFolder }) => {
    fileWatcher.addFolderMap({ [sourceFolder]: destinationFolder });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
