import { NBTTag } from "./NBTTag";

export class NBTCompoundTag extends NBTTag{
    payload: NBTTag[];
    constructor(tag_name: string, payload: NBTTag[]){
        super(tag_name, 'NBTCompoundTag')
        this.payload = payload
    }

    getTags(): NBTTag[]{
        return this.payload as NBTTag[]
    }

    getAt(idx: number): NBTTag{
        if(idx < 0)
            return this.payload[0]
        if(idx > this.payload.length)
            return this.payload[this.payload.length - 1]
        return this.payload[idx]
    }

    getTagByName(tag_name: string): NBTTag | undefined{
        for(let i = 0; i < this.payload.length; ++i){
            if(this.payload[i].getName() === tag_name)
                return this.payload[i]
        }
        return undefined
    }

    hasTag(tag_name: string): boolean{
        for(let i = 0; i < this.payload.length; ++i){
            if(this.payload[i].getName() === tag_name)
                return true
        }
        return false
    }

}