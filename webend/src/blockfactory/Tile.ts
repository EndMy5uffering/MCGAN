import { Block } from "./Block";
import { NBTByteArrayTag } from "./nbt/NBTByteArrayTag";
import { NBTCompoundTag } from "./nbt/NBTCompoundTag";
import { NBTIntTag } from "./nbt/NBTIntTag";
import { NBTShortTag } from "./nbt/NBTShortTag";
import { NBTTag } from "./nbt/NBTTag";
import * as THREE from '../threejs/three.module.js'
import * as BufferGeometryUtils from '../threejs/utils/BufferGeometryUtils.js'
import * as NBTHelper from './nbt/NBTHelper'

export class Tile{
    nbt: NBTTag
    position: number[]
    blocks: Block[]
    constructor(nbt: NBTTag, position: number[]){
        this.nbt = nbt
        this.position = position
        this.blocks = []
    }

    private paletteToDict = (nbt_root: NBTCompoundTag): {[id: number]: string} => {
        const palette = (nbt_root.getTagByName('Blocks') as NBTCompoundTag).getTagByName('Palette') as NBTCompoundTag
        const result: {[id: number]: string} = {}
        const palette_content = palette.getTags() as NBTIntTag[]
        for(let i = 0; i < palette_content.length; ++i){
            result[palette_content[i].getInt()] = palette_content[i].getName()
        }
        return result
    }

    private convertBlocksArray = (data: NBTByteArrayTag) => {
        var converted: number[] = []
        let count = 0
        for(let i = 0; i < data.payload.length; ++i) {
            let val = data.payload[i]
            let overflow = 0
            while(data.payload[i] > 127) {
                i += 1
                val += (data.payload[i] & 0x7f) * (Math.pow(overflow, 128) - 1)
                overflow += 1
            }
            converted[count++] = val
        }
        return converted
    }

    resolve = (model_data: { [model_name: string] : any }) => {
        const root = (this.nbt as NBTCompoundTag).getTagByName('Schematic') as NBTCompoundTag
        const palette = this.paletteToDict(root)
        const width = root.getTagByName('Width') as NBTShortTag
        const height = root.getTagByName('Height') as NBTShortTag
        const length = root.getTagByName('Length') as NBTShortTag
        const blocks = this.convertBlocksArray(((root.getTagByName('Blocks') as NBTCompoundTag).getTagByName('Data') as NBTByteArrayTag))
        const idx = (x: number, y: number, z: number) => (y * length.getShort() * width.getShort()) + (z * width.getShort()) + x
        let blocktype = ''
        for(let z = 0; z < length.getShort(); ++z){
            for(let y = 0; y < height.getShort(); ++y){
                for(let x = 0; x < width.getShort(); ++x){
                    blocktype = palette[blocks[idx(x,y,z)]]
                    if(blocktype == 'minecraft:air') continue
                    if(!model_data.hasOwnProperty(NBTHelper.getBlockTypeFromMaterial(blocktype))){
                        console.log('no model for:', NBTHelper.getBlockTypeFromMaterial(blocktype))
                        //console.log(model_data)
                        continue
                    }
                    let block: Block = new Block(blocktype, [x+this.position[0],y + this.position[1],z+this.position[2]])
                    block.resolve(model_data[NBTHelper.getBlockTypeFromMaterial(blocktype)])
                    this.blocks.push(block)
                }
            }
        }
    }

    pack = (): THREE.BufferGeometry => {
        return BufferGeometryUtils.mergeBufferGeometries(this.blocks.map(e => e.pack()).filter(e => e !== undefined) as THREE.BufferGeometry[])
    }
}