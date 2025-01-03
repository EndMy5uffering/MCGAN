import React, { ReactNode } from 'react'

export interface OptionProps{
    children?: ReactNode
    disabled?: boolean
    hidden?: boolean
    value?: string
    id?: string
}

export const Option = (props: OptionProps) => {
  return (
    <option 
        className='dropdown-opt'
        value={props.value}
        id={props.id}
        disabled={props.disabled}  
        hidden={props.hidden}>
            {props.children}
    </option>
  )
}
