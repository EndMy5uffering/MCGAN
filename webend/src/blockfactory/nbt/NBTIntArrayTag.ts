import { NBTTag } from "./NBTTag";

export class NBTIntArrayTag extends NBTTag{

    payload: number[]
    constructor(tag_name: string, payload: number[]){
        super(tag_name, 'NBTIntArrayTag')
        this.payload = payload
    }

    getIntArray(): number[]{
        return this.payload
    }
    
}