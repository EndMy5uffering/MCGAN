import { Schematic } from "../stores/NBTStore"
import { _fetch } from "./fetchhelper"
import { unzip } from "../pako/pakoWrapper.js"

export const fetchSchematics = async (): Promise<Schematic[]> => {
    const rawData = await _fetch("/api/schematics")
    if(rawData.status != 200) return []
    const tsData:Schematic[] = await rawData.json()
    return tsData
}

export const fetchModelData = async (name: string): Promise<Uint8Array | undefined> => {
    const rawData = await _fetch(`/api/modeldata?schematicname=${name}`)
    if(rawData.status != 200) return undefined
    const blobData = await rawData.blob()
    const unziped = await unzip(blobData)
    return unziped
}

export const fetchBlockModelData = async (blockNames: string[]): Promise<any | undefined> => {
    const rawData = await _fetch(`/api/blockdata/blocks`, { body: JSON.stringify(blockNames), method: 'POST', headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }})
    if(rawData.status != 200) return JSON.parse('{}')
    const data = await rawData.json()
    return data
}