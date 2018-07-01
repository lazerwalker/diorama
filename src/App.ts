import 'aframe';
import { Object3D, Vector3 } from 'three';

// See how the default event system works in terms of clicking on things, and if I can get the behavior I want of "click on anything = remove text"
require('aframe-extras');
require('aframe-look-at-component')

// TODO: Make an A-Frame DefinitelyTyped PR!
interface AFrameElement extends HTMLElement {
  setAttribute: ((first: string, second?: string, third?: any) => void);
  object3D: Object3D
}

enum Mode {
  EDIT = "edit",
  PLAY = "play"
}

interface Billboard {
  animation?: {
    images: string[]
    framerate: number
    currentFrame: number
  }
  id: string,
  height: number,
  image?: string
  position: {x: number, y: number, z: number}
  rotation?: string
  text?: string
  width: number
}

interface State {
  mode: Mode,
  objects: {[key: string]: Billboard}
  text?: string
  holding?: string
}

class App {
  state: State = {
    mode: Mode.PLAY,
    objects: {
      "wol": {
        animation: {
          currentFrame: 1,
          framerate: 300,
          images: ["#wol", "#wol2"],
        },
        height: 1.6,
        id: 'wol',
        position: {x: 0.0, y: 1.6, z: -5.0},
        text: "Howdy pardner!",
        width: 1.4
      },
      "wol2": {
        height: 1.6,
        id: 'wol2',
        image: "#wol2",
        position: {x: 3.0, y: 1.6, z: -8.0},
        text: "Woah, I was placed!",
        width: 1.4,
      }
    }
  }

  private el: AFrameElement
  private camera: AFrameElement
  private cursor: AFrameElement
  private rig: AFrameElement

  private textEl?: AFrameElement
  private holdingEl?: AFrameElement

  private elMap: {[id: string]: AFrameElement}

  private objectLastClicked?: Date
  
  constructor() {
    //  const interval = Math.min(...Object.values(this.state.objects)
    //     .map((o) => o.animation ? o.animation.framerate : Infinity))
    // setInterval(() => {
    //   const obj = this.state.objects["wol"]
    //   if (obj) {
    //     let newFrame = obj.animation.currentFrame + 1
    //     if (newFrame >= obj.animation.images.length) { newFrame = 0; }

    //     let newAnimation = {...obj.animation, currentFrame: newFrame}
    //     let newObj = {...obj, animation: newAnimation}
    //     let newObjects = {...that.state.objects, wol: newObj}
    //     this.setState({objects: newObjects})
    //   }

    //   if (this.state.holding && that.state.holding.animation) {
    //     let holding = that.state.holding
    //     let newFrame = holding.animation.currentFrame + 1
    //     if (newFrame >= holding.animation.images.length) { newFrame = 0; }

    //     let newAnimation = {...holding.animation, currentFrame: newFrame}
    //     let newObj = {...holding, animation: newAnimation}
    //     that.setState({holding: newObj})
    //   }
    // }, interval)
    
    this.createScene()

    this.el = document.querySelector('a-scene')!
    if (!this.el) {
      console.log("COULD NOT FIND SCENE")
      return
    }

    this.elMap = {};

    Object.keys(this.state.objects).forEach(key => {
      const element = this.state.objects[key]
      const el = this.entityForObject(element)
      this.elMap[key] = el
      this.el.appendChild(el)
    });

    document.addEventListener('keydown', this.handleKeyboard)

    this.el.addEventListener('click', (e) => {
      if (!e.isTrusted) { return }

      // If we clicked on an actual object, we don't want to fire this object.
      // However, these 'real' events fire before the synthetic object click events,
      // so we need to wait to make sure we didn't receive one of those
      // (and because they're synthetic, we can't just stop propagation)
      setTimeout(() => {
        const now = new Date().getTime()
        
        if (this.objectLastClicked && now - this.objectLastClicked.getTime() < 200) { return }
        if (this.state.mode === Mode.PLAY) {
          if (this.state.text) {
            this.hideText()
          }
        } else if (this.state.mode === Mode.EDIT) {
          if (this.state.holding) {
            this.placeBillboard()
          }
        }
      }, 0)
    })
  }

