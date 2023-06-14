import React from "react"

const PencilIcon = (props) => {
  const { width, height, fill } = props
  const viewBox = `0 0 ${width} ${height}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" transform={`scale(${parseInt(width)/24},${parseInt(height)/24})`}><path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V18.89H6.41421L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74786L17.1421 5.33365L15.7279 6.74786L17.1421 8.16207ZM7.24264 20.89H3V16.6474L16.435 3.21233C16.8256 2.8218 17.4587 2.8218 17.8492 3.21233L20.6777 6.04075C21.0682 6.43128 21.0682 7.06444 20.6777 7.45497L7.24264 20.89Z"
        fill={fill ? fill : '#000'}></path></svg>
  )
}
export default PencilIcon 
