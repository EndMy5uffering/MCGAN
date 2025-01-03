import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSchematicStore, Schematic } from '../../stores/NBTStore'
import './schematicspage.css'

import '../../scss/styles.scss'
import * as _bootstrap from 'bootstrap'
import { SchematicView } from '../schematicviewpage/schematicViewPage'

export const SchematicsListPage = () => {
  const schematicStore = useSchematicStore();
  const navigate = useNavigate();

  useEffect(() => {
    if(!schematicStore.isLoading && !schematicStore.schematicFiles){
      schematicStore.fetchSchematicsData()
    }
  }, [schematicStore.schematicFiles, schematicStore.isLoading])
  
  return (
    <div className='tileset-container'>
        <div className='tileset-table-container'>
          <div className="card">
            <table className='table'>
              <thead>
                <tr>
                  <th>Schemetic Name:</th>
                  <th>Dimensions(W/H/D):</th>
                  <th>File Size (kb)</th>
                </tr>
              </thead>
              <tbody>
                {
                    schematicStore.schematicFiles?.map((e: Schematic) => (
                        <tr key={e.id} onClick={() => {
                          schematicStore.setSelected(e)
                          schematicStore.fetchNBTFile(e)
                          navigate("/schematics/view")
                        }}>
                            <td>{e.fileName}</td>
                            <td>{e.dimensions[0]}/{e.dimensions[1]}/{e.dimensions[2]}</td>
                            <td>{e.fileSize}</td>
                        </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
