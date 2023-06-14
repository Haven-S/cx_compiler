import React from "react"
const addIcon = (props) => {
  const { width, height, fill } = props
  const viewBox = `0 0 ${width} ${height}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" transform={`scale(${parseInt(width)/24},${parseInt(height)/24})`}>
      <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"
        fill={fill ? fill : '#000'}>
      </path>
    </svg>
  )
}
export default addIcon 