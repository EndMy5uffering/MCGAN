import { NBTTag } from "./NBTTag";

export class NBTIntTag extends NBTTag{

    payload: number
    constructor(tag_name: string, payload: number){
        super(tag_name, 'NBTIntTag')
        this.payload = payload
    }

    getInt(): number{
        return this.payload
    }
    
}