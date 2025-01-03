import { NBTTag } from "./NBTTag";

export class NBTByteArrayTag extends NBTTag{

    payload: number[]
    constructor(tag_name: string, payload: number[]){
        super(tag_name, 'NBTByteTag')
        this.payload = payload
    }

    getBytes(): number[]{
        return this.payload
    }

}