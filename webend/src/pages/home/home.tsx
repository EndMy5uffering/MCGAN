import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import './home.css'

import '../../scss/styles.scss'

export const Home = () => {

  return (
    <div className='home-container'>
      <div className='home-card' id='tilesetCard'>
          <Link to="/schematics">🔧Schematics</Link>
      </div>
      <div className='home-card' id='labelingCard'>
          <Link to="/datasets">🗃️Data Sets</Link>
      </div>
      <div className='home-card' id='dungeonCard'>
          <Link to="/ai">🧠AI Training</Link>
      </div>
    </div>
  )
}
