import React, { ReactNode, useState } from 'react'
import { Button } from '../button/Button'
import './InlineEdit.css'

interface InlineEditProps {
    onSave?: (currentValue: any) => boolean
    value: any
}

export const InlineEdit = (props: InlineEditProps) => {

    const [inEdit, setinEdit] = useState(false)
    const [currentValue, setcurrentValue] = useState(props.value)
    const [inputValue, setinputValue] = useState(props.value)

  return (
    <div className="display-editor" onClick={() => !inEdit && setinEdit(true)}>
        {inEdit && (
            <>
                <input onChange={(e) => setinputValue(e.target.value)} defaultValue={currentValue}/>
                <Button onClick={() => {
                    setinEdit(false);
                    if(props.onSave?.(currentValue)) setcurrentValue(inputValue)
                }}>Save</Button>
                <Button onClick={() => {
                    setinEdit(false);
                }}>X</Button>
            </>
        )}
        {!inEdit && <>
            {currentValue}
            <img width="32px" src='/pen_icon.svg'/>
        </>}
        
    </div>
  )
}
