import React, { useEffect } from 'react'
import { useImperativeHandle,forwardRef,useState,useRef } from 'react'
import styles from './Debugger.module.css'

import PromiseButton from '../../components/PromiseButton/PromiseButton'

const Debugger = forwardRef((props,ref) => {
  let cmdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getDebugCommand
  }))

  const getDebugCommand = async ()=>{
    
    cmdRef.current = null
    return await new Promise((resolve) => {
      const intervalId = setInterval(() => {
        if (cmdRef.current) {
          clearInterval(intervalId);
          resolve(cmdRef.current);
        }
      }, 100)
    })
  }

  const setCommandAsync = async (newCmd)=>{
    cmdRef.current = newCmd
  }


  return (
    <div className={styles.Debugger}>
      <PromiseButton text="Pcode单步" promiseFunc={setCommandAsync} args={["one"]}/>
      <PromiseButton text="CX单行" promiseFunc={setCommandAsync} args={["line"]}/>
      <PromiseButton text="至块结束" promiseFunc={setCommandAsync} args={["block"]}/>
      <PromiseButton text="至程序结束" promiseFunc={setCommandAsync} args={["end"]}/>
    </div>
  )
})
export default Debugger
