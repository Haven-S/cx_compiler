import React from 'react'
import { useEffect } from 'react'
import styles from './PromiseButton.module.css'
import LoaderIcon from '../../assets/icons/loader'
import CloseIcon from '../../assets/icons/close'

const PromiseButton = ({ available = true,promiseFunc, reportErrFunc = undefined, text, oneTime = false, callbackFunc = undefined, args = [] }) => {
  let [isLoading, setIsLoading] = React.useState(false)
  let [isError, setIsError] = React.useState(false)
  let [isFinished, setIsFinished] = React.useState(false)

  useEffect(() => {
    let timeoutId = null
    if (isError === true) {
      timeoutId = setTimeout(() => {
        setIsError(false)
      }, 2000)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isError])

  useEffect(() => {
    let timeoutId = null

    if (isFinished) {
      timeoutId = setTimeout(() => {
        if (isFinished) {
          setIsFinished(false)
        }
      }, 1000)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isFinished])

  const handleClick = () => {
    if(!available){
      return
    }
    if (!promiseFunc) {
      setIsError(true)
    } else if (isFinished) {
      if (oneTime === false) {
        setIsFinished(false)
      }
    } else if (!isLoading && !isError) {
      setIsLoading(true)
      // console.log(promiseFunc, args)
      promiseFunc(...args)
        .then((e) => {
          setIsFinished(true)
          setIsLoading(false)
          callbackFunc && callbackFunc(e)
        })
        .catch((err) => {
          console.error(err)
          setIsLoading(false)
          setIsError(true)
          reportErrFunc && reportErrFunc(err)
        })
    } else {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.button+ ' ' + (available ? '' : styles.buttonUnavailable) + ' ' + (isFinished ? styles.buttonFinished : '') + ' ' + (isError ? styles.buttonError : ' ')} onClick={handleClick}>
      <p className={styles.opacityTransition + ' ' + (isLoading || isError ? styles.invisible : '')}>{text}</p>
      <div className={styles.spinBox + ' ' + (isLoading ? styles.spin : '')}>
        <div className={styles.iconBox + ' ' + styles.opacityTransition + ' ' + (isLoading ? '' : styles.invisible)}>
          <LoaderIcon width="24" height="24" fill="#fff" />
        </div>
      </div>
      <div className={styles.iconBox + ' ' + styles.opacityTransition + ' ' + (isError ? '' : styles.invisible)}>
        <CloseIcon width="24" height="24" fill="#fff" />
      </div>
    </div>
  )
}

export default PromiseButton
