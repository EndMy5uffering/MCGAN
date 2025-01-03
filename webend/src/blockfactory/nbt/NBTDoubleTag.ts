import { NBTTag } from "./NBTTag";

export class NBTDoubleTag extends NBTTag{

    payload: number
    constructor(tag_name: string, payload: number){
        super(tag_name, 'NBTDoubleTag')
        this.payload = payload
    }

    getDouble(): number{
        return this.payload
    }
    
}