import { NBTTag } from "./NBTTag";

export class NBTLongTag extends NBTTag{

    payload: bigint
    constructor(tag_name: string, payload: bigint){
        super(tag_name, 'NBTLongTag')
        this.payload = payload
    }

    getLong(): bigint{
        return this.payload
    }
    
}