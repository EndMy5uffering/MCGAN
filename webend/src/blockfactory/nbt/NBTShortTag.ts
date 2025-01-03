import { NBTTag } from "./NBTTag";

export class NBTShortTag extends NBTTag{

    payload: number
    constructor(tag_name: string, payload: number){
        super(tag_name, 'NBTShortTag')
        this.payload = payload
    }

    getShort(): number{
        return this.payload
    }
    
}