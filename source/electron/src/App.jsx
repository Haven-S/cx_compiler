import React from 'react'
import { Component } from 'react'

import styles from './App.module.css'

import CodeEditor from './panels/CodeEditor/CodeEditor'
import FileTabbar from './panels/FileTabbar/FileTabbar'
import FileManager from './panels/FileManager/FileManager'
import TitleBox from './components/TitleBox/TitleBox'
import Debugger from './panels/Debugger/Debugger'
import SymbolViewer from './panels/SymbolViewer/SymbolViewer'

class App extends Component {
  maxFileNum = 5

  debuggerRef = React.createRef()
  inputRef = React.createRef()

  constructor(props) {
    super(props)
    this.state = {
      activeIndex: -1,
      fileNum: 0,
      codeList: [],
      assemblyCode: '',
      assmCodeLine: 0,
      output: '',
      result: '',
      input: '',
      stack: '',
      runningStack:{},
      readLine: 0,
      readNum: 0,
      compiling: 0,
      pcodes:[]
    }
  }

  switchActiveIndex = (newIndex) => {
    this.setState({
      ...this.state,
      activeIndex: newIndex
    })
  }

  getCurrentCodeObj = () => {
    let { codeList, activeIndex } = this.state
    return activeIndex >= 0
      ? codeList[activeIndex]
      : {
          code: '',
          codePath: '',
          saved: true
        }
  }

  getCurrentCode = () => {
    return this.getCurrentCodeObj().code
  }

  getCurrentCodePath = () => {
    return this.getCurrentCodeObj().codePath
  }

  closeCurrentFile = () => {
    this.setState({
      ...this.state,
      activeIndex: this.state.codeList.length - 1 - 1,
      fileNum: this.state.fileNum - 1,
      codeList: this.state.codeList.filter((item, key) => (key == this.state.activeIndex ? false : true))
    })
  }

  loadCode = (filePath, fileContent) => {
    let { codeList, fileNum } = this.state
    let found = false
    for (let i = 0; i < codeList.length; i++) {
      if (codeList[i].codePath == filePath) {
        this.setState({
          ...this.state,
          activeIndex: i,
          codeList: this.state.codeList.map((item, key) => (key == this.state.activeIndex ? { ...item, code: fileContent } : item))
        })
        codeList[i].code = fileContent
        found = true
        break
      }
    }
    if (found === false && fileNum < this.maxFileNum) {
      this.setState({
        ...this.state,
        activeIndex: fileNum,
        fileNum: fileNum + 1,
        codeList: codeList.concat([
          {
            code: fileContent,
            codePath: filePath,
            saved: true
          }
        ])
      })
    }
  }

  // updateCode = (newcode) =>{
  //   this.setState({
  //     ...this.state,
  //     codeList:this.state.codeList.map((item,key)=>key == this.state.activeIndex?{...item,code: newcode}:item)
  //   })
  // }

  // loadResult = (assemblyCode, result, output) => {
  //   this.setState({
  //     ...this.state,
  //     assemblyCode: assemblyCode,
  //     result: result,
  //     output: output
  //   })
  // }

  updateCodeObj = (newObj) => {
    this.setState({
      ...this.state,
      codeList: this.state.codeList.map((item, key) => (key == this.state.activeIndex ? { ...item, ...newObj } : item))
    })
  }

  updateInput = (input) => {
    this.setState({
      ...this.state,
      input: input
    })
  }

  onTerminalOutput = (output) => {
    this.setState({
      ...this.state,
      ...output
    })
  }

  clearPanel = (debugSwitch) => {
    setTimeout(() => {
      this.setState({
        ...this.state,
        assemblyCode: '',
        output: '',
        result: '',
        input: '',
        stack: '',
        runningStack:{},
        pcodes:[],
        compiling: debugSwitch?2:1,
  
      })
    },0)

  }

