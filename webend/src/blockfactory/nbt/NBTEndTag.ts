import { NBTTag } from "./NBTTag";

export class NBTEndTag extends NBTTag{

    payload: undefined
    constructor(tag_name: string){
        super(tag_name, 'NBTEndTag')
    }
    
}