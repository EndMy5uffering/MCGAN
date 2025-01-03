import React, { ReactNode, useState } from 'react'
import { Button } from '../button/Button'
import './MessageBox.css'

interface MessageBoxProps {
    children?: ReactNode
    close?: boolean
    onClose?: () => void
    header?: ReactNode
    footer?: ReactNode
}

const exitButtonStyle: React.CSSProperties = {
    position: "absolute",
    right: "0.2rem",
    top: "0.2rem",
    //borderRadius: "0px 0px 0px 20px"
    borderRadius: "100%",
    border: "none",
    width: "2rem",
    height: "2rem",
    display: "flex",
    padding: "0",
    justifyContent: "center",
    alignItems: "center"
}

export const MessageBox = (props: MessageBoxProps) => {
  return (
    <div className='message-box-container-style'>
        <div className='message-box-inner-container'>
            <div className='message-box-header-style'>
                <Button onClick={props.onClose} style={exitButtonStyle}>
                    <img src="/X_Icon.svg" />
                </Button>
                {props.header}
            </div>
            <div className='message-box-message-style'>
                    {props.children}
            </div>
            <div className='message-box-footer-style'>
                {props.footer}
            </div>
        </div>
    </div>
  )
}
