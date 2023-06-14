import React from 'react'
import styles from './FileManager.module.css'

import PromiseButton from '../../components/PromiseButton/PromiseButton'

const FileManager = ({ fileNum, maxFileNum, codePath, loadCode, code,startCompile,endCompile, closeCurrentFile,updateCodeObj, onData, getInput, getDebugCommand,compiling }) => {
  const readFileContent = (filePath) => {
    return new Promise((resolve, reject) => {
      fetch(filePath)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const fileContent = event.target.result
            resolve(fileContent)
          }
          reader.onerror = (event) => {
            reject(event.target.error)
          }
          reader.readAsText(blob)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const openFile = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const filePaths = await window.electronAPI.openFile()
        for(let filePath of filePaths){
          const fileContent = await readFileContent(filePath)
          loadCode(filePath, fileContent)
        }
        
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  const saveFile = () => {
    return new Promise(async (resolve, reject) => {
      try {
        await window.electronAPI.saveFile(codePath, code)
        updateCodeObj({
          saved:true
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  const saveFileAs = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const filePath = await window.electronAPI.openFileSave()
        await window.electronAPI.saveFile(filePath, code)
        updateCodeObj({
          codePath:filePath,
          saved:true
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  const runCompiler = (debugSwitch) => {
    return new Promise(async (resolve, reject) => {
      try {
        startCompile(debugSwitch)
        for(let key in window.paths){
          window.electronAPI.saveFile(window.paths[key], '')
        }
        await window.electronAPI.runCompiler({inputFilePath:codePath,...window.paths}, {onData, getInput,getDebugCommand},debugSwitch)
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        endCompile()
      }
    })
  }

  const closeFile = () => {
    return new Promise((resolve, reject) => {
      try {
        closeCurrentFile()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }


  return (
    <div className={styles.FileManager}>
      {fileNum < maxFileNum ? <PromiseButton text="打开文件" promiseFunc={openFile} /> : ''}

      {fileNum > 0 ? (
        <React.Fragment>
          <PromiseButton text="保存" promiseFunc={saveFile} />
          <PromiseButton text="另存为..." promiseFunc={saveFileAs} />
          <PromiseButton text="关闭文件" promiseFunc={closeFile} />
          <PromiseButton text="编译" available={compiling!=2} promiseFunc={runCompiler}/>
          <PromiseButton text="调试" available={compiling!=1} promiseFunc={runCompiler} args={[true]}/>
        </React.Fragment>
      ) : (
        ''
      )}
    </div>
  )
}
export default FileManager
