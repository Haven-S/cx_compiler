import React from "react"


const arrowDownIcon = (props) => {
  const { width, height, fill } = props
  const viewBox = `0 0 ${width} ${height}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" transform={`scale(${parseInt(width)/24},${parseInt(height)/24})`}>
      <path d="M11.9997 13.1714L16.9495 8.22168L18.3637 9.63589L11.9997 15.9999L5.63574 9.63589L7.04996 8.22168L11.9997 13.1714Z"
        fill={fill ? fill : '#000'}>
      </path>
    </svg>
  )
}
export default arrowDownIcon 