import React from 'react'
import styles from './SymbolViewer.module.css'

const SymbolViewer = ({ symbolTable, runningStack: { stack, base } }) => {
  const typeList = ['int', 'bool', 'struct Definition', 'struct Declaration']

  const getValue = (index) => {
    let value = symbolTable[index]
    let val = stack[base[value[4]] + value[3]]
    let type = value[1]
    if (type == 1) {
      val = val == 0 ? 'false' : 'true'
    } else if (type >= 2) {
      val = null
    }
    return val
  }

  const getType = (index) => {
    let value = symbolTable[index]
    let typeNum = value[1]
    let type = typeList[typeNum]
    if (typeNum == 3 || (typeNum == 2 && value[5] != -1)) {
      type = symbolTable[value[5]][0]
    }
    return type
  }

  const genSymbols = () => {
    if (symbolTable && stack) {
      let structDepth = 0
      let structStack = []
      let structEnd = false
      return symbolTable.map((value, index) => {
        if(structStack.length>0){
          structDepth = structStack.length
          structStack[structStack.length-1] = structStack[structStack.length-1] - 1
        }
        else{
          structDepth = 0
          structEnd = false
        }
        if(value[1] == 2 || value[1] == 3){
          structStack.push(value[6])
        }
        while(structStack.length>0){
          if(structStack[structStack.length-1]<=0){
            structEnd = true
            structStack.pop()
          }
          else{
            break
          }
        }
        return (
          <React.Fragment>
          
          <div>
            {' '.repeat(value[2] - 1 + structDepth)}
            <span className={styles.highlight4}>{value[0]}</span>
            {' '}
            <span className={styles.highlight3 + ' ' + styles.small}>{getType(index)}</span>
            {' '}
            <span className={styles.highlight1}>{getValue(index)}</span>
            {' '}
          </div>
          {structEnd?(<div className={styles.splitLine}></div>):''}
          </React.Fragment>
        )
      })
    }
    return null
  }
  return <div className={styles.Container}>{genSymbols()}</div>
}
export default SymbolViewer
