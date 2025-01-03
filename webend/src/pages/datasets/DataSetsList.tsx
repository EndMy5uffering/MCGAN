import React from 'react'
import { Link, Navigate } from 'react-router-dom'

import './DataSetsList.css'

import '../../scss/styles.scss'
import * as _bootstrap from 'bootstrap'

export const DataSetslist = () => {

  return (
    <div className='page-container'>
      <div className='inner-container'>
        <div className='container text-center d-flex flex-column'>
          <div className='row'>
            <div className='col mb-2'>
              <div className='card p-2 flex-row justify-content-between'>
                <span className='p-0'>List of data sets</span>
                <button className='btn btn-info align-self-end' style={{width: "10%", height: "2rem", padding: "0"}}>New</button>
              </div>
            </div>
          </div>
          <div className='row flex-grow-1'>
            <div className='col-8 d-flex justify-content-center'>
              <div className='card p-1 flex-fill'>
                  <table className='table table-striped table-hover table-sm'>
                    <thead className='sticky-top'>
                      <tr>
                        <th>a</th>
                        <th>b</th>
                        <th>c</th>
                      </tr>
                    </thead>
                    <tbody className='table-group-divider'>
                      {
                        [...Array(12).keys()].map(i => (
                          <tr key={i}>
                            <td>ID:{i}</td><td>2</td><td>3</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
              </div>
            </div>
            <div className='col'>
              <div className='card'>
                stuff
              </div>
            </div>
            <div className='col'>
              <div className='card'>
                asdf
              </div>
            </div>
            <div className='col'>
              <div className='card'>
                stuff
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
