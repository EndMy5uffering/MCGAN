import React, { useEffect, useRef, useState } from 'react'
import { Canvas3D, MouseInfo } from '../../canvas/Canvas3D'
import { MessageBox } from '../../components/messageBox/MessageBox'
import { Schematic, useSchematicStore } from '../../stores/NBTStore'
import { useBlockModelStore } from '../../stores/BlockModelStore'
import { OrbitControls } from '../../threejs/controls/OrbitControls'
import * as THREE from '../../threejs/three.module.js'
import './schematicViewPage.css'
import { Navigate } from 'react-router-dom'
import { NBTTag } from '../../blockfactory/nbt/NBTTag'
import * as NBTHelper from '../../blockfactory/nbt/NBTHelper'
import { Tile } from '../../blockfactory/Tile'
import { NBTCompoundTag } from '../../blockfactory/nbt/NBTCompoundTag'
import { NBTShortTag } from '../../blockfactory/nbt/NBTShortTag'

const containerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    backgroundColor: 'var(--default-background-color-dark)',
    border: 'solid 1px white',
    overflow: 'hidden',
}

export const SchematicView = () => {
    const schematicStore = useSchematicStore()
    const blockStore = useBlockModelStore()
    const [showMsgBox, setshowMsgBox] = useState(false)
    let texture = new THREE.TextureLoader().load('/block_textures.png')
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    let textureMaterial = new THREE.MeshBasicMaterial({map: texture})
    textureMaterial.vertexColors = true
    textureMaterial.transparent = true
    if(!schematicStore.selectedSchematic)
        return <Navigate to="/schematics"/>

    const Container = useRef<HTMLDivElement>(null)
    let canvas3D: Canvas3D | undefined;

    const initCanvas = () => {
        if(Container.current != null){
            if(canvas3D) return
            canvas3D = new Canvas3D(Container.current);
            canvas3D.camera.lookAt(0, 0, 0)
            canvas3D.camera.translateOnAxis({x: -1,y: -1,z: -1}, -25.0)
            const light = new THREE.AmbientLight(0xffffff, 0.1);
            let groundHelper = new THREE.GridHelper(50, 50);
            let axisHelper = new THREE.AxesHelper(25);
            canvas3D.scene.add( light, groundHelper, axisHelper );
            
            const controls = new OrbitControls(canvas3D.camera, canvas3D.renderer.domElement)
            canvas3D.update = () => {
                controls.update()
            }
        }
        
    }

    const constructTile = (selectedID: string) => {
        if(!schematicStore.hasNBTData(selectedID)) {return}
        const tag: NBTTag = schematicStore.getNBTData(selectedID)
        if(!NBTHelper.hasMaterials(tag)) return
        const materials: Set<string> = NBTHelper.getBlockTypes(tag)
        if(!schematicStore.hasModelData(selectedID)){
            const tileSize = (((tag as NBTCompoundTag).getTagByName('Schematic') as NBTCompoundTag).getTagByName('Width') as NBTShortTag).getShort()
            const arr = Array.from(materials)
            blockStore.fetchModelList(arr, () => {
                const NBTroot: NBTTag = schematicStore.getNBTData(selectedID)
                let tile = new Tile(NBTroot, [-Math.ceil(tileSize/2),0,-Math.ceil(tileSize/2)])
                tile.resolve(blockStore.models)
                schematicStore.schematicMeshData[selectedID] = new THREE.Mesh(tile.pack(), textureMaterial)
                if(canvas3D !== undefined){
                    canvas3D.scene.add(schematicStore.getModelData(selectedID))
                }
            })
        }
        if(schematicStore.hasModelData(selectedID) && canvas3D !== undefined){
            canvas3D.scene.add(schematicStore.getModelData(selectedID))
        }
    }

    useEffect(() => {
        if(Container.current != null && canvas3D == undefined){
            initCanvas();
        }

        return () => {
            if(canvas3D) {
                canvas3D._stopUpdate()
                canvas3D.removeListeners()
                canvas3D.renderer.dispose()
                canvas3D.renderer.forceContextLoss()
            }

        }
    }, [Container, schematicStore.isLoading])

    useEffect(() => {
        if(schematicStore.selectedSchematic != undefined)
        {
            constructTile(schematicStore.selectedSchematic.id)
        }
    }, [schematicStore.schematicsNBTData, schematicStore.isLoading])

  return (
    <div style={{display:"flex", flexDirection:"row", width:"100%", height: "100%"}}>
        {showMsgBox && (
            <MessageBox header={"error"} onClose={() => setshowMsgBox(false)}>
                test
            </MessageBox>
        )}
        <div id='canvas3d' style={containerStyle} ref={Container}></div>
    </div>
  )
}
