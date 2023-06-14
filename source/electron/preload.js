const { contextBridge,ipcRenderer } = require('electron')
const {runCompiler} = require('./electronUtils/child-process.js')
const path = require('path')


contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFileSave: () => ipcRenderer.invoke('dialog:openFileSave'),
  saveFile: (...args) => ipcRenderer.invoke('dialog:saveFile', ...args),
  runCompiler:runCompiler
})

function getUrl(filename){
  return path.resolve(__dirname ,'..','compiler'  , filename)
}

contextBridge.exposeInMainWorld('paths', {
  fcodePath: getUrl('fcode.txt'),
  fresultPath: getUrl('fresult.txt'),
  foutputPath: getUrl('foutput.txt'),
  fstackPath:getUrl('fstack.txt'),
  fcodeIndexPath:getUrl('fcodeindex.txt'),
  fdebugPath:getUrl('fdebug.txt'),
  ftablePath:getUrl('ftable.txt')
})