  handleKeyboard = (e: KeyboardEvent) => {
    const key = e.key

    if (key === 'm') {
      if (this.state.mode === Mode.EDIT) {
        this.changeMode(Mode.PLAY)
      } else if (this.state.mode === Mode.PLAY) {
        this.changeMode(Mode.EDIT)
      }        
    } else if (key === 'x') { // Move down
      const position: Vector3 = (this.rig.getAttribute('position') as any) as Vector3
      this.rig.object3D.position.y = position.y - 0.1
    } else if (key === 'z') { // Move up
      const position: Vector3 = (this.rig.getAttribute('position') as any) as Vector3
      this.rig.object3D.position.y = position.y + 0.1   
    } else if (key === 'c') { // Reset to original y-position
      this.rig.object3D.position.y = 0         
    }
  }

  createScene() {
    const el = document.createElement('a-scene');
    el.id= "scene"
    el.setAttribute('cursor', 'rayOrigin: mouse')

    const assetList = {
      wol: "WoL.png",
      wol2: "WoL2.png"
    }

    const assets = document.createElement('a-assets')
    Object.keys(assetList).forEach((key: string) => {
      const img: any = document.createElement('img')
      img.id = key
      img.src = assetList[key]

      assets.appendChild(img)
    })
    el.appendChild(assets)

    const rig = document.createElement('a-entity')
    rig.id = 'rig'
    rig.setAttribute('movement-controls', `fly: ${this.state.mode === Mode.EDIT}`)
    rig.setAttribute('position', '0 0 0')
    this.rig = rig
    el.appendChild(rig)

    const camera = document.createElement('a-camera')
    camera.id = 'camera'
    camera.setAttribute('look-controls', 'pointer-lock-enabled: true')
    camera.setAttribute('position', '0 1.6 0')
    rig.appendChild(camera)
    this.camera = camera

    const leftHand = document.createElement('a-entity')
    leftHand.setAttribute('hand-controls', 'left')
    el.appendChild(leftHand)

    const rightHand = document.createElement('a-entity')
    leftHand.setAttribute('hand-controls', 'right')
    el.appendChild(rightHand)

    const laser = document.createElement('a-entity')
    laser.setAttribute('laser-controls', 'hand: left')
    el.appendChild(laser)

    const plane = document.createElement('a-plane')
    plane.setAttribute('height', 100)
    plane.setAttribute('width', 100)
    plane.setAttribute('rotation', '-90 0 0 ')
    plane.setAttribute('color', '#333333')
    el.appendChild(plane)

    const sky = document.createElement('a-sky')
    sky.setAttribute('color', '#6EBAA7')
    el.appendChild(sky)

    const cursor = document.createElement('a-entity')
    cursor.id = 'cursor'
    cursor.setAttribute('position', '0 0 -1')
    cursor.setAttribute('geometry', 'primitive: ring; radiusInner: 0.005; radiusOuter: 0.01')
    cursor.setAttribute('material', 'color: black; shader: flat')
    camera.appendChild(cursor)
    this.cursor = cursor

    document.body.appendChild(el)
    this.el = el
  }

  entityForObject(o: Billboard, isHolding: boolean = false) {
    const el = document.createElement('a-image');
    Object.keys(o).forEach((key) => {
      el.setAttribute(key, o[key])
    })

    el.setAttribute('objectId', o.id)

    const material: any = {
      alphaTest: 0.5,
      transparent: true
    }

    material.src = this.imageForObject(o)

    el.setAttribute('material', material)

    if (isHolding) {
      el.setAttribute('rotation', undefined)
      el.setAttribute('material', 'opacity', 0.5)  
      el.setAttribute('position', {x: 0, y: 0, z: -1.0})
    } else {
      if (this.state.mode === Mode.PLAY && o.text) {
        // TODO: Thise could happen via A-Frame components. Is there a perf reason to do so?
        el.addEventListener('mouseenter', (e) => {
          if (this.isCloseEnoughToInteract(el)) {
            this.cursor.setAttribute('material', 'color', 'green')
          }
        })

        el.addEventListener('mouseleave', (e) => {
          this.cursor.setAttribute('material', 'color', 'black')
        })
      } else if (this.state.mode === Mode.EDIT) {
        el.addEventListener('mouseenter', (e) => {
          this.cursor.setAttribute('material', 'color', 'green')
        })

        el.addEventListener('mouseleave', (e) => {
          this.cursor.setAttribute('material', 'color', 'black')
        })
      }


      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        if (!this.state.holding) {
          const id: string = (e.target as Element).getAttribute('objectId')!
          const obj = this.state.objects[id]

          this.pickUp(obj)
        }

        return false;
      }, false);

