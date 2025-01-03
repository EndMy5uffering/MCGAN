import React, { ReactNode } from 'react'
import './Button.css'

interface ButtonProps{
    children?: ReactNode
    onClick?: () => void
    style?: React.CSSProperties
}

export const Button = (props: ButtonProps) => {
  return (
    <button className="custom-button-style" style={props.style} onClick={props.onClick}>
        {props.children}
    </button>
  )
}
