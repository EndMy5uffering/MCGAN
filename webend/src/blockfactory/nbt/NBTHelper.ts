import { NBTCompoundTag } from "./NBTCompoundTag";
import { NBTIntTag } from "./NBTIntTag";
import { NBTTag } from "./NBTTag";

export function hasMaterials(root: NBTTag): boolean{
    if(!(root instanceof NBTCompoundTag) || root.getName() === 'empty') return false
    const root_compound = root as NBTCompoundTag
    if(!root_compound.hasTag('Schematic')) return false
    const schematic = root_compound.getTagByName('Schematic') as NBTCompoundTag
    if(!schematic.hasTag('Blocks')) return false
    const blocks = schematic.getTagByName('Blocks') as NBTCompoundTag
    if(!blocks.hasTag('Palette')) return false
    return true
}

export function getMaterials(root: NBTTag): Set<string>{
    const root_compound = root as NBTCompoundTag
    const palette = root_compound.getTagByName('Palette') as NBTCompoundTag
    const materials = palette.getTags() as NBTIntTag[]
    const matTypes = new Set(materials.map(e => e.getName()))
    return matTypes
}

export function getBlockTypes(root: NBTTag): Set<string>{
    const root_compound = root as NBTCompoundTag
    const palette = ((root_compound.getTagByName('Schematic') as NBTCompoundTag).getTagByName('Blocks') as NBTCompoundTag).getTagByName('Palette') as NBTCompoundTag
    const materials = palette.getTags() as NBTIntTag[]
    const matTypes = new Set(materials.map(e => e.getName()).map(e => getBlockTypeFromMaterial(e)))
    return matTypes
}

export function getBlockTypeFromMaterial(mat: string){
    return mat.split(':')[1].split('[')[0]
}

export function getBlockProps(mat: string): string[]{
    if(!mat.includes('[')) return ['']
    return mat.split(':')[1].split('[')[1].replace(']', '').split(',')
}

export function getBlockPropsAsDict(mat: string): {[key: string]: string}{
    if(!mat.includes('[')) return {}
    const result: {[key: string]: string} = {}
    mat.split(':')[1].split('[')[1].replace(']', '').split(',').forEach((e: string) => {
        const data: string[] = e.split('=')
        result[data[0]] = data[1]
    })
    return result
}