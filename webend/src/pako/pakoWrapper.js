export const unzip = async (blob) => {
    var reader = await blob.arrayBuffer()
    const dataArray = new Uint8Array(reader)
    return pako.ungzip(dataArray)
}