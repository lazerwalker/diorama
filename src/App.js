import 'aframe';

// See how the default event system works in terms of clicking on things, and if I can get the behavior I want of "click on anything = remove text"
require('aframe-extras');
require('aframe-look-at-component')

const Mode = {
  EDIT: "edit",
  PLAY: "play"
}

class App {
  state = {
    mode: Mode.PLAY,
    objects: {
      "wol": {
        animation: {
          currentFrame: 1,
          framerate: 300,
          images: ["#wol", "#wol2"]
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
        width: 1.4
      }
    }
  }
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

    this.el = document.querySelector('a-scene');
    this.elMap = {};

    Object.keys(this.state.objects).forEach(key => {
      const element = this.state.objects[key]
      const el = this.entityForObject(element)
      this.elMap[key] = el
      this.el.appendChild(el)
    });

    this.el.addEventListener('click', (e) => {
      if (!e.isTrusted) { return }

      // If we clicked on an actual object, we don't want to fire this object.
      // However, these 'real' events fire before the synthetic object click events,
      // so we need to wait to make sure we didn't receive one of those
      // (and because they're synthetic, we can't just stop propagation)
      setTimeout(() => {
        const now = new Date()
        if (now - this.objectLastClicked < 200) { return }
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

  createScene() {
    const el = document.createElement('a-scene');
    el.id= "scene"
    el.setAttribute('cursor', 'rayOrigin: mouse')

    const assetList = {
      wol: "WoL.png",
      wol2: "WoL2.png"
    }

    const assets = document.createElement('a-assets')
    Object.keys(assetList).forEach((key) => {
      const img = document.createElement('img')
      img.id = key
      img.src = assetList[key]

      assets.appendChild(img)
    })
    el.appendChild(assets)

    const rig = document.createElement('a-entity')
    rig.id = 'rig'
    rig.setAttribute('movement-control')
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

    document.getElementById('root').appendChild(el)
    this.el = el
  }

  tryToShowDialog(el, oldTextObj) {
    if (el === oldTextObj) { return }

    let obj = this.state.objects[el.id]
    if (!(obj && obj.text)) { return }

    const position = el.getAttribute('position')
    const cameraPos = this.rig.getAttribute('position')

    if (cameraPos.x !== undefined) {
      const distance = Math.sqrt(
        Math.pow(position.x - cameraPos.x, 2) +
        Math.pow(position.z - cameraPos.z, 2)
      )

      if (distance < 3) {
        this.setText(obj.text)
      }
    }
  }

  entityForObject(o, isHolding) {
    var el = document.createElement('a-image');
    Object.keys(o).forEach((key) => {
      el.setAttribute(key, o[key])
    })

    el.objectId = o.id

    let material = {
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
      el.addEventListener('click', (e) => { 
        this.objectLastClicked = new Date()
  
        const id = e.target.objectId
        const obj = this.state.objects[id]
  
        if (this.state.mode === Mode.PLAY) {
          if (obj.text) {
            if (obj.text === this.state.text) {
              this.hideText()
            } else {
              this.showText(obj.text)
            }
          }
        } else if (this.state.mode === Mode.EDIT) {
          if (!this.state.holding) {
            this.pickUp(obj)
          }
        }
      })
    }

    return el
  }

  showText(text) {
    if (this.state.text) {
      this.hideText()
    }

    this.state.text = text

    const textEl = document.createElement('a-entity')
    textEl.setAttribute('text', {value: this.state.text, width: 2.0, align: "center"})
    textEl.setAttribute('position', '0 -0.5 -0.8')

    this.camera.appendChild(textEl)
    this.textEl = textEl
  }

  hideText() {
    this.textEl.parentNode.removeChild(this.textEl)
    delete this.textEl
    delete this.state.text
  }

  pickUp(obj) {
    const el = this.elMap[obj.id]

    el.parentNode.removeChild(el)
    delete this.elMap[obj.id]

    const holdingEl = this.entityForObject(obj, true)
    this.camera.appendChild(holdingEl)

    this.state.holding = obj.id
    this.state.holdingEl = holdingEl

    this.cursor.setAttribute('visible', false)
  }

  placeBillboard() {
    const holdingEl = this.state.holdingEl

    const obj = this.state.objects[this.state.holding]
    obj.position = holdingEl.object3D.getWorldPosition()
    obj.rotation = holdingEl.parentNode.getAttribute('rotation')

    holdingEl.parentNode.removeChild(holdingEl)

    this.state.holding = undefined
    this.state.holdingEl = undefined

    const newEl = this.entityForObject(obj)
    this.elMap[obj.id] = newEl
    this.el.appendChild(newEl)

    this.cursor.setAttribute('visible', true)
  }

  imageForObject(obj) {
    if (obj.image) {
      return obj.image
    } else {
      return obj.animation.images[obj.animation.currentFrame]
    }
  }
}

export default App