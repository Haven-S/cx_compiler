import React from 'react'
import styles from './FileTabbar.module.css'

const FileTabbar = ({activeIndex,fileList,switchActiveIndex}) => {
  return (
    <div className={styles.wrapper}>
    <div className={styles.FileTabbar}>
      {fileList.map((item,index)=>{
        return <div 
        className={styles.tabbarItem + ' ' + (activeIndex==index?styles.tabbarItemActive:'') +' ' + ((item.saved==false)?styles.tabbarItemUnSaved:'')} 
        onClick={()=>switchActiveIndex(index)}
        >{item.filename}</div>
      })}
      {Array.from({ length: 5 }, () => (<div className={styles.tabbarItem}></div>))}
      
    </div>
    </div>
  )
}
export default FileTabbar
