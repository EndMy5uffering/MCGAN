import { NBTTag } from "./NBTTag";

export class NBTStringTag extends NBTTag{

    payload: string
    constructor(tag_name: string, payload: string){
        super(tag_name, 'NBTStringTag')
        this.payload = payload
    }

    getString(): string{
        return this.payload
    }
    
}