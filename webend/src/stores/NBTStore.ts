import {create} from 'zustand'
import * as NBT from '../blockfactory/nbt/NBTParser'
import { NBTTag } from "../blockfactory/nbt/NBTTag";
import { NBTCompoundTag } from "../blockfactory/nbt/NBTCompoundTag";
import { Mesh } from "../threejs/three.module";

import {fetchModelData, fetchSchematics} from '../fetchutils/SchematicDataCollector'


export interface SchematicCollection{
    schematicFiles?: Schematic[]
    schematicsNBTData: {[ID: string] : NBTTag}
    schematicMeshData: {[ID: string] : Mesh}
    isLoading: boolean
    selectedSchematic?: Schematic | undefined
    fetchSchematicsData: () => void
    fetchNBTFile: (schem: Schematic) => void
    hasNBTData: (ID: string) => boolean
    getNBTData: (ID: string) => NBTTag
    hasModelData: (ID: string) => boolean
    getModelData: (ID: string) => Mesh
    setSelected: (schem: Schematic) => void
}

export interface Schematic{
    id: string,
    fileName: string,
    dimensions: [number,number,number],
    fileSize: number,
    creationDate: Date,
    loaded: boolean,
    isLoading: boolean,
}

export const useSchematicStore = create<SchematicCollection>((set, get) => (
    {
        schematicFiles: undefined,
        isLoading: false,
        selectedSchematic: undefined,
        schematicsNBTData: {},
        schematicMeshData: {},
        fetchSchematicsData: () => {
            set({isLoading: true})
            fetchSchematics()
            .then((e: Schematic[]) => {
                set({schematicFiles: e, isLoading: false})
            })
            .catch(e => console.log(e))
        },
        fetchNBTFile: (schem) => {
            set({isLoading: true})

            fetchModelData(schem.fileName)
                    .then(result => {
                        if(result !== null && result !== undefined) {
                            get().schematicsNBTData[schem.id] = NBT.parse(result)
                        }
                        set({isLoading: false})
                    })
                    .catch(e => {
                        console.log(e)
                        set({isLoading: false})
                    })
        },
        hasNBTData: (ID: string) => {
            return get().schematicsNBTData.hasOwnProperty(ID);
        },
        getNBTData: (ID: string) => {
            if(!get().hasNBTData(ID)){
                return new NBTCompoundTag('empty', [])
            }
            return get().schematicsNBTData[ID]
        },
        hasModelData: (ID: string) => {
            return get().schematicMeshData[ID] !== undefined
        },
        getModelData: (ID: string) => {
            return get().schematicMeshData[ID]
        },
        setSelected: (schem: Schematic) => {
            set({selectedSchematic: schem})
        }
    }
))