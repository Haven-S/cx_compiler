import React from 'react'
import styles from './TitleBox.module.css'

const TitleBox = ({ title }) => {
  return (
    <div className={styles.TitleBox}>
      {title}
    </div>
  )
}

export default TitleBox 