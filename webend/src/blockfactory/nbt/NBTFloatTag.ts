import { NBTTag } from "./NBTTag";

export class NBTFloatTag extends NBTTag{

    payload: number
    constructor(tag_name: string, payload: number){
        super(tag_name, 'NBTFloatTag')
        this.payload = payload
    }

    getFloat(): number{
        return this.payload
    }
    
}