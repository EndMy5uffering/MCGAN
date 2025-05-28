import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSchematicStore, Schematic } from '../../stores/NBTStore'
import './schematicspage.css'

import '../../scss/styles.scss'
import { SchematicView } from '../schematicviewpage/schematicViewPage'



export const SchematicsListPage = () => {
  const schematicStore = useSchematicStore();
  const navigate = useNavigate();

  useEffect(() => {
    if(!schematicStore.isLoading && !schematicStore.schematicFiles && schematicStore.selectedList){
      schematicStore.fetchSchematicsData()
    }
  }, [schematicStore.schematicFiles, schematicStore.isLoading, schematicStore.selectedList])
  
  useEffect(() => {
    if(!schematicStore.availableLists && !schematicStore.isLoading){
      schematicStore.fetchAvailableLists()
    }
  }, [schematicStore.availableLists, schematicStore.isLoading])

  return (
    <div className='tileset-container'>
        <div className='tileset-table-container'>
          <div className='card' style={{margin: "5px 0 5px 0"}}>
            <select onChange={(e) => {e.target.value != "empty" ? schematicStore.setSelectedList(e.target.value) : {}}}>
              <option key="empty" value="empty" selected={schematicStore.selectedList == undefined}>----Select----</option>
              {
                    schematicStore.availableLists?.map((e: string) => (
                        <option key={e} value={e} selected={schematicStore.selectedList == e}>{e}</option>
                    ))
                }
            </select>

            <div className='d-flex flex-row justify-content-around' style={{padding: "10px", margin: "5px 0 5px 0"}}>
              <div className='card d-flex justify-content-center'>
                {schematicStore.selectedList ? (<img width="525px" style={{padding: "10px"}} src={"http://127.0.0.1:8000/api/file/img?filename=Discriminator_Gradients.png&sub=" + schematicStore.selectedList}></img>) : (<></>)}
              </div>
              <div className='card d-flex justify-content-center'>
                {schematicStore.selectedList ? (<img width="525px" style={{padding: "10px"}} src={"http://127.0.0.1:8000/api/file/img?filename=Generator_Gradients.png&sub=" + schematicStore.selectedList}></img>) : (<></>)}
              </div>
              <div className='card d-felx justify-content-center'>
                {schematicStore.selectedList ? (<img width="525px" style={{padding: "10px"}} src={"http://127.0.0.1:8000/api/file/img?filename=TrainLoss.png&sub=" + schematicStore.selectedList}></img>) : (<></>)}
              </div>
            </div>
          </div>
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
