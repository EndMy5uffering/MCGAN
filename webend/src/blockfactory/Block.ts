import { Model } from "./Model";
import * as THREE from '../threejs/three.module.js'
import * as BufferGeometryUtils from '../threejs/utils/BufferGeometryUtils.js'
import * as NBTHelper from './nbt/NBTHelper'

let UV_mapping: { [face: string] : (model: Model, uvs: number[]) => void} = { };

UV_mapping['up'] = (model: Model, uvs: number[]) => { model.setUVsTop(uvs) }
UV_mapping['down'] = (model: Model, uvs: number[]) => { model.setUVsBottom(uvs) }
UV_mapping['north'] = (model: Model, uvs: number[]) => { model.setUVsBack(uvs) }
UV_mapping['south'] = (model: Model, uvs: number[]) => { model.setUVsFront(uvs) }
UV_mapping['east'] = (model: Model, uvs: number[]) => { model.setUVsRight(uvs) }
UV_mapping['west'] = (model: Model, uvs: number[]) => { model.setUVsLeft(uvs) }

export class Block {

    models: Model[]
    blockType: string
    material: string
    variant: string[]
    variant_combined: string
    position: number[]
    modelData: any
    variantData: {[key: string]: string}
    constructor(blockType: string, position: number[]){
        this.models = []
        this.blockType = blockType
        this.material = NBTHelper.getBlockTypeFromMaterial(blockType)
        this.variant = NBTHelper.getBlockProps(blockType)
        this.variant = this.variant.filter(e => e !=='waterlogged=false' && e !== 'waterlogged=true')
        this.variant_combined = this.variant.join(',')
        this.position = position
        this.modelData = {}
        this.variantData = NBTHelper.getBlockPropsAsDict(blockType)
    }

    resolve = (modelData: any) => {
        this.modelData = modelData
        const hasKey = (obj: any, variant: string) => Object.keys(obj).includes(variant)
        if(hasKey(modelData, 'variants')){
            if(hasKey(modelData['variants'], this.variant_combined)) {
                this.resolve_variant(modelData, this.variant_combined)
            }else if(hasKey(modelData['variants'], "")) {
                this.resolve_variant(modelData, "")
            }
            
        }else if(hasKey(modelData, 'multipart')){
            this.resolve_multi(modelData)
        }else{
            return
        }
    }

    resolve_variant = (modelData: any, variant_combination: string) => {
        let model = modelData['variants'][variant_combination]['model']
        let x: number = -modelData['variants'][variant_combination]['x'] || 0
        let y: number = -modelData['variants'][variant_combination]['y'] || 0
        if(!(model instanceof Array)) return
        let models = model.map((e: any) => {
            const from: any = e['from']
            const to: any = e['to']
            let m: Model = new Model(from, to)
            m.applyRotationX(x)
            m.applyRotationY(y)
            m.applyTranslation(this.position)
            m.applyTranfrom()
            for(const [key, value] of Object.entries(e['faces'])){
                (UV_mapping[key])(m, (value as any)['texture_uv'] as number[]);
            }
            m.resolve_color(this.material)
            return m
        })
        this.models = models
    }

    resolve_multi = (modelData: any) => {
        let multipart = modelData['multipart']
            const models = multipart.map((e: any) => {
                const apply = e['apply'] || undefined
                const when = e['when'] || undefined
                let canApply = true
                if(apply instanceof Array) return undefined
                if (when !== undefined){
                    Object.keys(when).forEach(e => {
                        if(this.variantData[e] !== when[e]) canApply = false
                    })
                }
                if(canApply && apply !== undefined){
                    const models = apply['model'].map((e: any) => {
                        const model: Model = new Model(e['from'], e['to'])
                        for(const [key, value] of Object.entries(e['faces'])){
                            (UV_mapping[key])(model, (value as any)['texture_uv'] as number[]);
                        }
                        
                        let x: number = -apply['x'] || 0
                        let y: number = -apply['y'] || 0
                        model.applyRotationX(x)
                        model.applyRotationY(y)
                        model.applyTranslation(this.position)
                        model.applyTranfrom()
                        model.resolve_color(this.material)
                        return model
                    })
                    const first = models[0]
                    for(let i = 1; i < models.length; ++i){
                        first.merge([...models.slice(1).map((e: Model) => e.pack())])
                    }
                    return first
                }
                return undefined
            }).filter((e: Model) => e !== undefined)
            this.models = models
    }

    pack = (): THREE.BufferGeometry | undefined => {
        if(!this.models || this.models.length === 0) return undefined
        return BufferGeometryUtils.mergeBufferGeometries(this.models.map(e => e.pack()))
    }

    toMesh = (texture: THREE.Texture): THREE.Mesh => {
        const bufferData = this.pack();
        const mat = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.5})
        mat.wireframe = true
        const mesh = new THREE.Mesh(bufferData, mat)
        const meshData: any = mesh.userData
        meshData['material'] = this.material
        meshData['variant'] = this.variant
        meshData['model'] = this.modelData
        return mesh
    }

}