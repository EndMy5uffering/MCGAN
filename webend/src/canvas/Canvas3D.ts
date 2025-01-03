import * as THREE from '../threejs/three.module.js'

export interface MouseInfo{
    x: number
    y: number
    deviceX: number
    deviceY: number
    mouseEvent: MouseEvent
    canvas: Canvas3D
}

export interface KeyBoardInfo{
    key: string
    keyCode: string
    keyEvent: KeyboardEvent
    canvas: Canvas3D
}

export class Canvas3D{

    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera 
    _rAFID: number | undefined
    mouseX: number
    mouseY: number
    mouseDeviceX: number
    mouseDeviceY: number
    resizeObserver: ResizeObserver

    update: (() => void) | undefined
    onMouseMove: ((arg0: MouseInfo) => void) | undefined
    onMouseClick: ((arg0: MouseInfo) => void) | undefined
    onKeyDown: ((arg0: KeyBoardInfo) => void) | undefined
    onKeyUp: ((arg0: KeyBoardInfo) => void) | undefined
    onKeyPressed: ((arg0: KeyBoardInfo) => void) | undefined

    constructor(container: HTMLDivElement) {

        this.mouseX = 0
        this.mouseY = 0
        this.mouseDeviceX = 0
        this.mouseDeviceY = 0
        const _width = container.clientWidth
        const _height = container.clientHeight

        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer( { antialias: true } )
        this.camera = new THREE.PerspectiveCamera(70, _width/_height, 0.01, 1000)

        this.renderer.setSize( _width, _height );
        container.replaceChildren(this.renderer.domElement)

        this._addlisteners()

        this._update(0)

        this.resizeObserver = new ResizeObserver(() => {
            this.camera.aspect = container.clientWidth/container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        })
        this.resizeObserver.observe(container)
    }

    _addlisteners = () => {
        (this.renderer.domElement as HTMLElement).addEventListener("mousemove", this._mouseHandleMove);
        (this.renderer.domElement as HTMLElement).addEventListener("click", this._mouseHandleClick);
        window.addEventListener("keydown", this._keyboardKeyDownHandle);
        window.addEventListener("keyup", this._keyboardKeyUpHandle);
        window.addEventListener("keypress", this._keyboardKeyHandle);
    }

    removeListeners = () => {
        (this.renderer.domElement as HTMLElement).removeEventListener("mousemove", this._mouseHandleMove);
        (this.renderer.domElement as HTMLElement).removeEventListener("click", this._mouseHandleClick);
        window.removeEventListener("keydown", this._keyboardKeyDownHandle);
        window.removeEventListener("keyup", this._keyboardKeyUpHandle);
        window.removeEventListener("keypress", this._keyboardKeyHandle);
        this.resizeObserver.disconnect()
    }

    changeContainer = (container: HTMLDivElement) => {
        console.log("changedContainer")
        this._stopUpdate()
        this.renderer.dispose
        this.renderer = new THREE.WebGLRenderer( { antialias: true } )
        container.replaceChildren(this.renderer.domElement)
        this.resizeObserver.observe(container)
        this._update(0)
    }

    _getNormalizedDeviceCords = (
        mevent: MouseEvent
    ): THREE.Vector2 => {
        return new THREE.Vector2(
            (mevent.offsetX / (mevent.target as HTMLElement).clientWidth) * 2 - 1, 
        - (mevent.offsetY / (mevent.target as HTMLElement).clientHeight) * 2 + 1)
    }

    _update = ( time: number ) => {
        if ( this.update ) this.update()
        this.renderer.render( this.scene, this.camera );
        this._rAFID = window.requestAnimationFrame(this._update)
    }

    _stopUpdate = () => {
        if( this._rAFID ) window.cancelAnimationFrame(this._rAFID)
    }

    _mouseHandleMove = (e: MouseEvent) => {
        const MouseDeviceCords = this._getNormalizedDeviceCords(e)
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY
        this.mouseDeviceX = MouseDeviceCords.x
        this.mouseDeviceY = MouseDeviceCords.y
        if ( this.onMouseMove ) this.onMouseMove(
            {
                deviceX: MouseDeviceCords.x, 
                deviceY: MouseDeviceCords.y, 
                x: e.offsetX, 
                y: e.offsetY, 
                mouseEvent: e,
                canvas: this
            })
    }

    _mouseHandleClick = (e: MouseEvent) => {
        const MouseDeviceCords = this._getNormalizedDeviceCords(e)
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY
        this.mouseDeviceX = MouseDeviceCords.x
        this.mouseDeviceY = MouseDeviceCords.y
        if ( this.onMouseClick ) this.onMouseClick(
            {
                deviceX: MouseDeviceCords.x, 
                deviceY: MouseDeviceCords.y, 
                x: e.offsetX, 
                y: e.offsetY, 
                mouseEvent: e,
                canvas: this
            })
    }

    _keyboardKeyDownHandle = (e: KeyboardEvent) => {
        if ( this.onKeyDown ) this.onKeyDown({key: e.key, keyCode: e.code, keyEvent: e, canvas: this})
    }

    _keyboardKeyUpHandle = (e: KeyboardEvent) => {
        if ( this.onKeyUp ) this.onKeyUp({key: e.key, keyCode: e.code, keyEvent: e, canvas: this})
    }

    _keyboardKeyHandle = (e: KeyboardEvent) => {
        if ( this.onKeyPressed ) this.onKeyPressed({key: e.key, keyCode: e.code, keyEvent: e, canvas: this})
    }

}