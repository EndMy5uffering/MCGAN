import { NBTTag } from "./NBTTag";

export class NBTByteTag extends NBTTag{

    payload: number
    constructor(tag_name: string, payload: number){
        super(tag_name, 'NBTByteTag')
        this.payload = payload
    }

    getByte(): number{
        return this.payload
    }

}