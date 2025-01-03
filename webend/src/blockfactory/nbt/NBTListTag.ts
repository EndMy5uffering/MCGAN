import { NBTTag } from "./NBTTag";

export class NBTListTag<T extends NBTTag> extends NBTTag{

    payload: T[]
    constructor(tag_name: string, payload: T[]){
        super(tag_name, 'NBTListTag')
        this.payload = payload
    }

    getTagList(): T[]{
        return this.payload
    }

    getAt(idx: number): T {
        if(idx < 0)
            return this.payload[0]
        if(idx > this.payload.length)
            return this.payload[this.payload.length - 1]
        return this.payload[idx]
    }

    getLength(){
        return this.payload.length
    }

    getContentType(): string{
        return typeof this.payload[0]
    }
    
}