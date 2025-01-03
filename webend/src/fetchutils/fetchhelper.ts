
export const _fetch = async (url: string, init?: RequestInit): Promise<Response> =>  {
    console.log("fetching: 127.0.0.1:8000" + url)
    return await fetch("http://127.0.0.1:8000" + url, {...init, mode: "cors"})
}