      el.addEventListener('click', (e) => { 
        this.objectLastClicked = new Date()
  
        const id: string = (e.target as Element).getAttribute('objectId')!
        const obj = this.state.objects[id]
  
        if (this.state.mode === Mode.PLAY) {
          if (obj.text) {
            if (obj.text === this.state.text) {
              this.hideText()
            } else {
              if (this.isCloseEnoughToInteract(el, 3)) {
                this.showText(obj.text)
              }
            }
          }
        } else if (this.state.mode === Mode.EDIT) {
          const newText = prompt("Enter some dialog")
          if (newText) {
            obj.text = newText
            // TODO: Need to set on state, or does pass-by-reference save us?
            // If the latter, this points towards a redux-like unidirectional data flow
          }
        }
      })
    }

    return el
  }

  showText(text: string) {
    if (this.state.text) {
      this.hideText()
    }

    this.state.text = text

    const textEl = document.createElement('a-entity')
    textEl.setAttribute('text', {
      align: "center",
      font: './Roboto-msdf.json',
      value: this.state.text, 
      width: 2.0
    })
    textEl.setAttribute('position', '0 -0.5 -0.8')

    this.camera.appendChild(textEl)
    this.textEl = textEl
  }

  hideText() {
    if (!(this.textEl && this.textEl.parentNode)) { return }

    this.textEl.parentNode.removeChild(this.textEl)
    delete this.textEl
    delete this.state.text
  }

  pickUp(obj: Billboard) {
    const el = this.elMap[obj.id]

    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }

    delete this.elMap[obj.id]

    const holdingEl = this.entityForObject(obj, true)
    this.camera.appendChild(holdingEl)

    this.state.holding = obj.id
    this.holdingEl = holdingEl

    this.cursor.setAttribute('visible', 'false')
  }

  placeBillboard() {
    if (!(this.holdingEl && this.state.holding)) { return }

    const obj = this.state.objects[this.state.holding]
    obj.position = (this.holdingEl as any).object3D.getWorldPosition()

    if (this.holdingEl.parentNode) {
      obj.rotation = (this.holdingEl.parentNode as HTMLElement).getAttribute('rotation') || undefined
      this.holdingEl.parentNode.removeChild(this.holdingEl)
    }

    this.state.holding = undefined
    delete this.holdingEl

    const newEl = this.entityForObject(obj)
    this.elMap[obj.id] = newEl
    this.el.appendChild(newEl)

    this.cursor.setAttribute('visible', 'true')
  }

  changeMode(mode: Mode) {
    if (this.state.mode === Mode.EDIT) {
      if (this.state.holding) {
        this.placeBillboard()
      }
    } else if (this.state.mode === Mode.PLAY) {
      if (this.state.text) {
        this.hideText()
      }
    }

    this.state.mode = mode

    this.rig.setAttribute('movement-controls', `fly: ${mode === Mode.EDIT}`)
  }

  private isCloseEnoughToInteract(el: AFrameElement, threshold: number = 3) {
    const position: Vector3 = (el.getAttribute('position') as any) as Vector3
    const cameraPos: any = this.rig.getAttribute('position')

    if (cameraPos === undefined || cameraPos.x === undefined) { return }
    const distance = Math.sqrt(
      Math.pow(position.x - cameraPos.x, 2) +
      Math.pow(position.z - cameraPos.z, 2)
    )

    return distance < threshold
  }

  private imageForObject(obj: Billboard): string|undefined {
    if (obj.image) {
      return obj.image
    } else if (obj.animation) {
      return obj.animation.images[obj.animation.currentFrame]
    } else {
      return undefined
    }
  }
}

export default App