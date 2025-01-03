import { create } from "zustand";
import { Model } from "../blockfactory/Model";
import { fetchBlockModelData } from "../fetchutils/SchematicDataCollector";
import { Texture } from "../threejs/three.module";

export interface BlockModel{
    data: any
}

export interface ModelStore{
    models: { [model_name: string] : BlockModel },
    hasModel: (name: string) => boolean,
    fetchModel: (name: string, onLoad?: () => void) => void,
    fetchModelList: (name: string[], onLoad?: () => void) => void,
    isLoading: boolean,
}

export const useBlockModelStore = create<ModelStore>((set, get) => (
    {
        models: {},
        isLoading: false,
        fetchCount: 0,
        texture: new Texture(),
        fetchModel: (name: string, onLoad?: () => void) => {
            if(get().hasModel(name)) return
            set({isLoading: true})
            fetchBlockModelData([name])
            .then(result => {
                set(state => state.models[name] = result)
                set({isLoading: false})
                if(onLoad) onLoad()
            })
        },
        fetchModelList: (names: string[], onLoad?: () => void) => {
            set({isLoading: true})
            fetchBlockModelData(names.filter(e => !get().hasModel(e)))
            .then(result => {
                result.forEach((e: any) => {
                    set(state => state.models[e['name']] = e)
                })
                set({isLoading: false})
                if(onLoad) onLoad()
            })
        },
        hasModel: (name: string) => get().models.hasOwnProperty(name)
    }
))