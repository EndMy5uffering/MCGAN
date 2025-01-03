import { NBTTag } from "./NBTTag";

export class NBTLongArrayTag extends NBTTag{

    payload: bigint[]
    constructor(tag_name: string, payload: bigint[]){
        super(tag_name, 'NBTLongArrayTag')
        this.payload = payload
    }

    getLongArray(): bigint[]{
        return this.payload
    }
    
}