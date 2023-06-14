const { app,BrowserWindow,dialog,ipcMain } = require('electron')
const path = require('path')
const fs = require('fs/promises')

async function handleFileOpen (event) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  })
  if (canceled) {

  } else {
    return filePaths
  }
}

async function handleFileSaveOpen (event) {
  const { canceled, filePath } = await dialog.showSaveDialog()
  if (canceled) {

  } else {
    return filePath
  }
}

async function handleFileSave (event,filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    console.log('File saved successfully.')
  } catch (err) {
    throw new Error('Failed to save file:',filePath, err)
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    title:"CX_complier",
    frame:true,
    autoHideMenuBar:true,
    alwaysOnTop: false,
    // transparent:true,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname,'preload.js')
    },
    show:false
  })

  win.loadFile(path.join(__dirname, 'index.html'));

  win.on('ready-to-show',()=>{
    win.show()
    // win.webContents.openDevTools()

  })
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen)
  ipcMain.handle('dialog:openFileSave', handleFileSaveOpen)
  ipcMain.handle('dialog:saveFile', handleFileSave)
  createWindow()
})
