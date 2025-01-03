import React, { Children, ReactNode } from 'react'
import './Dropdown.css'


export interface DropdownProps{
    children?: ReactNode
    name?: string
    id?: string
    defaultValue?: string
    onChange?: React.ChangeEventHandler<HTMLSelectElement>
    onClick?: React.MouseEventHandler<HTMLSelectElement>
}

export const Dropdown = (props: DropdownProps) => {
  return (
    <select 
    name={props.name}
    id={props.id}
    className='dropdown-style'
    onChange={props.onChange}
    defaultValue={props.defaultValue}
    onClick={props.onClick}>
        {props.children}
    </select>
  )
}
