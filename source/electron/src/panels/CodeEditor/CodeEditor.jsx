import React from 'react'
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import styles from './CodeEditor.module.css'
import analyseOutput from '../../utils/analyseOutput.js'

const CodeEditor = forwardRef(({codePath,code,currentLine,readLine,updateCodeObj,updateInput,width=600,height=300,output,readonly = false},ref) => {
  const [highlightedText, setHighlightedText] = useState('')
  const textareaRef = useRef(null)
  const containerRef = useRef(null)
  const [textHeight, setTextHeight] = useState(0)
  const [errList,setErrList] = useState([])
  const LineHeight = 20

  useEffect(()=>{
    if(!readonly){
      const { current } = containerRef
      current.scrollTop = 0
    }
  },[codePath])

  useEffect(()=>{
    let {
      isError,
      errors,
    } = analyseOutput(output)
    if(isError){
      let errList=[]
      for(let error of errors){
        errList.push(error.line)
      }
      setErrList(errList)
    }
  },[output])

  function getEnterSignal() {
    return new Promise((resolve) => {
      let textarea = textareaRef.current
  
      textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          resolve()
        }
      });
  
      textarea.focus()
    });
  }

  useImperativeHandle(ref, () => ({
    getEnterSignal,
  }));

  const highlightText = (originText,...regs) =>{
    let size = regs.length
    let highlightedText = originText
    let placeholdersList = []
    for(let i=0;i<size;i++){
      let reg = regs[i]
      placeholdersList.push([])
      highlightedText = highlightedText.replace(reg, (match) => {

        // 生成占位符
        const placeholder = `@${i}_${placeholdersList[i].length}@`
        // 将匹配项用占位符替换
        placeholdersList[i].push(match)
        return placeholder
        
      })
    }
    for(let i=0;i<size;i++){
      let placeholders = placeholdersList[i]
      placeholders.forEach((placeholder, index) => {
        const regex = new RegExp(`@${i}_${index}@`, 'g')
        let style = styles[`highlight${i}`]
        highlightedText = highlightedText.replace(regex, `<span class="${style}">${placeholder}</span>`)
      })
    }
    return highlightedText
  }


  function highlightCode(){
    if(!readonly){
      const { current } = textareaRef
      setTextHeight(current.scrollHeight)
    }
    if(!code){
      setHighlightedText("")
      return
    }


    const inputValue = code
    
    
    const commentBlockRegex = /\/\*[\s\S]*?\*\//g
    const numberRegex = /(?<![a-zA-Z@_])[0-9]+/g
    const operators = ["\\+", "\\-", "\\*", "\\/", "\\%", "==","!=","\\|\\|", "&&", "XOR","\\<=","\\<", "\\>=",  "\\>","=",]
    const operatorRegexPattern = operators.map(operator => `(${operator})`).join('|');
    const operatorRegex = new RegExp(operatorRegexPattern, 'gi')
    const keywords = ['int', 'bool', 'struct', 'new', 'if', 'else', 'while', 'repeat', 'until', 'write', 'read', 'true', 'false']
    const keywordRegexPattern = keywords.map(keyword => `\\b${keyword}\\b`).join('|');
    const keywordRegex = new RegExp(keywordRegexPattern, 'gi')
    const indentRegex = /\b[A-Za-z][A-Za-z0-9]*\b/g;

    let highlightedText = highlightText(inputValue,commentBlockRegex,numberRegex,keywordRegex,operatorRegex,indentRegex)
    setHighlightedText(highlightedText)
  }

  useEffect(() => {
    highlightCode()
    if(code){
      setErrList([])
    }
  }, [code])

  const generateLineNumbers = () => {
    if(!code||code==''){
      return ''
    }
    const lines = code.split('\n')
    const lineCount = lines.length

    return Array.from({ length: lineCount }, (_, index) => <div key={index + 1}>{index + 1}</div>)
  }

  const generateEmphasizedLines = () =>{
    return Array.from({ length: errList.length }, (_, index) => <div key={index + 1} style={{top:`${(errList[index]-1) * LineHeight}px`}} className={styles.emphasizedLine}></div>)
  }

  const generateCurrentLine = () =>{
    if(currentLine&&currentLine>0){
      return(<div style={{top:`${(currentLine-1) * LineHeight}px`}} className={styles.currentLine}></div>)
    }
    return null
  }

  const generateReadLine = () =>{
    if(readLine&&readLine>0){
      return(<div style={{top:`${(readLine-1) * LineHeight}px`}} className={styles.readLine}></div>)
    }
    return null
  }

  const handleCodeChange = (event) => {
    updateCodeObj&&updateCodeObj({
      code:event.target.value,
      saved:false
    })
    updateInput&&updateInput(event.target.value)
  }

  return (
      <div ref={containerRef} class={styles.textareaContainer} style={{width:width+'px',height:height+'px'}}>
        <div class={styles.emphasizedLines}>{generateEmphasizedLines()}{generateCurrentLine()}{generateReadLine()}</div>
        <div className={styles.highlightedText} dangerouslySetInnerHTML={{ __html: highlightedText }}></div>
        {readonly?'':(<textarea ref={textareaRef} class={styles.text} style={{ minHeight:height+'px',height: textHeight + 'px' }} value={code} onChange={handleCodeChange} spellCheck={false}></textarea>)}
        <div class={styles.lineNumbers}>{generateLineNumbers()}</div>
      </div>
  )
})
export default CodeEditor
