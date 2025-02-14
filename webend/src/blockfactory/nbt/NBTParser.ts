import { NBTByteArrayTag } from "./NBTByteArrayTag"
import { NBTByteTag } from "./NBTByteTag"
import { NBTCompoundTag } from "./NBTCompoundTag"
import { NBTDoubleTag } from "./NBTDoubleTag"
import { NBTEndTag } from "./NBTEndTag"
import { NBTFloatTag } from "./NBTFloatTag"
import { NBTIntArrayTag } from "./NBTIntArrayTag"
import { NBTIntTag } from "./NBTIntTag"
import { NBTListTag } from "./NBTListTag"
import { NBTLongArrayTag } from "./NBTLongArrayTag"
import { NBTLongTag } from "./NBTLongTag"
import { NBTShortTag } from "./NBTShortTag"
import { NBTStringTag } from "./NBTStringTag"
import { NBTTag } from "./NBTTag"

const TAG: { [id: number] : (iter: any, no_name?: boolean) => NBTTag } = {}

const parse_next = (iter: any, n: number): Uint8Array => {
    let buffer = []
    for(let i = 0; i < n; ++i){
        buffer.push(iter.next().value)
    }
    return Uint8Array.from(buffer)
}

const parse_name = (iter: any): string => {
    let nameLength = toUInt16(parse_next(iter, 2))
    return new TextDecoder().decode(parse_next(iter, nameLength))
}

TAG[0] = (iter: any, no_name?: boolean) => { return new NBTEndTag('TAG_End') }
TAG[1] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Byte' : parse_name(iter)
    return new NBTByteTag(name, toInt8(parse_next(iter, 1)))
}
TAG[2] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Short' : parse_name(iter)
    return new NBTShortTag(name, toInt16(parse_next(iter, 2)))
}
TAG[3] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Int' : parse_name(iter)
    return new NBTIntTag(name, toInt32(parse_next(iter, 4)))
}
TAG[4] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Long' : parse_name(iter)
    return new NBTLongTag(name, toInt64(parse_next(iter, 8)))
}
TAG[5] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Float' : parse_name(iter)
    return new NBTFloatTag(name, toFloat32(parse_next(iter, 4)))
}
TAG[6] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Double' : parse_name(iter)
    return new NBTDoubleTag(name, toFloat64(parse_next(iter, 8)))
}
TAG[7] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Byte_Array' : parse_name(iter)
    const size = toUInt32(parse_next(iter, 4)) 
    let buffer: number[] = []
    for(let i = 0; i < size; ++i){
        buffer.push(toUInt8(parse_next(iter, 1)))
    }
    return new NBTByteArrayTag(name, buffer)
}
TAG[8] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_String' : parse_name(iter)
    const size = toUInt16(parse_next(iter, 2))
    const content = new TextDecoder().decode(parse_next(iter, size).buffer as ArrayBuffer)
    return new NBTStringTag(name, content)
}
TAG[9] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_List' : parse_name(iter)
    const contentID = toInt8(parse_next(iter, 1))
    const size = toInt32(parse_next(iter, 4))
    const buffer: NBTTag[] = []
    for(let i = 0; i < size; ++i){
        buffer.push(TAG[contentID](iter, true))
    }
    return new NBTListTag<typeof buffer[0]>(name, buffer)
}
TAG[10] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Compound' : parse_name(iter)
    let next = toInt8(parse_next(iter, 1))
    let result = TAG[next](iter)
    let buffer: NBTTag[] = []
    while(result.getType() !== 'NBTEndTag'){
        buffer.push(result)
        next = toInt8(parse_next(iter, 1))
        result = TAG[next](iter)
    }
    return new NBTCompoundTag(name, buffer)
}
TAG[11] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Int_Array' : parse_name(iter)
    const size = toInt32(parse_next(iter, 4))
    let buffer: number[] = []
    for(let i = 0; i < size; ++i){
        buffer.push(toInt32(parse_next(iter, 4)))
    }
    return new NBTIntArrayTag(name, buffer)
}
TAG[12] = (iter: any, no_name?: boolean) => {
    const name = no_name ? 'TAG_Long_Array' : parse_name(iter) 
    const size = toInt32(parse_next(iter, 4))
    let buffer: bigint[] = []
    for(let i = 0; i < size; ++i){
        buffer.push(toInt64(parse_next(iter, 8)))
    }
    return new NBTLongArrayTag(name, buffer)
}

function makeReader(data: Uint8Array) {
    let nextIdx = 0
    const iter = {
        next() {
            let result;
            if(nextIdx < data.length){
                result = { value: data[nextIdx], done: false }
                nextIdx += 1
                return result
            }else{
                return { value: data[nextIdx], done: true }
            }
        },
        peek() {
            return data[nextIdx]
        }
    }
    return iter
}

export function parse(data: Uint8Array): NBTTag{
    const iter = makeReader(data)
    let res
    let compunds: NBTTag = new NBTCompoundTag('empty', [])
    while(!(res = iter.next()).done){
        compunds = TAG[res.value](iter)
    }
    return compunds
}

function toFloat32(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getFloat32(0, littleEndian)
}

function toFloat64(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getFloat64(0, littleEndian)
}

function toInt8(bytes: Uint8Array): number{
    return new DataView(bytes.buffer).getInt8(0)
}

function toUInt8(bytes: Uint8Array): number{
    return new DataView(bytes.buffer).getUint8(0)
}

function toInt16(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getInt16(0, littleEndian)
}

function toUInt16(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getUint16(0, littleEndian)
}

function toInt32(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getInt32(0, littleEndian)
}

function toUInt32(bytes: Uint8Array, littleEndian?: boolean): number{
    return new DataView(bytes.buffer).getUint32(0, littleEndian)
}

function toInt64(bytes: Uint8Array, littleEndian?: boolean): bigint{
    return new DataView(bytes.buffer).getBigInt64(0, littleEndian)
}

function toUInt64(bytes: Uint8Array, littleEndian?: boolean): bigint{
    return new DataView(bytes.buffer).getBigUint64(0, littleEndian)
}