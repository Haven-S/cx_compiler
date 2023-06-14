import React from "react"

const arrowUpIcon = (props) => {
  const { width, height, fill } = props
  const viewBox = `0 0 ${width} ${height}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" transform={`scale(${parseInt(width)/24},${parseInt(height)/24})`}>
      <path d="M11.9997 10.8284L7.04996 15.7782L5.63574 14.364L11.9997 8L18.3637 14.364L16.9495 15.7782L11.9997 10.8284Z"
        fill={fill ? fill : '#000'}>
      </path>
    </svg>
  )
}
export default arrowUpIcon 