  getReadLine = () => {
    const lines = this.state.codeList[this.state.activeIndex].code.split('\n') // 将代码字符串分割为行数组
    const readLines = [] // 存储包含'read'的行数

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('read')) {
        const matches = lines[i].match(/read/g) // 匹配'read'出现的次数
        for (let j = 0; j < matches.length; j++) {
          readLines.push(i + 1) // 将行数（从1开始）添加到readLines数组
        }
      }
    }

    return readLines
  }

  startCompile = (debugSwitch) => {
    this.clearPanel(debugSwitch)
  }

  endCompile = () => {
    this.clearNum()
  }

  clearNum = ()=>{
    setTimeout(() => {
      this.setState({
        ...this.state,
        compiling: 0,
        assmCodeLine: 0,
        readLine: 0,
        readNum: 0,
      })
    }, 0);

  }

  componentDidMount() {
    this.getTerminalInput = async () => {
      const readLines = this.getReadLine()
      this.setState({
        ...this.state,
        readNum: (this.state.readNum + 1) % readLines.length,
        readLine: readLines[this.state.readNum]
      })
      await this.inputRef.current.getEnterSignal()
      let input = this.state.input
      this.setState({
        ...this.state,
        input: '',
        readLine: 0
      })
      return input
    }
    this.getDebugCommand = async () => {
      return await this.debuggerRef.current.getDebugCommand()
    }
  }

  render() {
    const { getCurrentCodePath, getCurrentCode, switchActiveIndex, loadCode, updateCodeObj, updateInput,  closeCurrentFile, maxFileNum, onTerminalOutput, getTerminalInput,getDebugCommand, inputRef,debuggerRef, startCompile, endCompile, } = this
    const { activeIndex, codeList, assemblyCode,assmCodeLine, result, output, input, readLine, compiling,stack,runningStack,symbolTableList,pcodes } = this.state
    const fileList = codeList.map((value, index) => {
      return {
        filename: value.codePath.split('\\').at(-1),
        saved: codeList[index].saved
      }
    })
    const code = getCurrentCode()
    const codePath = getCurrentCodePath()
    const currentLine = (pcodes.length>0&&assmCodeLine>0)?pcodes[assmCodeLine-1][3]:0
    const symbolTable = (assmCodeLine>0&&pcodes&&pcodes[assmCodeLine-1]&&symbolTableList)?symbolTableList[pcodes[assmCodeLine-1][4]]:null
    return (
      <div className={styles.viewport}>
        <div className={styles.menuPanel}>
        <FileManager
          fileNum={codeList.length}
          maxFileNum={maxFileNum}
          codePath={codePath}
          code={code}
          startCompile={startCompile}
          endCompile={endCompile}
          loadCode={loadCode}
          closeCurrentFile={closeCurrentFile}
          updateCodeObj={updateCodeObj}
          onData={onTerminalOutput}
          getInput={getTerminalInput}
          getDebugCommand = {getDebugCommand}
          compiling = {compiling}
        />
        {compiling==2?(<Debugger ref={debuggerRef}/>):''}
        </div>
        <div className={styles.runningPanel}>
          <div>
            <FileTabbar activeIndex={activeIndex} fileList={fileList} switchActiveIndex={switchActiveIndex} />
            <CodeEditor codePath={codePath} code={code} output={output} height={400} updateCodeObj={updateCodeObj} currentLine={currentLine} readLine={readLine?readLine:0} readonly={compiling?true:false} />
          </div>
          {/* <CodeEditor code={runningOutput} width={500} height={300}/>  */}
          <div>
            <TitleBox title="汇编代码" />
            <CodeEditor code={assemblyCode} currentLine={assmCodeLine}  readonly width={200} height={400} />
          </div>
          <div>
            <TitleBox title="运行栈" />
            <CodeEditor code={stack} readonly width={200} height={400} />
          </div>
          <div>
            <TitleBox title="符号表" />
            <SymbolViewer symbolTable={symbolTable} runningStack={runningStack}/>
          </div>

        </div>
        <div className={styles.resultPanel}>
          <div>
            <TitleBox title="输入" />
            <CodeEditor ref={inputRef} code={input} width={200} height={300} updateInput={updateInput} />
          </div>
          <div>
            <TitleBox title="运行结果" />
            <CodeEditor code={result} readonly width={300} height={300} />
          </div>
          <div>
            <TitleBox title="输出" />
            <CodeEditor code={output} readonly width={800} height={300} />
          </div>
        </div>
      </div>
    )
  }
}

export default App
