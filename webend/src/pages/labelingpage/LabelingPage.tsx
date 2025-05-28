import React from 'react'
import { Link, Navigate } from 'react-router-dom'

import './LabelingPage.css'

import '../../scss/styles.scss'

export const LabelingPage = () => {

  return (
    <div className='page-container'>
      <div className='inner-container'>
        <div className='card' style={{padding: "1rem", width: "50%", margin: "1rem"}}>
            Training Set
        </div>
        <div className='card' style={{padding: "1rem", width: "50%", margin: "1rem"}}>
            Model
        </div>
      </div>
    </div>
  )
}
