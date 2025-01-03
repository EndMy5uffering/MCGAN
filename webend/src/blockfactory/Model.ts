import * as THREE from '../threejs/three.module.js'
import * as BufferGeometryUtils from '../threejs/utils/BufferGeometryUtils.js'

export class Model {
  vertices: {
    pos: number[];
    norm: number[];
    uv: number[];
    color: number[];
  }[]
  transform: THREE.Matrix4
  constructor(from: number[], to: number[]){
    let _from = [(from[0]/16.0)-0.5, (from[1]/16.0)-0.5, (from[2]/16.0)-0.5];
    let _to = [(to[0]/16.0)-0.5, (to[1]/16.0)-0.5, (to[2]/16.0)-0.5];
    this.transform = new THREE.Matrix4()
    this.vertices = [
      // front 0-3
      { pos: [_from[0], _from[1], _to[2]], norm: [ 0,  0,  1], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_to[0], _from[1], _to[2]], norm: [ 0,  0,  1], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _to[2]], norm: [ 0,  0,  1], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_to[0], _to[1], _to[2]], norm: [ 0,  0,  1], uv: [1, 0], color: [1, 1, 1]},
      // right 4-7
      { pos: [_to[0] , _from[1], _to[2]], norm: [ 1,  0,  0], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_to[0] , _from[1], _from[2]], norm: [ 1,  0,  0], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_to[0] , _to[1], _to[2]], norm: [ 1,  0,  0], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_to[0] , _to[1], _from[2]], norm: [ 1,  0,  0], uv: [1, 0], color: [1, 1, 1]},
      // back 8-11
      { pos: [_to[0], _from[1], _from[2]], norm: [ 0,  0, -1], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_from[0], _from[1], _from[2]], norm: [ 0,  0, -1], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_to[0], _to[1], _from[2]], norm: [ 0,  0, -1], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _from[2]], norm: [ 0,  0, -1], uv: [1, 0], color: [1, 1, 1]},
      // left 12-15
      { pos: [_from[0], _from[1], _from[2]], norm: [-1,  0,  0], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_from[0], _from[1], _to[2]], norm: [-1,  0,  0], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _from[2]], norm: [-1,  0,  0], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _to[2]], norm: [-1,  0,  0], uv: [1, 0], color: [1, 1, 1]},
      // _top 16-19
      { pos: [_to[0], _to[1], _from[2]], norm: [ 0,  1,  0], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _from[2]], norm: [ 0,  1,  0], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_to[0], _to[1], _to[2]], norm: [ 0,  1,  0], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_from[0], _to[1], _to[2]], norm: [ 0,  1,  0], uv: [1, 0], color: [1, 1, 1]},
      // bot_tom 20-23
      { pos: [_to[0], _from[1], _to[2]], norm: [ 0, -1,  0], uv: [0, 1], color: [1, 1, 1]},
      { pos: [_from[0], _from[1], _to[2]], norm: [ 0, -1,  0], uv: [1, 1], color: [1, 1, 1]},
      { pos: [_to[0], _from[1], _from[2]], norm: [ 0, -1,  0], uv: [0, 0], color: [1, 1, 1]},
      { pos: [_from[0], _from[1], _from[2]], norm: [ 0, -1,  0], uv: [1, 0], color: [1, 1, 1]},
    ];


  }

  faceUVMapper = (start: number, uvs: number[]) => {
    if(uvs.length == 4)
    {
      this.vertices[start+0].uv = [uvs[0], uvs[3]]
      this.vertices[start+1].uv = [uvs[2], uvs[3]]
      this.vertices[start+2].uv = [uvs[0], uvs[1]]
      this.vertices[start+3].uv = [uvs[2], uvs[1]]
    }
  }

  setVertexColor = (color: number[]) => {
    this.vertices.forEach(vert => {
      vert.color = color
    });
  }

  setUVsTop = (uvs: number[]) => {
    this.faceUVMapper(16, uvs)    
  }

  setUVsBottom = (uvs: number[]) => {
    this.faceUVMapper(20, uvs)    
  }

  setUVsFront = (uvs: number[]) => {
    this.faceUVMapper(0, uvs)    
  }

  setUVsBack = (uvs: number[]) => {
    this.faceUVMapper(8, uvs)    
  }

  setUVsLeft = (uvs: number[]) => {
    this.faceUVMapper(12, uvs)    
  }

  setUVsRight = (uvs: number[]) => {
    this.faceUVMapper(4, uvs)    
  }

  pack = (): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];

    for (const vertex of this.vertices) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      uvs.push(...vertex.uv);
      colors.push(...vertex.color);
    }
    geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute( 'normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute( 'uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute( 'color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex([0,1,2,2,1,3,4,5,6,6,5,7,8,9,10,10,9,11,12,13,14,14,13,15,16,17,18,18,17,19,20,21,22,22,21,23]);
    return geometry
  }

  merge = (model: THREE.BufferGeometry[]) => {
    return BufferGeometryUtils.mergeBufferGeometries([...model, this.pack()])
  }

  applyTranslation = (translation: number[]) => {
    const tranlationMat = new THREE.Matrix4()
    tranlationMat.makeTranslation(translation[0], translation[1], translation[2])
    this.transform.multiplyMatrices(tranlationMat, this.transform.clone())
  }

  applyRotationX = (angle: number) => {
    const toRad = angle*Math.PI/180.0 
    const rotationMat = new THREE.Matrix4()
    rotationMat.makeRotationX(toRad)
    this.transform.multiplyMatrices(rotationMat, this.transform.clone())
  }

  applyRotationY = (angle: number) => {
    const toRad = angle*Math.PI/180.0 
    const rotationMat = new THREE.Matrix4()
    rotationMat.makeRotationY(toRad)
    this.transform.multiplyMatrices(rotationMat, this.transform.clone())
  }

  applyTranfrom = () => {
    this.applyTranslation([1,0.5,1])
    this.vertices.forEach(vert => {
      const vec = new THREE.Vector3()
      vec.fromArray(vert.pos, 0)
      vec.applyMatrix4(this.transform).toArray(vert.pos, 0)
    })
  }

  toMesh = (): THREE.Mesh => {
    const mat = new THREE.MeshBasicMaterial()
    mat.wireframe = true
    return new THREE.Mesh(this.pack(), mat)
  }

  resolve_color = (blocktype: string) => {
      switch (blocktype) {
          case 'oak_leaves':
              this.setVertexColor([0.0,1.0,0.0])
              break;
          case 'dark_oak_leaves':
              this.setVertexColor([0.0,0.8,0.0])
              break;
          default:
              break;
      }
  }
}