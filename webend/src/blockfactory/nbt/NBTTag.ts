export abstract class NBTTag{

    tag_name: string
    getType: () => string
    constructor(tag_name: string, Type: string = 'NBTTag'){
        this.tag_name = tag_name
        this.getType = () => Type
    }

    getName() {
        return this.tag_name
    }
}