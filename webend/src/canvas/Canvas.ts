import React from "react"

export class Canvas{

    _canvas: HTMLCanvasElement
    _ctx: CanvasRenderingContext2D
    _clearColor: string
    _width: number
    _height: number
    _currentTime: number
    _animHdl: number
    _elapsedTime: number
    _frameDuration: number
    _renderFunc: (dt: number) => void
    _updateFunc: () => void
    constructor(width: number, 
        height: number, 
        clearColor: 'black' | 'white' = 'black'){
        this._canvas = document.createElement('canvas') as HTMLCanvasElement
        this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D
        this._clearColor = clearColor
        this._width = width
        this._height = height
        this._currentTime = Date.now()
        this._animHdl = -1
        this._elapsedTime = 0
        this._frameDuration = 1000/60
        this._renderFunc = () => {}
        this._updateFunc = () => {}
    }

    ResetCanvas = (): void => {
        this._canvas.width = this._width
        this._canvas.height = this._height
        this._ctx.fillStyle = this._clearColor
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)
    }

    getCanvas = (): HTMLCanvasElement => {
        return this._canvas
    }

    getCanvasNode = (): React.ReactNode => {
        const el = React.createElement('div', {ref: ref => ref?.replaceChildren(this._canvas)})
        return el
    }

    getContext = (): CanvasRenderingContext2D => {
        return this._ctx
    }

    clear = () => {
        this._ctx.fillStyle = this._clearColor
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)
    }

    setOrigin = (x: number, y: number) => {
        this._ctx.transform(1,0,0,1,x,y)
    }

    drawImage = (
        img: CanvasImageSource, 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        rot_deg: number = 0
    ): void => {
        this._ctx.translate(x, y)
        this._ctx.rotate(rot_deg)
        this._ctx.drawImage(img, 0, 0, width, height)
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-x, -y)
    }

    drawImageTile = (
        _img: CanvasImageSource, 
        tileX: number, 
        tileY: number, 
        tileSizeW: number, 
        tileSizeH: number, 
        canvasX: number, 
        canvasY: number, 
        width: number, 
        height: number, 
        rot_deg: number = 0
    ) => {
        this._ctx.translate(canvasX, canvasY)
        this._ctx.rotate(rot_deg)
        this._ctx.drawImage(_img, tileX, tileY, tileSizeW, tileSizeH, 0, 0, width, height)
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-canvasX, -canvasY)
    }

    drawHRect = (
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        color: string | CanvasGradient | CanvasPattern, 
        rot_deg:number= 0
    ): void => {
        this._ctx.translate(x, y)
        this._ctx.rotate(rot_deg)
        this._ctx.beginPath()
        this._ctx.strokeStyle = color
        this._ctx.rect(0, 0, width, height)
        this._ctx.stroke()
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-x, -y)
    }

    drawRect = (
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        color: string | CanvasGradient | CanvasPattern, 
        rot_deg:number= 0
    ) => {
        this._ctx.translate(x, y)
        this._ctx.rotate(rot_deg)
        this._ctx.fillStyle = color
        this._ctx.fillRect(0, 0, width, height)
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-x, -y)
    }

    drawPixel = (
        x: number,
        y: number,
        color: string | CanvasGradient | CanvasPattern, 
        pixelSize: number = 1
        ) => {
        this._ctx.translate(x, y)
        this._ctx.fillStyle = color
        this._ctx.fillRect(0, 0, pixelSize, pixelSize)
        this._ctx.translate(-x, -y)
    }

    drawLine = (
        x0: number, 
        y0: number, 
        x1: number, 
        y1: number, 
        lineWidth: number, 
        color: string | CanvasGradient | CanvasPattern
    ): void => {
        this._ctx.strokeStyle = color
        this._ctx.lineWidth = lineWidth
        this._ctx.beginPath()
        this._ctx.moveTo(x0, y0)
        this._ctx.lineTo(x1, y1)
        this._ctx.stroke()
        this._ctx.lineWidth = 1
    }

    drawHArc = (
        x: number, 
        y: number, 
        radius: number, 
        startAngle: number, 
        endAngle: number, 
        color: string | CanvasGradient | CanvasPattern, 
        lineWidth: number = 1, 
        counterClockwise: boolean = false
    ) => {
        this._ctx.strokeStyle = color
        this._ctx.lineWidth = lineWidth
        this._ctx.beginPath()
        this._ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
        this._ctx.stroke()
    }

    drawArc = (
        x: number, 
        y: number, 
        radius: number, 
        startAngle: number, 
        endAngle: number, 
        color: string | CanvasGradient | CanvasPattern, 
        lineWidth: number = 1, 
        counterClockwise: boolean = false
    ) => {
        this._ctx.fillStyle = color
        this._ctx.lineWidth = lineWidth
        this._ctx.beginPath()
        this._ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
        this._ctx.fill()
    }

    drawHText = (
        x: number, 
        y: number, 
        text: string, 
        color: string | CanvasGradient | CanvasPattern = 'black', 
        lineWidth: number = 1,
        rot_deg: number = 0,
        font: string = '28px serif'
    ) => {
        this._ctx.translate(x, y)
        this._ctx.rotate(rot_deg)
        this._ctx.lineWidth = lineWidth
        this._ctx.strokeStyle = color
        this._ctx.font = font
        this._ctx.strokeText(text, 0, 0)
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-x, -y)
    }

    drawText = (
        x: number, 
        y: number, 
        text: string, 
        color: string | CanvasGradient | CanvasPattern = 'black', 
        rot_deg: number = 0,
        font: string = '28px serif') => {
        this._ctx.translate(x, y)
        this._ctx.rotate(rot_deg)
        this._ctx.fillStyle = color
        this._ctx.font = font
        this._ctx.fillText(text, 0, 0)
        this._ctx.rotate(-rot_deg)
        this._ctx.translate(-x, -y)
    }

    render = (renderFunc: (dt: number) => void) => {
        this._renderFunc = renderFunc
        this._currentTime = Date.now()
        this._render()
    }

    _render = () => {
        this._animHdl = window.requestAnimationFrame(this._render)
        const currentTime = Date.now()
        const dt = (currentTime - this._currentTime)
        this._elapsedTime += dt

        while (this._elapsedTime >= this._frameDuration) {
            this._updateFunc()
            this._elapsedTime -= this._frameDuration
        }
        this._renderFunc(this._elapsedTime / this._frameDuration)
        this._currentTime = currentTime
    }

    stopRender = () => {
        window.cancelAnimationFrame(this._animHdl)
    }
}